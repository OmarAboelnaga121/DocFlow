import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
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
    private readonly logger = new Logger(RepositoryService.name);

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
            this.logger.error(`Background ingestion failed for repository ${repository.id}:`, err);
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

            // Capture latest commit hash from cloned repository
            const gitRepo = simpleGit(clonePath);
            const latestCommitHash = (await gitRepo.revparse(['HEAD'])).trim();

            // Transition to EMBEDDING state
            await this.prisma.repo.update({
                where: { id: repoId },
                data: { status: 'EMBEDDING' },
            });

            // Get all text/code files recursively
            const filePaths = this.getAllFiles(clonePath);
            this.logger.log(`[Repo ${repoId}] Ingestion started. Total text/code files found: ${filePaths.length}`);

            for (let i = 0; i < filePaths.length; i++) {
                const filePath = filePaths[i];
                const relativePath = path.relative(clonePath, filePath);
                const content = fs.readFileSync(filePath, 'utf-8');
                const contentHash = crypto.createHash('md5').update(content).digest('hex');

                this.logger.log(`[Repo ${repoId}] [${i + 1}/${filePaths.length}] Embedding file: ${relativePath}`);

                // Save file metadata to Database
                const fileRecord = await this.prisma.file.create({
                    data: {
                        repoId: repoId,
                        path: relativePath,
                        language: this.getLanguageFromExtension(filePath),
                        contentHash: contentHash,
                    },
                });

                // Chunk and generate embeddings in batch
                await this.processChunksAndEmbeddings(fileRecord.id, content);
            }

            // Transition to ANALYZING state
            this.logger.log(`[Repo ${repoId}] Embedding complete. Transitioning to ANALYZING...`);
            await this.prisma.repo.update({
                where: { id: repoId },
                data: { status: 'ANALYZING' },
            });

            // Analyze the repository structure to extract backend endpoints and frontend page routes
            await this.repoAnalysisService.analyzeRepositoryStructure(repoId);

            // Transition to COMPLETED state and persist commit hash
            this.logger.log(`[Repo ${repoId}] Analysis complete. Repository ingestion successfully finished.`);
            await this.prisma.repo.update({
                where: { id: repoId },
                data: {
                    status: 'COMPLETED',
                    latestCommitHash,
                },
            });

        } catch (error) {
            this.logger.error(`Error during repository ingestion:`, error);
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

    /**
     * Re-sync an existing repository with upstream remote changes.
     * Follows the verification pipeline:
     * 1. Access Check -> 2. Existence Check -> 3. Remote Commit Check -> 4. Diff & Sync -> 5. Analysis
     */
    async syncRepo(repoId: string, userId: string) {
        // Step 1 & 2: Check existence and access permissions
        const repo = await this.prisma.repo.findUnique({
            where: { id: repoId },
        });

        if (!repo) {
            throw new NotFoundException('Repository not found');
        }

        if (repo.userId !== userId) {
            throw new ForbiddenException('You do not have permission to access this repository');
        }

        // Prevent concurrent ingestion or sync executions
        if (['PENDING', 'CLONING', 'EMBEDDING', 'ANALYZING'].includes(repo.status)) {
            throw new BadRequestException('Repository sync or ingestion is already in progress');
        }

        // Step 3: Check if the repository already has the latest commit
        const remoteCommitHash = await this.getRemoteLatestCommit(repo.url, repo.branch);

        if (remoteCommitHash && repo.latestCommitHash && remoteCommitHash === repo.latestCommitHash) {
            return {
                message: 'Repository is already up to date',
                upToDate: true,
                repo,
            };
        }

        // Transition to PENDING and launch differential sync in background
        const updatedRepo = await this.prisma.repo.update({
            where: { id: repoId },
            data: { status: 'PENDING' },
        });

        this.performSyncRepository(repo.id, repo.url, repo.branch, remoteCommitHash).catch((err) => {
            this.logger.error(`Background incremental sync failed for repository ${repo.id}:`, err);
        });

        return {
            message: 'Repository sync initiated',
            upToDate: false,
            repo: updatedRepo,
        };
    }

    /**
     * Executes the incremental resync pipeline:
     * - Clones shallow repo
     * - Compares existing DB files vs current cloned files (New, Updated, Deleted)
     * - Re-indexes only new and modified files
     * - Runs architecture analysis
     * - Updates repository status and latest commit hash
     */
    private async performSyncRepository(
        repoId: string,
        url: string,
        branch: string,
        knownCommitHash?: string | null,
    ) {
        const clonePath = path.join(os.tmpdir(), `docflow-sync-${repoId}`);

        try {
            if (fs.existsSync(clonePath)) {
                fs.rmSync(clonePath, { recursive: true, force: true });
            }

            // Transition to CLONING state
            this.logger.log(`[Repo ${repoId}] Starting shallow clone from ${url} (branch: ${branch})...`);
            await this.prisma.repo.update({
                where: { id: repoId },
                data: { status: 'CLONING' },
            });

            // Clone repository branch
            const git = simpleGit();
            await git.clone(url, clonePath, ['--depth', '1', '--single-branch', '-b', branch]);

            const gitRepo = simpleGit(clonePath);
            const latestCommitHash = knownCommitHash || (await gitRepo.revparse(['HEAD'])).trim();

            // Fetch existing files from DB
            const existingFiles = await this.prisma.file.findMany({
                where: { repoId },
                select: { id: true, path: true, contentHash: true },
            });

            const existingFilesMap = new Map(existingFiles.map((f) => [f.path, f]));

            // Scan all text files from cloned repository
            const clonedFilePaths = this.getAllFiles(clonePath);
            const currentFilesMap = new Map<
                string,
                { fullPath: string; content: string; contentHash: string; language: string | null }
            >();

            for (const filePath of clonedFilePaths) {
                const relativePath = path.relative(clonePath, filePath);
                const content = fs.readFileSync(filePath, 'utf-8');
                const contentHash = crypto.createHash('md5').update(content).digest('hex');
                const language = this.getLanguageFromExtension(filePath);

                currentFilesMap.set(relativePath, {
                    fullPath: filePath,
                    content,
                    contentHash,
                    language,
                });
            }

            // Differential file categorization
            const newFiles: { relativePath: string; content: string; contentHash: string; language: string | null }[] = [];
            const updatedFiles: { id: string; relativePath: string; content: string; contentHash: string; language: string | null }[] = [];
            const deletedFileIds: string[] = [];

            // Detect new and updated files
            for (const [relativePath, currentFile] of currentFilesMap.entries()) {
                const existing = existingFilesMap.get(relativePath);
                if (!existing) {
                    newFiles.push({ relativePath, ...currentFile });
                } else if (existing.contentHash !== currentFile.contentHash) {
                    updatedFiles.push({ id: existing.id, relativePath, ...currentFile });
                }
            }

            // Detect deleted files
            for (const [relativePath, existing] of existingFilesMap.entries()) {
                if (!currentFilesMap.has(relativePath)) {
                    deletedFileIds.push(existing.id);
                }
            }

            this.logger.log(`[Repo ${repoId}] Diff results: ${newFiles.length} new, ${updatedFiles.length} updated, ${deletedFileIds.length} deleted.`);

            // Transition to EMBEDDING state
            await this.prisma.repo.update({
                where: { id: repoId },
                data: { status: 'EMBEDDING' },
            });

            // Process deleted files
            if (deletedFileIds.length > 0) {
                this.logger.log(`[Repo ${repoId}] Removing ${deletedFileIds.length} deleted files and stale chunks...`);
                await this.prisma.file.deleteMany({
                    where: { id: { in: deletedFileIds } },
                });
            }

            // Process updated files (remove old chunks and re-chunk with fresh embeddings)
            for (let i = 0; i < updatedFiles.length; i++) {
                const updated = updatedFiles[i];
                this.logger.log(`[Repo ${repoId}] [${i + 1}/${updatedFiles.length}] Re-embedding updated file: ${updated.relativePath}`);

                await this.prisma.codeChunk.deleteMany({
                    where: { fileId: updated.id },
                });

                await this.prisma.file.update({
                    where: { id: updated.id },
                    data: {
                        contentHash: updated.contentHash,
                        language: updated.language,
                    },
                });

                await this.processChunksAndEmbeddings(updated.id, updated.content);
            }

            // Process new files
            for (let i = 0; i < newFiles.length; i++) {
                const newFile = newFiles[i];
                this.logger.log(`[Repo ${repoId}] [${i + 1}/${newFiles.length}] Embedding new file: ${newFile.relativePath}`);

                const fileRecord = await this.prisma.file.create({
                    data: {
                        repoId,
                        path: newFile.relativePath,
                        language: newFile.language,
                        contentHash: newFile.contentHash,
                    },
                });

                await this.processChunksAndEmbeddings(fileRecord.id, newFile.content);
            }

            // Transition to ANALYZING state
            this.logger.log(`[Repo ${repoId}] Resync embeddings complete. Transitioning to ANALYZING...`);
            await this.prisma.repo.update({
                where: { id: repoId },
                data: { status: 'ANALYZING' },
            });

            // Re-run architectural extraction for updated repository state
            await this.repoAnalysisService.analyzeRepositoryStructure(repoId);

            // Transition to COMPLETED with updated commit hash
            this.logger.log(`[Repo ${repoId}] Resync successfully COMPLETED. HEAD commit: ${latestCommitHash}`);
            await this.prisma.repo.update({
                where: { id: repoId },
                data: {
                    status: 'COMPLETED',
                    latestCommitHash,
                },
            });

        } catch (error) {
            this.logger.error(`Error during incremental sync for repository ${repoId}:`, error);
            await this.prisma.repo.update({
                where: { id: repoId },
                data: { status: 'FAILED' },
            });
        } finally {
            if (fs.existsSync(clonePath)) {
                fs.rmSync(clonePath, { recursive: true, force: true });
            }
        }
    }

    /**
     * Resolves the latest remote commit SHA for a specific branch without cloning.
     */
    private async getRemoteLatestCommit(url: string, branch: string): Promise<string | null> {
        try {
            const git = simpleGit();
            const output = await git.listRemote(['--heads', url, branch]);
            if (output && output.trim()) {
                const match = output.trim().match(/^([0-9a-f]{40})/i);
                if (match) {
                    return match[1];
                }
            }

            const headOutput = await git.listRemote([url, 'HEAD']);
            if (headOutput && headOutput.trim()) {
                const match = headOutput.trim().match(/^([0-9a-f]{40})/i);
                if (match) {
                    return match[1];
                }
            }
            return null;
        } catch (error) {
            this.logger.warn(`Could not check remote commit hash for ${url} (${branch}): ${error.message}`);
            return null;
        }
    }

    /**
     * Chunks file content and inserts CodeChunks with batched pgvector embeddings.
     */
    private async processChunksAndEmbeddings(fileId: string, content: string): Promise<void> {
        const chunks = this.chunkText(content, 1200, 200);
        if (chunks.length === 0) return;

        // 1. Fetch embeddings in batch for all chunks of the file
        const chunkTexts = chunks.map((c) => c.content);
        const embeddings = await this.getEmbeddingsBatch(chunkTexts);

        // 2. Persist code chunks and vector embeddings concurrently
        await Promise.all(
            chunks.map(async (chunk, index) => {
                const codeChunk = await this.prisma.codeChunk.create({
                    data: {
                        fileId: fileId,
                        content: chunk.content,
                        startLine: chunk.startLine,
                        endLine: chunk.endLine,
                    },
                });

                const embedding = embeddings[index];
                if (embedding && embedding.length > 0) {
                    const embeddingString = `[${embedding.join(',')}]`;
                    await this.prisma.$executeRawUnsafe(
                        `UPDATE "CodeChunk" SET "embedding" = $1::vector WHERE "id" = $2`,
                        embeddingString,
                        codeChunk.id
                    );
                }
            })
        );
    }

    /**
     * Batch embedding generation (sends up to 25 text chunks per API request).
     */
    private async getEmbeddingsBatch(texts: string[]): Promise<number[][]> {
        if (texts.length === 0) return [];
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey || apiKey === 'mock-key') {
            return texts.map(() => Array.from({ length: 1536 }, () => Math.random() - 0.5));
        }

        try {
            const BATCH_SIZE = 25;
            const results: number[][] = [];

            for (let i = 0; i < texts.length; i += BATCH_SIZE) {
                const batch = texts.slice(i, i + BATCH_SIZE);
                const response = await this.openai.embeddings.create({
                    model: process.env.EMBEDDING_MODEL || 'text-embedding-v3',
                    input: batch,
                });

                const sorted = response.data.sort((a, b) => a.index - b.index);
                for (const item of sorted) {
                    results.push(item.embedding);
                }
            }

            return results;
        } catch (error) {
            this.logger.warn(`Batch embedding generation failed, falling back to mock: ${error.message}`);
            return texts.map(() => Array.from({ length: 1536 }, () => Math.random() - 0.5));
        }
    }

    private getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
        const IGNORED_DIRECTORIES = new Set([
            'node_modules', 'dist', 'build', '.next', '.git', 'coverage', '.turbo',
            '.vscode', '.idea', 'tmp', 'temp', 'out', '.cache', 'public/assets'
        ]);
        const IGNORED_FILES = new Set([
            'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', '.DS_Store'
        ]);

        const files = fs.readdirSync(dirPath);

        for (const file of files) {
            if (file.startsWith('.') || IGNORED_DIRECTORIES.has(file)) continue;
            if (IGNORED_FILES.has(file)) continue;

            const filePath = path.join(dirPath, file);
            try {
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    this.getAllFiles(filePath, arrayOfFiles);
                } else if (stat.isFile() && stat.size <= 300 * 1024 && this.isTextFile(file)) {
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


    // GET repoById - get a repo with it's files, chats, and analysis
    async getRepoById(repoId: string, userId?: string) {
        const repo = await this.prisma.repo.findUnique({
            where: { id: repoId },
            include: {
                files: true,
                chats: {
                    include: {
                        messages: {
                            take: 1,
                            orderBy: { createdAt: 'desc' },
                        },
                    },
                    orderBy: { updatedAt: 'desc' },
                },
                analysis: true,
            },
        });

        if (!repo) {
            throw new NotFoundException('Repository not found');
        }

        if (userId && repo.userId !== userId) {
            throw new ForbiddenException('You do not have permission to access this repository');
        }

        return repo;
    }

    // GET all repos for a user
    async getAllReposForUser(userId: string) {
        return this.prisma.repo.findMany({
            where: { userId },
            include: {
                files: true,
            },
        });
    }

    // DELETE REPO (Cascading deletion of all related entities and assets)
    async deleteRepo(repoId: string, userId?: string) {
        const repo = await this.prisma.repo.findUnique({
            where: { id: repoId },
        });

        if (!repo) {
            throw new NotFoundException('Repository not found');
        }

        if (userId && repo.userId !== userId) {
            throw new ForbiddenException('You do not have permission to delete this repository');
        }

        // Atomically delete all related entities in dependency order
        const deletedRepo = await this.prisma.$transaction(async (tx) => {
            // 1. Delete all chat messages for all chats under this repo
            await tx.message.deleteMany({
                where: {
                    chat: {
                        repoId: repoId,
                    },
                },
            });

            // 2. Delete all chats under this repo
            await tx.chat.deleteMany({
                where: { repoId },
            });

            // 3. Delete analysis data
            await tx.repoAnalysis.deleteMany({
                where: { repoId },
            });

            // 4. Delete API endpoints & Page routes
            await tx.apiEndpoint.deleteMany({
                where: { repoId },
            });
            await tx.pageRoute.deleteMany({
                where: { repoId },
            });

            // 5. Delete Code chunks (embeddings) for all files in this repo
            await tx.codeChunk.deleteMany({
                where: {
                    file: {
                        repoId: repoId,
                    },
                },
            });

            // 6. Delete Files
            await tx.file.deleteMany({
                where: { repoId },
            });

            // 7. Delete the Repository itself
            return tx.repo.delete({
                where: { id: repoId },
            });
        });

        // 8. Clean up local cloned repository directory if still present
        const clonePath = path.join(os.tmpdir(), `docflow-clone-${repoId}`);
        if (fs.existsSync(clonePath)) {
            try {
                fs.rmSync(clonePath, { recursive: true, force: true });
            } catch (err) {
                console.warn(`Failed to clean up temp clone directory ${clonePath}:`, err);
            }
        }

        return deletedRepo;
    }

}
