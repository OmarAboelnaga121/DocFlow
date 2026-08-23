import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';

// ---------------------------------------------------------------------------
// Mock OpenAI at module level — prevents any real API call in tests
// ---------------------------------------------------------------------------

const mockChatCompletionsCreate = jest.fn();

jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockChatCompletionsCreate,
        },
      },
    })),
  };
});

import { RepoAnalysisService } from './repo-analysis.service';
import { PrismaService } from '../../prisma/prisma.service';

// ---------------------------------------------------------------------------
// Shared mock factories
// ---------------------------------------------------------------------------

const mockFileWithChunks = (path: string) => ({
  id: `file-id-${path}`,
  repoId: 'repo-id-1',
  path,
  language: 'typescript',
  contentHash: 'abc123',
  chunks: [
    { id: 'chunk-1', content: 'const router = express.Router();', startLine: 1, endLine: 1 },
    { id: 'chunk-2', content: 'router.get("/users", handler);', startLine: 2, endLine: 2 },
  ],
});

const mockApiExtraction = {
  apis: [
    {
      method: 'GET',
      endpoint: '/api/v1/users',
      description: 'Get all users',
      file: 'src/user.controller.ts',
    },
  ],
  pages: [
    {
      route: '/dashboard',
      description: 'User dashboard page',
      file: 'src/pages/dashboard.tsx',
    },
  ],
};

const buildOpenAIResponse = (content: string) => ({
  choices: [{ message: { content } }],
});

const mockPrismaService = {
  file: {
    findMany: jest.fn(),
  },
  repoAnalysis: {
    upsert: jest.fn(),
  },
  apiEndpoint: {
    createMany: jest.fn(),
  },
  pageRoute: {
    createMany: jest.fn(),
  },
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('RepoAnalysisService', () => {
  let service: RepoAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepoAnalysisService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RepoAnalysisService>(RepoAnalysisService);

    jest.clearAllMocks();
  });

  // =========================================================================
  // analyzeRepositoryStructure()
  // =========================================================================

  describe('analyzeRepositoryStructure()', () => {
    it('should return early and not call OpenAI when no routing files are found', async () => {
      mockPrismaService.file.findMany.mockResolvedValue([]);

      await service.analyzeRepositoryStructure('repo-id-1');

      expect(mockChatCompletionsCreate).not.toHaveBeenCalled();
      expect(mockPrismaService.repoAnalysis.upsert).not.toHaveBeenCalled();
    });

    it('should call OpenAI and upsert analysis when routing files are found', async () => {
      mockPrismaService.file.findMany.mockResolvedValue([
        mockFileWithChunks('src/user.controller.ts'),
      ]);
      mockChatCompletionsCreate.mockResolvedValue(
        buildOpenAIResponse(JSON.stringify(mockApiExtraction)),
      );
      mockPrismaService.repoAnalysis.upsert.mockResolvedValue({
        id: 'analysis-id-1',
        repoId: 'repo-id-1',
        apis: mockApiExtraction.apis,
        pages: mockApiExtraction.pages,
      });
      mockPrismaService.file.findMany.mockResolvedValueOnce([
        mockFileWithChunks('src/user.controller.ts'),
      ]);
      mockPrismaService.apiEndpoint.createMany.mockResolvedValue({ count: 1 });
      mockPrismaService.pageRoute.createMany.mockResolvedValue({ count: 1 });

      await service.analyzeRepositoryStructure('repo-id-1');

      expect(mockChatCompletionsCreate).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.repoAnalysis.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { repoId: 'repo-id-1' },
          create: expect.objectContaining({ repoId: 'repo-id-1' }),
          update: expect.objectContaining({
            apis: mockApiExtraction.apis,
            pages: mockApiExtraction.pages,
          }),
        }),
      );
    });

    it('should NOT call repoAnalysis.upsert when OpenAI returns an empty response', async () => {
      mockPrismaService.file.findMany.mockResolvedValue([
        mockFileWithChunks('src/api/route.ts'),
      ]);
      mockChatCompletionsCreate.mockResolvedValue(
        buildOpenAIResponse(''), // empty content
      );

      // Should not throw — error is caught internally
      await expect(service.analyzeRepositoryStructure('repo-id-1')).resolves.toBeUndefined();
      expect(mockPrismaService.repoAnalysis.upsert).not.toHaveBeenCalled();
    });

    it('should NOT propagate when OpenAI throws a network error', async () => {
      mockPrismaService.file.findMany.mockResolvedValue([
        mockFileWithChunks('src/pages/index.tsx'),
      ]);
      mockChatCompletionsCreate.mockRejectedValue(new Error('Network timeout'));

      // The service catches internally — must not propagate
      await expect(service.analyzeRepositoryStructure('repo-id-1')).resolves.toBeUndefined();
      expect(mockPrismaService.repoAnalysis.upsert).not.toHaveBeenCalled();
    });

    it('should truncate combinedContext to 300,000 characters when content is too large', async () => {
      // Build a file whose reconstructed content vastly exceeds the 300k limit
      const hugeLine = 'x'.repeat(10000);
      const massiveChunks = Array.from({ length: 35 }, (_, i) => ({
        id: `chunk-${i}`,
        content: hugeLine,
        startLine: i,
        endLine: i + 1,
      }));

      mockPrismaService.file.findMany.mockResolvedValue([
        {
          id: 'file-id-1',
          repoId: 'repo-id-1',
          path: 'src/api/route.ts',
          chunks: massiveChunks,
        },
      ]);

      mockChatCompletionsCreate.mockImplementation(({ messages }: any) => {
        // Capture what was sent to the AI
        const userContent: string = messages[1].content;
        // Verify truncation
        expect(userContent.length).toBeLessThanOrEqual(300000);
        return Promise.resolve(buildOpenAIResponse(JSON.stringify(mockApiExtraction)));
      });

      mockPrismaService.repoAnalysis.upsert.mockResolvedValue({
        id: 'analysis-id-1',
        repoId: 'repo-id-1',
        apis: mockApiExtraction.apis,
        pages: mockApiExtraction.pages,
      });
      mockPrismaService.file.findMany.mockResolvedValueOnce([]);
      mockPrismaService.apiEndpoint.createMany.mockResolvedValue({ count: 0 });
      mockPrismaService.pageRoute.createMany.mockResolvedValue({ count: 0 });

      await service.analyzeRepositoryStructure('repo-id-1');
    });
  });

  // =========================================================================
  // syncEndpointsAndRoutesFromAnalysis() — tested indirectly
  // =========================================================================

  describe('syncEndpointsAndRoutesFromAnalysis() [via analyzeRepositoryStructure()]', () => {
    const setupSuccessfulAnalysis = (apis: any[], pages: any[], files: any[]) => {
      // First findMany: for routing file detection + content building
      mockPrismaService.file.findMany.mockResolvedValueOnce([
        mockFileWithChunks('src/user.controller.ts'),
      ]);
      // upsert returns the analysis with supplied apis/pages
      mockPrismaService.repoAnalysis.upsert.mockResolvedValue({
        id: 'analysis-id-1',
        repoId: 'repo-id-1',
        apis,
        pages,
      });
      // Second findMany: for file-path resolution in sync
      mockPrismaService.file.findMany.mockResolvedValueOnce(files);

      mockChatCompletionsCreate.mockResolvedValue(
        buildOpenAIResponse(JSON.stringify({ apis, pages })),
      );
      mockPrismaService.apiEndpoint.createMany.mockResolvedValue({ count: apis.length });
      mockPrismaService.pageRoute.createMany.mockResolvedValue({ count: pages.length });
    };

    it('should NOT call apiEndpoint.createMany when apis array is empty', async () => {
      setupSuccessfulAnalysis([], mockApiExtraction.pages, []);

      await service.analyzeRepositoryStructure('repo-id-1');

      expect(mockPrismaService.apiEndpoint.createMany).not.toHaveBeenCalled();
    });

    it('should NOT call pageRoute.createMany when pages array is empty', async () => {
      setupSuccessfulAnalysis(mockApiExtraction.apis, [], [
        { id: 'file-id-1', path: 'src/user.controller.ts' },
      ]);

      await service.analyzeRepositoryStructure('repo-id-1');

      expect(mockPrismaService.pageRoute.createMany).not.toHaveBeenCalled();
    });

    it('should call apiEndpoint.createMany with correct data when apis are present', async () => {
      const dbFiles = [{ id: 'file-id-ctrl', path: 'src/user.controller.ts' }];
      setupSuccessfulAnalysis(mockApiExtraction.apis, [], dbFiles);

      await service.analyzeRepositoryStructure('repo-id-1');

      expect(mockPrismaService.apiEndpoint.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            repoId: 'repo-id-1',
            path: '/api/v1/users',
            method: 'GET',
          }),
        ]),
      });
    });

    it('should call pageRoute.createMany with correct data when pages are present', async () => {
      const dbFiles = [{ id: 'file-id-page', path: 'src/pages/dashboard.tsx' }];
      setupSuccessfulAnalysis([], mockApiExtraction.pages, dbFiles);

      await service.analyzeRepositoryStructure('repo-id-1');

      expect(mockPrismaService.pageRoute.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            repoId: 'repo-id-1',
            routePath: '/dashboard',
          }),
        ]),
      });
    });

    it('should resolve fileId by partial path match when exact path does not match', async () => {
      // AI returns './src/user.controller.ts' but DB has 'src/user.controller.ts'
      const apisWithPrefixedPath = [
        {
          method: 'POST',
          endpoint: '/api/v1/users',
          description: 'Create user',
          file: './src/user.controller.ts', // has leading './'
        },
      ];
      const dbFiles = [{ id: 'file-id-ctrl', path: 'src/user.controller.ts' }];
      setupSuccessfulAnalysis(apisWithPrefixedPath, [], dbFiles);

      await service.analyzeRepositoryStructure('repo-id-1');

      expect(mockPrismaService.apiEndpoint.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ fileId: 'file-id-ctrl' }),
        ]),
      });
    });

    it('should fall back to first file when AI path does not match any DB file', async () => {
      const apisWithUnknownPath = [
        {
          method: 'DELETE',
          endpoint: '/api/v1/items',
          description: 'Delete item',
          file: 'non/existent/path.ts',
        },
      ];
      const dbFiles = [
        { id: 'fallback-file-id', path: 'src/some.controller.ts' },
      ];
      setupSuccessfulAnalysis(apisWithUnknownPath, [], dbFiles);

      await service.analyzeRepositoryStructure('repo-id-1');

      expect(mockPrismaService.apiEndpoint.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ fileId: 'fallback-file-id' }),
        ]),
      });
    });
  });
});
