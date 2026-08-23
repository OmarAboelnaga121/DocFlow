import { Injectable } from '@nestjs/common';
import { CreateRepoDto } from './dto/create-repo.dto';
import { PrismaService } from '../prisma/prisma.service';
import simpleGit from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { OpenAI } from 'openai';
import { RepoAnalysisService } from './repo-analysis/repo-analysis.service';

@Injectable()
export class RepositoryService {
    private readonly openai: OpenAI;

    constructor(
        private readonly prisma: PrismaService,
        private readonly repoAnalysisService: RepoAnalysisService
    ) {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'mock-key',
            baseURL: process.env.OPENAI_BASE_URL || undefined,
        });
    }

    async createRepo(userId: string, repo: CreateRepoDto) {
        // 1. Create the repository entry in PENDING status
        const repository = await this.prisma.repo.create({
            data: {
                name: repo.name,
                branch: repo.branch || 'main',
                url: repo.url,
                userId: userId,
                status: 'PENDING',
            },
        });

        // 2. Perform the ingestion process in the background
        this.ingestRepository(repository.id, repo.url, repo.branch || 'main').catch((err) => {
            console.error(`Background ingestion failed for repository ${repository.id}:`, err);
        });

        // 3. Return the pending repository metadata immediately
        return repository;
    }

    private async ingestRepository(repoId: string, url: string, branch: string) {
        const clonePath = path.join(os.tmpdir(), `docflow-clone-${repoId}`);

        try {
            // Clean up any stale directory from a previous run
            if (fs.existsSync(clonePath)) {
                fs.rmSync(clonePath, { recursive: true, force: true });
            }

            // Transition to CLONING state
            await this.prisma.repo.update({
                where: { id: repoId },
                data: { status: 'CLONING' },
            });

            // Clone repository using shallow clone (depth 1)
            const git = simpleGit();
            await git.clone(url, clonePath, ['--depth', '1', '--single-branch', '-b', branch]);

            // Transition to EMBEDDING state
            await this.prisma.repo.update({
                where: { id: repoId },
                data: { status: 'EMBEDDING' },
            });

            // Get all text/code files recursively
            const filePaths = this.getAllFiles(clonePath);

            for (const filePath of filePaths) {
                const relativePath = path.relative(clonePath, filePath);
                const content = fs.readFileSync(filePath, 'utf-8');
                const contentHash = crypto.createHash('md5').update(content).digest('hex');

                // Save file metadata to Database
                const fileRecord = await this.prisma.file.create({
                    data: {
                        repoId: repoId,
                        path: relativePath,
                        language: this.getLanguageFromExtension(filePath),
                        contentHash: contentHash,
                    },
                });

                // Chunk content (1200 characters chunk, 200 characters overlap)
                const chunks = this.chunkText(content, 1200, 200);

                for (const chunk of chunks) {
                    // Save code chunk metadata
                    const codeChunk = await this.prisma.codeChunk.create({
                        data: {
                            fileId: fileRecord.id,
                            content: chunk.content,
                            startLine: chunk.startLine,
                            endLine: chunk.endLine,
                        },
                    });

                    // Generate vector embedding
                    const embedding = await this.getEmbedding(chunk.content);

                    // Insert pgvector embedding via raw query since Prisma client's 
                    // auto-generated types don't natively support setting the vector type directly.
                    const embeddingString = `[${embedding.join(',')}]`;
                    await this.prisma.$executeRawUnsafe(
                        `UPDATE "CodeChunk" SET "embedding" = $1::vector WHERE "id" = $2`,
                        embeddingString,
                        codeChunk.id
                    );
                }
            }

            // Transition to ANALYZING state
            await this.prisma.repo.update({
                where: { id: repoId },
                data: { status: 'ANALYZING' },
            });

            // Analyze the repository structure to extract backend endpoints and frontend page routes
            await this.repoAnalysisService.analyzeRepositoryStructure(repoId);

            // Transition to COMPLETED state
            await this.prisma.repo.update({
                where: { id: repoId },
                data: { status: 'COMPLETED' },
            });

        } catch (error) {
            console.error(`Error during repository ingestion:`, error);
            // Transition to FAILED state on error
            await this.prisma.repo.update({
                where: { id: repoId },
                data: { status: 'FAILED' },
            });
        } finally {
            // Guarantee cleanup of the local cloned repository filesystem
            if (fs.existsSync(clonePath)) {
                fs.rmSync(clonePath, { recursive: true, force: true });
            }
        }
    }

    private async getEmbedding(text: string): Promise<number[]> {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey || apiKey === 'mock-key') {
            // Fallback: Generate mock 1536-dimensional vector for development
            return Array.from({ length: 1536 }, () => Math.random() - 0.5);
        }

        try {
            const response = await this.openai.embeddings.create({
                model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
                input: text,
            });
            return response.data[0].embedding;
        } catch (error) {
            console.warn(`OpenAI embedding failed, falling back to mock: ${error.message}`);
            return Array.from({ length: 1536 }, () => Math.random() - 0.5);
        }
    }

    private getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
        const files = fs.readdirSync(dirPath);

        for (const file of files) {
            // Skip hidden folders (.git, .github) and dependencies
            if (file.startsWith('.') || file === 'node_modules') continue;

            const filePath = path.join(dirPath, file);
            try {
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    this.getAllFiles(filePath, arrayOfFiles);
                } else if (stat.isFile() && this.isTextFile(file)) {
                    arrayOfFiles.push(filePath);
                }
            } catch (err) {
                // Ignore unreadable files or broken symlinks
            }
        }
        return arrayOfFiles;
    }

    private isTextFile(filename: string): boolean {
        const TEXT_EXTENSIONS = new Set([
            '.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx', '.html', '.css',
            '.py', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.sh',
            '.yml', '.yaml', '.toml', '.xml', '.ini', '.cfg', '.env', '.prisma',
            '.graphql', '.sql', '.rb', '.php', '.swift', '.kt', '.gradle'
        ]);
        const ext = path.extname(filename).toLowerCase();
        return TEXT_EXTENSIONS.has(ext);
    }

    private getLanguageFromExtension(filePath: string): string | null {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
            case '.ts':
            case '.tsx':
                return 'typescript';
            case '.js':
            case '.jsx':
                return 'javascript';
            case '.py':
                return 'python';
            case '.go':
                return 'go';
            case '.rs':
                return 'rust';
            case '.java':
                return 'java';
            case '.c':
                return 'c';
            case '.cpp':
                return 'cpp';
            case '.h':
            case '.hpp':
                return 'c-header';
            case '.cs':
                return 'csharp';
            case '.sh':
                return 'shell';
            case '.yml':
            case '.yaml':
                return 'yaml';
            case '.toml':
                return 'toml';
            case '.json':
                return 'json';
            case '.md':
                return 'markdown';
            case '.html':
                return 'html';
            case '.css':
                return 'css';
            default:
                return null;
        }
    }

    private chunkText(
        text: string,
        chunkSize: number,
        chunkOverlap: number,
    ): { content: string; startLine: number; endLine: number }[] {
        const lines = text.split('\n');
        const chunks: { content: string; startLine: number; endLine: number }[] = [];

        let currentLines: string[] = [];
        let currentLength = 0;
        let startLine = 1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            currentLines.push(line);
            currentLength += line.length + 1;

            if (currentLength >= chunkSize || i === lines.length - 1) {
                chunks.push({
                    content: currentLines.join('\n'),
                    startLine: startLine,
                    endLine: i + 1,
                });

                // Support sliding window overlap
                const overlapLinesCount = Math.min(3, currentLines.length - 1);
                if (overlapLinesCount > 0 && i < lines.length - 1) {
                    currentLines = currentLines.slice(-overlapLinesCount);
                    currentLength = currentLines.reduce((acc, l) => acc + l.length + 1, 0);
                    startLine = i + 1 - overlapLinesCount + 1;
                } else {
                    currentLines = [];
                    currentLength = 0;
                    startLine = i + 2;
                }
            }
        }
        return chunks;
    }
}
