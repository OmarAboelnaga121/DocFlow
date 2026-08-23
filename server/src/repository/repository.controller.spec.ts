import { Test, TestingModule } from '@nestjs/testing';
import { RepositoryController } from './repository.controller';
import { RepositoryService } from './repository.service';
import { CreateRepoDto } from './dto/create-repo.dto';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const mockPendingRepo = {
  id: 'repo-id-1',
  name: 'Hello-World',
  branch: 'main',
  url: 'https://github.com/octocat/Hello-World.git',
  userId: 'user-id-1',
  status: 'PENDING',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepositoryService = {
  createRepo: jest.fn(),
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('RepositoryController', () => {
  let controller: RepositoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepositoryController],
      providers: [{ provide: RepositoryService, useValue: mockRepositoryService }],
    }).compile();

    controller = module.get<RepositoryController>(RepositoryController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // =========================================================================
  // POST /repository → createRepo()
  // =========================================================================

  describe('createRepo()', () => {
    const createRepoDto: CreateRepoDto = {
      url: 'https://github.com/octocat/Hello-World.git',
      name: 'Hello-World',
    };

    it('should delegate to repositoryService.createRepo() with userId and dto and return the result', async () => {
      mockRepositoryService.createRepo.mockResolvedValue(mockPendingRepo);

      const result = await controller.createRepo('user-id-1', createRepoDto);

      expect(mockRepositoryService.createRepo).toHaveBeenCalledTimes(1);
      expect(mockRepositoryService.createRepo).toHaveBeenCalledWith('user-id-1', createRepoDto);
      expect(result).toEqual(mockPendingRepo);
    });

    it('should pass the exact userId from the @CurrentUser decorator', async () => {
      mockRepositoryService.createRepo.mockResolvedValue(mockPendingRepo);

      await controller.createRepo('specific-user-abc', createRepoDto);

      expect(mockRepositoryService.createRepo).toHaveBeenCalledWith(
        'specific-user-abc',
        expect.anything(),
      );
    });

    it('should pass the exact dto body from the @Body decorator', async () => {
      const dtoWithBranch: CreateRepoDto = {
        url: 'https://github.com/octocat/Hello-World.git',
        name: 'Hello-World',
        branch: 'develop',
      };
      mockRepositoryService.createRepo.mockResolvedValue({ ...mockPendingRepo, branch: 'develop' });

      await controller.createRepo('user-id-1', dtoWithBranch);

      expect(mockRepositoryService.createRepo).toHaveBeenCalledWith('user-id-1', dtoWithBranch);
    });

    it('should propagate service errors to the caller without catching them', async () => {
      mockRepositoryService.createRepo.mockRejectedValue(new Error('DB connection failed'));

      await expect(controller.createRepo('user-id-1', createRepoDto)).rejects.toThrow(
        'DB connection failed',
      );
    });

    it('should return a PENDING status repository immediately', async () => {
      mockRepositoryService.createRepo.mockResolvedValue(mockPendingRepo);

      const result = await controller.createRepo('user-id-1', createRepoDto);

      expect(result.status).toBe('PENDING');
    });
  });
});
