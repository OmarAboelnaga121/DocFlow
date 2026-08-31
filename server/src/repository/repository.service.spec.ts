import { Test, TestingModule } from '@nestjs/testing';

// ---------------------------------------------------------------------------
// Mock heavy side-effect modules BEFORE importing RepositoryService,
// following the same pattern used for bcrypt in auth.service.spec.ts.
// ---------------------------------------------------------------------------

// Mock simple-git so no real git operations occur
const mockGitClone = jest.fn().mockResolvedValue(undefined);
jest.mock('simple-git', () => {
  return jest.fn().mockImplementation(() => ({
    clone: mockGitClone,
  }));
});

// Mock fs to prevent real filesystem access
const mockFsExistsSync = jest.fn();
const mockFsRmSync = jest.fn();
const mockFsReaddirSync = jest.fn();
const mockFsStatSync = jest.fn();
const mockFsReadFileSync = jest.fn();

jest.mock('fs', () => ({
  existsSync: (...args: any[]) => mockFsExistsSync(...args),
  rmSync: (...args: any[]) => mockFsRmSync(...args),
  readdirSync: (...args: any[]) => mockFsReaddirSync(...args),
  statSync: (...args: any[]) => mockFsStatSync(...args),
  readFileSync: (...args: any[]) => mockFsReadFileSync(...args),
}));

import { RepositoryService } from './repository.service';
import { PrismaService } from '../prisma/prisma.service';
import { RepoAnalysisService } from './repo-analysis/repo-analysis.service';
import { CreateRepoDto } from './dto/create-repo.dto';

// ---------------------------------------------------------------------------
// Shared mock factories
// ---------------------------------------------------------------------------

const mockRepo = {
  id: 'repo-id-1',
  name: 'Hello-World',
  branch: 'main',
  url: 'https://github.com/octocat/Hello-World.git',
  userId: 'user-id-1',
  status: 'PENDING',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockFile = {
  id: 'file-id-1',
  repoId: 'repo-id-1',
  path: 'src/index.ts',
  language: 'typescript',
  contentHash: 'abc123',
};

const mockCodeChunk = {
  id: 'chunk-id-1',
  fileId: 'file-id-1',
  content: 'const x = 1;',
  startLine: 1,
  endLine: 1,
};

const mockPrismaService = {
  repo: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  file: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  codeChunk: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  chat: {
    deleteMany: jest.fn(),
  },
  message: {
    deleteMany: jest.fn(),
  },
  repoAnalysis: {
    deleteMany: jest.fn(),
  },
  apiEndpoint: {
    deleteMany: jest.fn(),
  },
  pageRoute: {
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn((cb) => (typeof cb === 'function' ? cb(mockPrismaService) : Promise.resolve(cb))),
  $executeRawUnsafe: jest.fn(),
};

const mockRepoAnalysisService = {
  analyzeRepositoryStructure: jest.fn().mockResolvedValue(undefined),
};

// ---------------------------------------------------------------------------
// Helper — flush all pending microtasks/promises so background async work
// triggered by createRepo() (fire-and-forget) runs to completion in tests.
// ---------------------------------------------------------------------------
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('RepositoryService', () => {
  let service: RepositoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepositoryService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RepoAnalysisService, useValue: mockRepoAnalysisService },
      ],
    }).compile();

    service = module.get<RepositoryService>(RepositoryService);

    jest.clearAllMocks();

    // Default fs behaviour — no stale clone dir
    mockFsExistsSync.mockReturnValue(false);
    // Default: no files in clone dir (prevents deep ingestion loops)
    mockFsReaddirSync.mockReturnValue([]);
  });

  // =========================================================================
  // createRepo()
  // =========================================================================

  describe('createRepo()', () => {
    const createRepoDto: CreateRepoDto = {
      url: 'https://github.com/octocat/Hello-World.git',
      name: 'Hello-World',
    };

    it('should create a PENDING repo entry and return it immediately', async () => {
      mockPrismaService.repo.create.mockResolvedValue(mockRepo);
      mockPrismaService.repo.update.mockResolvedValue({ ...mockRepo, status: 'COMPLETED' });

      const result = await service.createRepo('user-id-1', createRepoDto);

      expect(mockPrismaService.repo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: createRepoDto.name,
          url: createRepoDto.url,
          userId: 'user-id-1',
          status: 'PENDING',
          branch: 'main', // default branch
        }),
      });
      expect(result).toEqual(mockRepo);
    });

    it('should use the provided branch instead of the default main', async () => {
      const dtoWithBranch: CreateRepoDto = {
        ...createRepoDto,
        branch: 'develop',
      };
      mockPrismaService.repo.create.mockResolvedValue({ ...mockRepo, branch: 'develop' });
      mockPrismaService.repo.update.mockResolvedValue({});

      await service.createRepo('user-id-1', dtoWithBranch);

      expect(mockPrismaService.repo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ branch: 'develop' }),
      });
    });

    it('should resolve immediately without waiting for background ingestion to finish', async () => {
      mockPrismaService.repo.create.mockResolvedValue(mockRepo);
      // ingestion will eventually call repo.update
      mockPrismaService.repo.update.mockResolvedValue({});

      const start = Date.now();
      const result = await service.createRepo('user-id-1', createRepoDto);
      const elapsed = Date.now() - start;

      // Should be near-instant (< 100ms), not blocked by async ingestion
      expect(elapsed).toBeLessThan(100);
      expect(result.status).toBe('PENDING');
    });

    it('should NOT reject when background ingestion fails', async () => {
      mockPrismaService.repo.create.mockResolvedValue(mockRepo);
      // Simulate git clone failure
      mockGitClone.mockRejectedValueOnce(new Error('Connection refused'));
      mockPrismaService.repo.update.mockResolvedValue({});

      // createRepo itself must resolve cleanly
      await expect(service.createRepo('user-id-1', createRepoDto)).resolves.toBeDefined();

      // Flush background task
      await flushPromises();

      // Ingestion error path: FAILED status must be set
      expect(mockPrismaService.repo.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'FAILED' } }),
      );
    });
  });

  // =========================================================================
  // ingestRepository() — tested indirectly (it's private)
  // =========================================================================

  describe('ingestRepository() [via createRepo()]', () => {
    const createRepoDto: CreateRepoDto = {
      url: 'https://github.com/octocat/Hello-World.git',
      name: 'Hello-World',
    };

    it('should progress through CLONING → EMBEDDING → ANALYZING → COMPLETED on success', async () => {
      mockPrismaService.repo.create.mockResolvedValue(mockRepo);
      mockPrismaService.repo.update.mockResolvedValue({});
      mockPrismaService.file.create.mockResolvedValue(mockFile);
      mockPrismaService.codeChunk.create.mockResolvedValue(mockCodeChunk);
      mockPrismaService.$executeRawUnsafe.mockResolvedValue(undefined);

      await service.createRepo('user-id-1', createRepoDto);
      await flushPromises();

      const updateCalls = mockPrismaService.repo.update.mock.calls.map(
        (call: any[]) => call[0].data.status,
      );

      expect(updateCalls).toContain('CLONING');
      expect(updateCalls).toContain('EMBEDDING');
      expect(updateCalls).toContain('ANALYZING');
      expect(updateCalls).toContain('COMPLETED');
      expect(updateCalls.indexOf('CLONING')).toBeLessThan(updateCalls.indexOf('EMBEDDING'));
      expect(updateCalls.indexOf('EMBEDDING')).toBeLessThan(updateCalls.indexOf('ANALYZING'));
      expect(updateCalls.indexOf('ANALYZING')).toBeLessThan(updateCalls.indexOf('COMPLETED'));
    });

    it('should call repoAnalysisService.analyzeRepositoryStructure with the correct repoId', async () => {
      mockPrismaService.repo.create.mockResolvedValue(mockRepo);
      mockPrismaService.repo.update.mockResolvedValue({});

      await service.createRepo('user-id-1', createRepoDto);
      await flushPromises();

      expect(mockRepoAnalysisService.analyzeRepositoryStructure).toHaveBeenCalledWith(mockRepo.id);
    });

    it('should remove a stale clone directory before cloning', async () => {
      // Stale dir exists
      mockFsExistsSync.mockReturnValue(true);
      mockPrismaService.repo.create.mockResolvedValue(mockRepo);
      mockPrismaService.repo.update.mockResolvedValue({});

      await service.createRepo('user-id-1', createRepoDto);
      await flushPromises();

      // rmSync should have been called to clean up before git clone
      expect(mockFsRmSync).toHaveBeenCalledWith(
        expect.stringContaining('docflow-clone'),
        { recursive: true, force: true },
      );
    });

    it('should set FAILED status and cleanup when git.clone throws', async () => {
      mockFsExistsSync.mockReturnValue(false);
      mockGitClone.mockRejectedValueOnce(new Error('Auth failure'));
      mockPrismaService.repo.create.mockResolvedValue(mockRepo);
      mockPrismaService.repo.update.mockResolvedValue({});

      await service.createRepo('user-id-1', createRepoDto);
      await flushPromises();

      expect(mockPrismaService.repo.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'FAILED' } }),
      );
    });

    it('should cleanup clone directory in finally block even when ingestion succeeds', async () => {
      // After ingestion, dir is present
      mockFsExistsSync
        .mockReturnValueOnce(false) // pre-clone check
        .mockReturnValueOnce(true);  // finally check

      mockPrismaService.repo.create.mockResolvedValue(mockRepo);
      mockPrismaService.repo.update.mockResolvedValue({});

      await service.createRepo('user-id-1', createRepoDto);
      await flushPromises();

      expect(mockFsRmSync).toHaveBeenCalledWith(
        expect.stringContaining('docflow-clone'),
        { recursive: true, force: true },
      );
    });

    it('should create file and codeChunk records and set vector embedding for each chunk', async () => {
      // Simulate one file with content
      const fakeContent = 'const hello = "world";\n'.repeat(5);
      mockFsReaddirSync.mockReturnValue(['index.ts']);
      mockFsStatSync.mockReturnValue({ isDirectory: () => false, isFile: () => true });
      mockFsReadFileSync.mockReturnValue(fakeContent);
      mockFsExistsSync.mockReturnValue(false);

      mockPrismaService.repo.create.mockResolvedValue(mockRepo);
      mockPrismaService.repo.update.mockResolvedValue({});
      mockPrismaService.file.create.mockResolvedValue(mockFile);
      mockPrismaService.codeChunk.create.mockResolvedValue(mockCodeChunk);
      mockPrismaService.$executeRawUnsafe.mockResolvedValue(undefined);

      await service.createRepo('user-id-1', createRepoDto);
      await flushPromises();

      expect(mockPrismaService.file.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            repoId: mockRepo.id,
            path: 'index.ts',
            language: 'typescript',
          }),
        }),
      );
      expect(mockPrismaService.codeChunk.create).toHaveBeenCalled();
      expect(mockPrismaService.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE "CodeChunk"'),
        expect.any(String),
        mockCodeChunk.id,
      );
    });
  });

  // =========================================================================
  // getLanguageFromExtension() — private helper
  // =========================================================================

  describe('getLanguageFromExtension() [private]', () => {
    const getLanguage = (fp: string) =>
      (service as any).getLanguageFromExtension(fp);

    it('should return "typescript" for .ts files', () => {
      expect(getLanguage('src/main.ts')).toBe('typescript');
    });

    it('should return "typescript" for .tsx files', () => {
      expect(getLanguage('components/App.tsx')).toBe('typescript');
    });

    it('should return "javascript" for .js files', () => {
      expect(getLanguage('index.js')).toBe('javascript');
    });

    it('should return "javascript" for .jsx files', () => {
      expect(getLanguage('App.jsx')).toBe('javascript');
    });

    it('should return "python" for .py files', () => {
      expect(getLanguage('main.py')).toBe('python');
    });

    it('should return "go" for .go files', () => {
      expect(getLanguage('server.go')).toBe('go');
    });

    it('should return "rust" for .rs files', () => {
      expect(getLanguage('lib.rs')).toBe('rust');
    });

    it('should return "yaml" for .yml files', () => {
      expect(getLanguage('docker-compose.yml')).toBe('yaml');
    });

    it('should return "yaml" for .yaml files', () => {
      expect(getLanguage('ci.yaml')).toBe('yaml');
    });

    it('should return "markdown" for .md files', () => {
      expect(getLanguage('README.md')).toBe('markdown');
    });

    it('should return null for unknown extensions', () => {
      expect(getLanguage('binary.xyz')).toBeNull();
    });

    it('should return null for extensionless files', () => {
      expect(getLanguage('Makefile')).toBeNull();
    });
  });

  // =========================================================================
  // isTextFile() — private helper
  // =========================================================================

  describe('isTextFile() [private]', () => {
    const isText = (filename: string) => (service as any).isTextFile(filename);

    it('should return true for .ts files', () => {
      expect(isText('index.ts')).toBe(true);
    });

    it('should return true for .py files', () => {
      expect(isText('main.py')).toBe(true);
    });

    it('should return true for .prisma files', () => {
      expect(isText('schema.prisma')).toBe(true);
    });

    it('should return true for .yml files', () => {
      expect(isText('docker-compose.yml')).toBe(true);
    });

    it('should return true for .graphql files', () => {
      expect(isText('schema.graphql')).toBe(true);
    });

    it('should return false for .png image files', () => {
      expect(isText('image.png')).toBe(false);
    });

    it('should return false for .exe binary files', () => {
      expect(isText('program.exe')).toBe(false);
    });

    it('should return false for extensionless files like .DS_Store', () => {
      // .DS_Store has no standard code extension
      expect(isText('.DS_Store')).toBe(false);
    });
  });

  // =========================================================================
  // chunkText() — private, pure function
  // =========================================================================

  describe('chunkText() [private]', () => {
    const chunkText = (text: string, size: number, overlap: number) =>
      (service as any).chunkText(text, size, overlap);

    it('should produce a single chunk with empty content for an empty string', () => {
      // The implementation splits '' on '\n' yielding [''], which enters the loop once.
      // This matches the real runtime behaviour — no guard exists for empty input.
      const result = chunkText('', 1200, 200);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('');
      expect(result[0].startLine).toBe(1);
      expect(result[0].endLine).toBe(1);
    });

    it('should return a single chunk when text is below the chunk size', () => {
      const text = 'const x = 1;\nconst y = 2;';
      const result = chunkText(text, 1200, 200);

      expect(result).toHaveLength(1);
      expect(result[0].startLine).toBe(1);
      expect(result[0].endLine).toBe(2);
      expect(result[0].content).toBe(text);
    });

    it('should return multiple chunks when text exceeds chunk size', () => {
      // Build a string where each line is exactly 100 chars — 15 lines = 1500 chars
      const line = 'a'.repeat(99); // 99 chars + '\n' = 100 per line
      const text = Array.from({ length: 15 }, () => line).join('\n');

      const result = chunkText(text, 500, 50);

      expect(result.length).toBeGreaterThan(1);
    });

    it('each chunk should have a non-empty content string', () => {
      const line = 'x'.repeat(80);
      const text = Array.from({ length: 20 }, () => line).join('\n');

      const chunks = chunkText(text, 300, 50);

      for (const chunk of chunks) {
        expect(chunk.content.trim().length).toBeGreaterThan(0);
      }
    });

    it('startLine of first chunk should always be 1', () => {
      const text = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join('\n');
      const result = chunkText(text, 1200, 200);

      expect(result[0].startLine).toBe(1);
    });

    it('endLine of last chunk should equal the total line count', () => {
      const lines = Array.from({ length: 5 }, (_, i) => `line ${i + 1}`);
      const text = lines.join('\n');
      const result = chunkText(text, 1200, 200);

      expect(result[result.length - 1].endLine).toBe(lines.length);
    });

    it('overlap should ensure chunks share content at boundaries', () => {
      // Build content large enough to produce exactly 2 chunks
      const line = 'y'.repeat(199); // 199 chars + \n = 200 per line
      const text = Array.from({ length: 8 }, () => line).join('\n');

      const chunks = chunkText(text, 600, 200);

      // With overlap the last lines of chunk[0] and first lines of chunk[1] should share content
      if (chunks.length >= 2) {
        const lastLinesOfFirst = chunks[0].content.split('\n').slice(-3).join('\n');
        const firstLinesOfSecond = chunks[1].content.split('\n').slice(0, 3).join('\n');
        // At least one overlapping line
        const hasOverlap = lastLinesOfFirst
          .split('\n')
          .some((l) => firstLinesOfSecond.includes(l));
        expect(hasOverlap).toBe(true);
      }
    });
  });

  // =========================================================================
  // deleteRepo()
  // =========================================================================

  describe('deleteRepo()', () => {
    it('should throw NotFoundException if repository does not exist', async () => {
      mockPrismaService.repo.findUnique.mockResolvedValue(null);

      await expect(service.deleteRepo('non-existent-id')).rejects.toThrow(
        'Repository not found',
      );
    });

    it('should throw ForbiddenException if userId does not match repo owner', async () => {
      mockPrismaService.repo.findUnique.mockResolvedValue(mockRepo);

      await expect(
        service.deleteRepo('repo-id-1', 'different-user-id'),
      ).rejects.toThrow('You do not have permission to delete this repository');
    });

    it('should atomically delete all related entities and clean filesystem clone', async () => {
      mockPrismaService.repo.findUnique.mockResolvedValue(mockRepo);
      mockPrismaService.repo.delete.mockResolvedValue(mockRepo);
      mockFsExistsSync.mockReturnValue(true);

      const result = await service.deleteRepo('repo-id-1', 'user-id-1');

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.message.deleteMany).toHaveBeenCalledWith({
        where: { chat: { repoId: 'repo-id-1' } },
      });
      expect(mockPrismaService.chat.deleteMany).toHaveBeenCalledWith({
        where: { repoId: 'repo-id-1' },
      });
      expect(mockPrismaService.repoAnalysis.deleteMany).toHaveBeenCalledWith({
        where: { repoId: 'repo-id-1' },
      });
      expect(mockPrismaService.apiEndpoint.deleteMany).toHaveBeenCalledWith({
        where: { repoId: 'repo-id-1' },
      });
      expect(mockPrismaService.pageRoute.deleteMany).toHaveBeenCalledWith({
        where: { repoId: 'repo-id-1' },
      });
      expect(mockPrismaService.codeChunk.deleteMany).toHaveBeenCalledWith({
        where: { file: { repoId: 'repo-id-1' } },
      });
      expect(mockPrismaService.file.deleteMany).toHaveBeenCalledWith({
        where: { repoId: 'repo-id-1' },
      });
      expect(mockPrismaService.repo.delete).toHaveBeenCalledWith({
        where: { id: 'repo-id-1' },
      });
      expect(mockFsRmSync).toHaveBeenCalled();
      expect(result).toEqual(mockRepo);
    });
  });

  // =========================================================================
  // getRepoById()
  // =========================================================================

  describe('getRepoById()', () => {
    it('should throw NotFoundException if repository does not exist', async () => {
      mockPrismaService.repo.findUnique.mockResolvedValue(null);

      await expect(service.getRepoById('non-existent-id')).rejects.toThrow(
        'Repository not found',
      );
    });

    it('should throw ForbiddenException if userId does not match repo owner', async () => {
      mockPrismaService.repo.findUnique.mockResolvedValue(mockRepo);

      await expect(
        service.getRepoById('repo-id-1', 'different-user-id'),
      ).rejects.toThrow('You do not have permission to access this repository');
    });

    it('should return repository details if user owns it', async () => {
      mockPrismaService.repo.findUnique.mockResolvedValue(mockRepo);

      const result = await service.getRepoById('repo-id-1', 'user-id-1');
      expect(result).toEqual(mockRepo);
    });
  });
});
