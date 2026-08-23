import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenAI } from 'openai';

@Injectable()
export class RepoAnalysisService {
    private readonly openai: OpenAI;
    private readonly logger = new Logger(RepoAnalysisService.name);

    constructor(private readonly prisma: PrismaService) {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'mock-key',
            baseURL: process.env.OPENAI_BASE_URL || undefined,
        });
    }

    async analyzeRepositoryStructure(repoId: string) {
        this.logger.log(`Starting structural analysis for repo: ${repoId}`);

        // 1. Fetch files likely to contain routes, APIs, or pages
        const relevantFiles = await this.prisma.file.findMany({
            where: {
                repoId,
                OR: [
                    { path: { contains: 'controller' } },
                    { path: { contains: 'route' } },
                    { path: { contains: 'api' } },
                    { path: { contains: 'page' } },
                    { path: { contains: 'app/' } }, // Next.js app router
                    { path: { contains: 'pages/' } } // Next.js pages router
                ]
            },
            include: {
                chunks: {
                    orderBy: {
                        startLine: 'asc'
                    }
                }
            }
        });

        if (!relevantFiles.length) {
            this.logger.warn(`No routing files found for repo ${repoId}`);
            return;
        }

        // 2. Reconstruct file contents from chunks for context
        let combinedContext = '';
        for (const file of relevantFiles) {
            const fileContent = file.chunks.map(c => c.content).join('\n');
            combinedContext += `\n--- FILE: ${file.path} ---\n${fileContent}\n`;
        }

        // Token safety check (truncate roughly to fit context limits if massive)
        const maxChars = 300000; // Roughly ~75k tokens
        if (combinedContext.length > maxChars) {
            combinedContext = combinedContext.substring(0, maxChars);
        }

        // 3. Call OpenAI with Strict JSON Schema
        try {
            const extraction = await this.extractArchitectureWithAI(combinedContext);
            
            // 4. Save to Database (RepoAnalysis summary)
            const analysis = await this.prisma.repoAnalysis.upsert({
                where: { repoId },
                update: {
                    apis: extraction.apis,
                    pages: extraction.pages,
                },
                create: {
                    repoId,
                    apis: extraction.apis,
                    pages: extraction.pages,
                }
            });

            // 5. Sync individual ApiEndpoint and PageRoute tables using the saved data
            await this.syncEndpointsAndRoutesFromAnalysis(repoId, analysis.apis, analysis.pages);

            this.logger.log(`Analysis complete for repo: ${repoId}`);
        } catch (error) {
            this.logger.error(`Failed to analyze repo ${repoId}:`, error);
        }
    }

    private async extractArchitectureWithAI(codeContext: string) {
        const response = await this.openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini', // Cost-effective for large contexts
            messages: [
                {
                    role: 'system',
                    content: 'You are a senior software architect. Analyze the provided codebase files and extract all API endpoints and frontend page routes. Return ONLY valid JSON matching the schema.'
                },
                {
                    role: 'user',
                    content: codeContext
                }
            ],
            response_format: {
                type: 'json_schema',
                json_schema: {
                    name: 'architecture_extraction',
                    schema: {
                        type: 'object',
                        properties: {
                            apis: {
                                type: 'array',
                                description: 'List of backend API endpoints found in the code.',
                                items: {
                                    type: 'object',
                                    properties: {
                                        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'ALL'] },
                                        endpoint: { type: 'string', description: 'The URL path, e.g., /api/v1/users' },
                                        description: { type: 'string', description: 'Brief summary of what the endpoint does' },
                                        file: { type: 'string', description: 'The file path where this is defined' }
                                    },
                                    required: ['method', 'endpoint', 'description', 'file'],
                                    additionalProperties: false
                                }
                            },
                            pages: {
                                type: 'array',
                                description: 'List of frontend pages/routes found in the code.',
                                items: {
                                    type: 'object',
                                    properties: {
                                        route: { type: 'string', description: 'The frontend route path, e.g., /dashboard/settings' },
                                        description: { type: 'string', description: 'Brief summary of what this page displays' },
                                        file: { type: 'string', description: 'The file path where this is defined' }
                                    },
                                    required: ['route', 'description', 'file'],
                                    additionalProperties: false
                                }
                            }
                        },
                        required: ['apis', 'pages'],
                        additionalProperties: false
                    },
                    strict: true
                }
            }
        });

        const result = response.choices[0].message.content;
        if (!result) {
            throw new Error('Failed to extract repository architecture: OpenAI returned an empty response.');
        }
        return JSON.parse(result); // Strongly typed by OpenAI strict schema
    }

    private async syncEndpointsAndRoutesFromAnalysis(repoId: string, apisJson: any, pagesJson: any) {
        const apis = (apisJson as any[]) || [];
        const pages = (pagesJson as any[]) || [];

        // Fetch all files in the repo to map the AI's file path to database fileIds
        const files = await this.prisma.file.findMany({ where: { repoId } });

        const findFileId = (filePath: string): string => {
            const normalizedPath = filePath.replace(/\\/g, '/').replace(/^\.?\//, '');
            
            let matchedFile = files.find(f => f.path === normalizedPath);
            if (matchedFile) return matchedFile.id;

            matchedFile = files.find(f => 
                normalizedPath.endsWith(f.path) || f.path.endsWith(normalizedPath)
            );
            if (matchedFile) return matchedFile.id;

            return files[0]?.id || ''; // Fallback to first file if not found
        };

        // Populate ApiEndpoint entries
        const apiData = apis.map((api: any) => ({
            repoId,
            fileId: findFileId(api.file),
            path: api.endpoint,
            method: api.method,
            outputSchema: { description: api.description } as any,
        }));

        if (apiData.length > 0) {
            await this.prisma.apiEndpoint.createMany({ data: apiData });
        }

        // Populate PageRoute entries
        const pageData = pages.map((page: any) => ({
            repoId,
            fileId: findFileId(page.file),
            routePath: page.route,
            dependencies: { description: page.description } as any,
        }));

        if (pageData.length > 0) {
            await this.prisma.pageRoute.createMany({ data: pageData });
        }
    }
}
