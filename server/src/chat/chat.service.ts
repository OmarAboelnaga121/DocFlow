import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { RetrievedContextChunkDto } from './dto/retrieved-context-chunk.dto';
import { MessageRole, UserRole } from '@prisma/client';
import { OpenAI } from 'openai';
import { RedisService } from '../redis/redis.service';

const QWEN_MODEL_CREDIT_COST: Record<string, number> = {
  'qwen3.7-plus': 2,
  'qwen3.7-max': 3,
  'qwen3.7-flash': 1,
  'qwen3.6-plus': 2,
};

const QWEN_MODEL_LEDGER_REASON: Record<string, string> = {
  'qwen3.7-plus': 'llm_generation_qwen3.7-plus',
  'qwen3.7-max': 'llm_generation_qwen3.7-max',
  'qwen3.7-flash': 'llm_generation_qwen3.7-flash',
  'qwen3.6-plus': 'llm_generation_qwen3.6-plus',
};

@Injectable()
export class ChatService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(ChatService.name);
  private static readonly CHAT_CACHE_TTL = 3600; // 1 hour TTL

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is required. Set it before starting the server.',
      );
    }

    this.openai = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });
  }

  private async invalidateChatCache(chatId: string): Promise<void> {
    await this.redis.invalidateCache([
      `chat:${chatId}`,
      `chat-messages:${chatId}`,
    ]);
  }

  async createChat(userId: string, createChatDto: CreateChatDto) {
    const repo = await this.prisma.repo.findFirst({
      where: {
        id: createChatDto.repoId,
        userId,
      },
    });

    if (!repo) {
      throw new NotFoundException(
        `Repository with ID "${createChatDto.repoId}" not found`,
      );
    }

    return this.prisma.chat.create({
      data: {
        userId,
        repoId: createChatDto.repoId,
        title: createChatDto.title || 'New Chat',
      },
      include: {
        repo: {
          select: {
            id: true,
            name: true,
            branch: true,
            status: true,
          },
        },
      },
    });
  }

  async getChatById(userId: string, chatId: string) {
    const chat = await this.redis.getOrSet(
      `chat:${chatId}`,
      ChatService.CHAT_CACHE_TTL,
      async () => {
        const found = await this.prisma.chat.findUnique({
          where: { id: chatId },
          include: {
            repo: {
              select: {
                id: true,
                name: true,
                branch: true,
                status: true,
                url: true,
              },
            },
            messages: {
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        });

        if (!found) {
          throw new NotFoundException(
            `Chat session with ID "${chatId}" not found`,
          );
        }

        return found;
      },
    );

    if (chat.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this chat',
      );
    }

    return chat;
  }

  async getChatMessages(userId: string, chatId: string) {
    // 1. Verify existence & tenant ownership (uses cached chat session if present)
    await this.getChatById(userId, chatId);

    // 2. Cache-aside for the raw messages array
    return this.redis.getOrSet(
      `chat-messages:${chatId}`,
      ChatService.CHAT_CACHE_TTL,
      async () => {
        return this.prisma.message.findMany({
          where: { chatId },
          orderBy: {
            createdAt: 'asc',
          },
        });
      },
    );
  }

  async sendMessage(userId: string, chatId: string, dto: SendMessageDto) {
    // Step 1: The user sends a message to the chat.
    // Step 2: Validate that the chat exists and belongs to the authenticated user.
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        user: {
          select: {
            userRole: true,
            creditBalance: true,
          },
        },
        repo: {
          include: {
            analysis: true,
            files: true,
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException(`Chat session with ID "${chatId}" not found`);
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this chat',
      );
    }

    // Step 3: Check that the user still has enough credits before we generate the response.
    const selectedModel = dto.model || process.env.OPENAI_MODEL || 'qwen3.7-plus';
    const responseCostCredits =
      QWEN_MODEL_CREDIT_COST[selectedModel] ?? QWEN_MODEL_CREDIT_COST['qwen3.7-plus'];
    const userCreditBalance = chat.user?.creditBalance ?? 0;

    if (userCreditBalance < responseCostCredits) {
      throw new BadRequestException(
        'Not enough credits to generate a response. Please top up your account.',
      );
    }

    // Step 4: Save the incoming user message before processing the request.
    const userMessage = await this.prisma.message.create({
      data: {
        chatId,
        role: MessageRole.USER,
        content: dto.content,
      },
    });

    // Step 5: Retrieval stage - search the repository for the most relevant code context.
    const contextChunks = await this.performRagSearch(chat.repoId, dto.content);

    // Step 6: Load recent chat history so the reply can stay consistent with prior turns.
    const history = await this.prisma.message.findMany({
      where: {
        chatId,
        id: { not: userMessage.id },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
    history.reverse();

    // Step 7: Build the repository context and final prompt for the LLM.
    let repoOverview = `Repository Name: ${chat.repo.name}\nBranch: ${chat.repo.branch}\nStatus: ${chat.repo.status}\n`;
    if (chat.repo.analysis) {
      const apis =
        (chat.repo.analysis.apis as Array<{
          method: string;
          endpoint: string;
          description?: string;
          file?: string;
        }>) || [];
      const pages =
        (chat.repo.analysis.pages as Array<{
          route?: string;
          routePath?: string;
          description?: string;
          file?: string;
        }>) || [];
      if (apis.length > 0) {
        repoOverview += `\nIdentified Backend APIs:\n${apis
          .slice(0, 15)
          .map(
            (a) => `- [${a.method}] ${a.endpoint} (${a.description || a.file})`,
          )
          .join('\n')}\n`;
      }
      if (pages.length > 0) {
        repoOverview += `\nIdentified Frontend Pages:\n${pages
          .slice(0, 15)
          .map(
            (p) => `- ${p.route || p.routePath} (${p.description || p.file})`,
          )
          .join('\n')}\n`;
      }
    }

    const formattedChunks =
      contextChunks.length > 0
        ? contextChunks
            .map(
              (chunk, idx) =>
                `[Source ${idx + 1}] File: ${chunk.filePath} (Lines ${chunk.startLine}-${chunk.endLine}):\n${chunk.content}`,
            )
            .join('\n\n')
        : 'No specific code chunks retrieved for this query.';

    const userRole = chat.user?.userRole || UserRole.USER;
    let systemPrompt = '';

    if (userRole === UserRole.BUSINESS) {
      systemPrompt = `You are DocFlow AI, an expert technical-to-business translator. Your primary mission is to explain complex software codebases to product managers, business stakeholders, and non-technical leaders.

**Core Directives:**

1. **Focus on Business Value:** Translate code, architecture, and features into capabilities, user workflows, and business outcomes. Always answer two questions: "What does this accomplish?" and "Why does it matter to the business or user?"
2. **Zero-Jargon Policy:** Write in crisp, professional business English. Strictly avoid low-level technical jargon (e.g., AST, specific framework names, raw code dumps) unless explicitly requested. 
3. **Strategic Analogies:** If the user explicitly asks for technical definitions or code explanations, bridge the gap using intuitive, professional real-world analogies. Keep the tone accessible and straightforward, never condescending.
4. **Scannable Structure:** Optimize for readability. Use clear headings (###), concise bullet points for workflows, and bold text to highlight key capabilities. Avoid dense, long-winded paragraphs.
5. **Context-Bound Honesty:** Base your answers entirely on the provided repository context. If information cannot be determined, state clearly: "This capability or feature is not detailed in the provided codebase context." Do not guess or assume.`;
    } else {
      systemPrompt = `You are DocFlow AI, an expert-level Principal Software Engineer and codebase assistant. Your primary mission is to provide highly precise, technically rigorous, and actionable insights based strictly on the provided repository context.

**Core Directives:**

1. **Technical & Architectural Depth:** Analyze and explain complex implementations, data flows, API contracts, database schemas, and design patterns. Focus on system mechanics, type safety, and architectural intent rather than surface-level summaries.
2. **Mandatory Precision Citations:** You must cite exact source file paths and line numbers inline whenever referencing, explaining, or reproducing code (e.g., [src/modules/user.service.ts:42]). 
3. **Production-Grade Code Delivery:** Use strictly typed, properly highlighted Markdown code blocks for all snippets, interfaces, or database models. If proposing refactors, ensure the code is clean, maintainable, and production-aware.
4. **Context-Strict Accuracy:** Base your analysis entirely on the provided context chunks. Do not hallucinate dependencies, files, or logic. If a required implementation detail is missing, state exactly what is missing: "The specific logic for [feature/component] cannot be deduced from the provided context."
5. **Engineering Nuance:** When analyzing codebases, actively highlight relevant performance considerations, structural trade-offs, or potential edge cases if they are apparent in the provided context.
6. **Structured Clarity:** Format responses using clear headings, concise bullet points for workflows, and logical separation between architecture explanation and code specifics.`;
    }

    const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({
        role: (m.role === MessageRole.USER
          ? 'user'
          : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
      {
        role: 'user',
        content: `Repository Overview:\n${repoOverview}\n\nRetrieved Code Context:\n${formattedChunks}\n\nUser Question:\n${dto.content}`,
      },
    ];

    // Step 8: Generate the AI response with the selected model.
    let aiContent = '';
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is required. Set it before starting the server.',
      );
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: selectedModel,
        messages: openAiMessages,
        temperature: 0.2,
      });

      aiContent =
        completion.choices[0]?.message?.content ||
        'Unable to generate a response at this time.';
    } catch (error) {
      this.logger.error('OpenAI chat completion failed:', error);
      throw error;
    }

    // Step 9: Save the AI answer and the retrieved code context for this chat.
    const aiMessage = await this.prisma.message.create({
      data: {
        chatId,
        role: MessageRole.AI,
        content: aiContent,
        context: JSON.parse(JSON.stringify(contextChunks)),
      },
    });

    // Step 10: Record the exact usage cost in the credit ledger, deduct the balance, clear caches, and return the final answer.
    const ledgerReason =
      QWEN_MODEL_LEDGER_REASON[selectedModel] ||
      `llm_generation_${selectedModel}`;

    await this.prisma.creditLedger.create({
      data: {
        userId,
        amount: -responseCostCredits,
        reason: ledgerReason,
        referenceId: `chat_message_${userMessage.id}`,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        creditBalance: {
          decrement: responseCostCredits,
        },
      },
    });
    await this.invalidateChatCache(chatId);

    return aiMessage;
  }

  private async performRagSearch(
    repoId: string,
    query: string,
    topK = 5,
  ): Promise<RetrievedContextChunkDto[]> {
    const results: RetrievedContextChunkDto[] = [];
    const seenChunkIds = new Set<string>();

    // 1. Direct File / Path Matching (e.g., user asks for "auth.service.ts")
    const fileMatches = query.match(/[\w\-./]+\.[a-zA-Z0-9]+/g) || [];
    if (fileMatches.length > 0) {
      for (const fileName of fileMatches) {
        try {
          const directChunks = await this.prisma.codeChunk.findMany({
            where: {
              file: {
                repoId,
                path: { contains: fileName, mode: 'insensitive' },
              },
            },
            include: {
              file: { select: { path: true } },
            },
            take: 4,
          });

          for (const chunk of directChunks) {
            if (!seenChunkIds.has(chunk.id)) {
              seenChunkIds.add(chunk.id);
              results.push({
                id: chunk.id,
                content: chunk.content,
                startLine: chunk.startLine,
                endLine: chunk.endLine,
                filePath: chunk.file.path,
                similarity: 1.0,
              });
            }
          }
        } catch (fileErr) {
          this.logger.warn(
            `Direct file matching failed for ${fileName}:`,
            fileErr,
          );
        }
      }
    }

    // 2. Vector Similarity Search
    try {
      const queryEmbedding = await this.getEmbedding(query);
      if (queryEmbedding && queryEmbedding.length > 0) {
        const embeddingString = `[${queryEmbedding.join(',')}]`;

        const vectorChunks = await this.prisma.$queryRawUnsafe<
          RetrievedContextChunkDto[]
        >(
          `
          SELECT 
            cc.id,
            cc.content,
            cc."startLine",
            cc."endLine",
            f.path AS "filePath",
            1 - (cc.embedding <=> $1::vector) AS similarity
          FROM "CodeChunk" cc
          JOIN "File" f ON cc."fileId" = f.id
          WHERE f."repoId" = $2
            AND cc.embedding IS NOT NULL
          ORDER BY cc.embedding <=> $1::vector ASC
          LIMIT $3
          `,
          embeddingString,
          repoId,
          topK,
        );

        for (const chunk of vectorChunks) {
          if (!seenChunkIds.has(chunk.id)) {
            seenChunkIds.add(chunk.id);
            results.push(chunk);
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Vector similarity search failed for repo ${repoId}:`,
        error,
      );
    }

    // 3. Fallback: Keyword Search across content and file paths
    if (results.length === 0) {
      const keywords = query
        .toLowerCase()
        .replace(/[^a-z0-9_\-\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 3);

      for (const keyword of keywords) {
        try {
          const keywordChunks = await this.prisma.codeChunk.findMany({
            where: {
              file: { repoId },
              OR: [
                { content: { contains: keyword, mode: 'insensitive' } },
                { file: { path: { contains: keyword, mode: 'insensitive' } } },
              ],
            },
            include: {
              file: { select: { path: true } },
            },
            take: 3,
          });

          for (const chunk of keywordChunks) {
            if (!seenChunkIds.has(chunk.id)) {
              seenChunkIds.add(chunk.id);
              results.push({
                id: chunk.id,
                content: chunk.content,
                startLine: chunk.startLine,
                endLine: chunk.endLine,
                filePath: chunk.file.path,
                similarity: 0.5,
              });
            }
          }
        } catch (kwErr) {
          this.logger.warn(`Keyword search failed for ${keyword}:`, kwErr);
        }

        if (results.length >= topK) break;
      }
    }

    return results.slice(0, topK);
  }

  private async getEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is required. Set it before starting the server.',
      );
    }

    const model = process.env.EMBEDDING_MODEL || 'text-embedding-v3';

    try {
      const response = await this.openai.embeddings.create({
        model,
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Failed to generate embedding for query:', error);
      throw error;
    }
  }
}
