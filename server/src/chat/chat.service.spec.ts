import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

const mockChat = {
  id: 'chat-id-1',
  userId: 'user-id-1',
  repoId: 'repo-id-1',
  title: 'Test Chat',
  createdAt: new Date(),
  updatedAt: new Date(),
  repo: {
    id: 'repo-id-1',
    name: 'DocFlow',
    branch: 'main',
    status: 'COMPLETED',
    url: 'https://github.com/test/repo',
  },
  messages: [
    {
      id: 'msg-1',
      chatId: 'chat-id-1',
      role: 'USER',
      content: 'Hello',
      createdAt: new Date(),
    },
  ],
};

const mockMessages = [
  {
    id: 'msg-1',
    chatId: 'chat-id-1',
    role: 'USER',
    content: 'Hello',
    createdAt: new Date(),
  },
  {
    id: 'msg-2',
    chatId: 'chat-id-1',
    role: 'AI',
    content: 'Hi there!',
    createdAt: new Date(),
  },
];

const mockPrismaService = {
  chat: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  message: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  repo: {
    findFirst: jest.fn(),
  },
  user: {
    update: jest.fn(),
  },
  creditLedger: {
    create: jest.fn(),
  },
};

const mockRedisService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  getCache: jest.fn(),
  setCache: jest.fn(),
  invalidateCache: jest.fn().mockResolvedValue(true),
  getOrSet: jest.fn(),
};

describe('ChatService Caching', () => {
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    jest.clearAllMocks();

    mockRedisService.getOrSet.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );
    mockRedisService.invalidateCache.mockResolvedValue(true);
  });

  describe('getChatById()', () => {
    it('should return cached chat without querying database on cache hit', async () => {
      mockRedisService.getOrSet.mockResolvedValue(mockChat);

      const result = await service.getChatById('user-id-1', 'chat-id-1');

      expect(mockRedisService.getOrSet).toHaveBeenCalledWith(
        'chat:chat-id-1',
        3600,
        expect.any(Function),
      );
      expect(mockPrismaService.chat.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual(mockChat);
    });

    it('should query database on cache miss', async () => {
      mockPrismaService.chat.findUnique.mockResolvedValue(mockChat);

      const result = await service.getChatById('user-id-1', 'chat-id-1');

      expect(mockRedisService.getOrSet).toHaveBeenCalledWith(
        'chat:chat-id-1',
        3600,
        expect.any(Function),
      );
      expect(mockPrismaService.chat.findUnique).toHaveBeenCalledWith({
        where: { id: 'chat-id-1' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockChat);
    });

    it('should throw NotFoundException if chat does not exist', async () => {
      mockPrismaService.chat.findUnique.mockResolvedValue(null);

      await expect(
        service.getChatById('user-id-1', 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the chat', async () => {
      mockRedisService.getOrSet.mockResolvedValue(mockChat);

      await expect(
        service.getChatById('wrong-user-id', 'chat-id-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getChatMessages()', () => {
    it('should return cached messages on cache hit after verifying ownership', async () => {
      mockPrismaService.chat.findUnique.mockResolvedValue(mockChat);
      mockRedisService.getOrSet
        .mockResolvedValueOnce(mockChat) // getChatById cache hit
        .mockResolvedValueOnce(mockMessages); // getChatMessages cache hit

      const result = await service.getChatMessages('user-id-1', 'chat-id-1');

      expect(mockRedisService.getOrSet).toHaveBeenCalledWith(
        'chat-messages:chat-id-1',
        3600,
        expect.any(Function),
      );
      expect(result).toEqual(mockMessages);
    });

    it('should query database on messages cache miss', async () => {
      mockPrismaService.chat.findUnique.mockResolvedValue(mockChat);
      mockPrismaService.message.findMany.mockResolvedValue(mockMessages);

      const result = await service.getChatMessages('user-id-1', 'chat-id-1');

      expect(mockPrismaService.message.findMany).toHaveBeenCalledWith({
        where: { chatId: 'chat-id-1' },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(mockMessages);
    });
  });

  describe('sendMessage()', () => {
    it('should block generation when the user has insufficient credits and should use the selected model when provided', async () => {
      mockPrismaService.chat.findUnique.mockResolvedValue({
        ...mockChat,
        user: { userRole: 'DEVELOPER', creditBalance: 0 },
        repo: {
          id: 'repo-id-1',
          name: 'DocFlow',
          branch: 'main',
          status: 'COMPLETED',
          url: 'https://github.com/test/repo',
          analysis: null,
          files: [],
        },
      });

      const performRagSpy = jest
        .spyOn(service as any, 'performRagSearch')
        .mockResolvedValue([]);

      await expect(
        service.sendMessage('user-id-1', 'chat-id-1', {
          content: 'Explain the repo',
          model: 'qwen3.7-plus',
        }),
      ).rejects.toThrow('Not enough credits');

      expect(performRagSpy).not.toHaveBeenCalled();
      expect(mockPrismaService.message.create).not.toHaveBeenCalled();
    });

    it('should charge the selected model cost when a user sends a message', async () => {
      mockPrismaService.chat.findUnique.mockResolvedValue({
        ...mockChat,
        user: { userRole: 'DEVELOPER', creditBalance: 3 },
        repo: {
          id: 'repo-id-1',
          name: 'DocFlow',
          branch: 'main',
          status: 'COMPLETED',
          url: 'https://github.com/test/repo',
          analysis: null,
          files: [],
        },
      });
      mockPrismaService.message.create.mockResolvedValue({
        id: 'ai-msg-1',
        chatId: 'chat-id-1',
        role: 'AI',
        content: 'Answer',
        context: [],
      });
      mockPrismaService.user.update.mockResolvedValue({ id: 'user-id-1', creditBalance: 1 });
      jest.spyOn(service as any, 'performRagSearch').mockResolvedValue([]);

      await service.sendMessage('user-id-1', 'chat-id-1', {
        content: 'Explain the repo',
        model: 'qwen3.7-max',
      });

      expect(mockPrismaService.creditLedger.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id-1',
          amount: -3,
          reason: 'llm_generation_qwen3.7-max',
          referenceId: expect.stringContaining('chat_message_'),
        },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: { creditBalance: { decrement: 3 } },
      });
    });
  });
});
