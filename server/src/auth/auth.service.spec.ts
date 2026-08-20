import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthProvider } from '@prisma/client';

// Mock bcrypt at module level — its exports are non-configurable native properties
// that cannot be redefined by jest.spyOn() at runtime.
jest.mock('bcrypt');

import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { RegisterDto } from './DTO/register.dto';
import { GithubUserData } from './DTO/github.dto';

// ---------------------------------------------------------------------------
// Shared mock factories
// ---------------------------------------------------------------------------

const mockUser = {
  id: 'user-id-1',
  email: 'john@example.com',
  password: 'hashed-password',
  username: 'johndoe',
  name: 'John Doe',
  avatar: null,
  authProvider: AuthProvider.CREDENTIALS,
  providerId: null,
  userRole: 'USER',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
};

const mockCloudinaryService = {
  uploadAvatar: jest.fn(),
  deleteImage: jest.fn(),
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: CloudinaryService, useValue: mockCloudinaryService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Reset all mocks before each test
    jest.clearAllMocks();
    mockJwtService.sign.mockReturnValue('mock-jwt-token');
  });

  // =========================================================================
  // register()
  // =========================================================================

  describe('register()', () => {
    const registerDto: RegisterDto = {
      email: 'john@example.com',
      password: 'password123',
      username: 'johndoe',
      name: 'John Doe',
    };

    it('should register a new user successfully without an avatar', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // email check
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // username check
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.register(registerDto);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: registerDto.email,
          username: registerDto.username,
          name: registerDto.name,
          authProvider: AuthProvider.CREDENTIALS,
        }),
      });
      expect(result.message).toBe('User registered successfully');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should upload avatar to Cloudinary when a file is provided', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockCloudinaryService.uploadAvatar.mockResolvedValue({
        secure_url: 'https://cloudinary.com/avatar.jpg',
      });
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        avatar: 'https://cloudinary.com/avatar.jpg',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const mockFile = { buffer: Buffer.from('img') } as Express.Multer.File;
      const result = await service.register(registerDto, mockFile);

      expect(mockCloudinaryService.uploadAvatar).toHaveBeenCalledWith(mockFile);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          avatar: 'https://cloudinary.com/avatar.jpg',
        }),
      });
      expect(result.user.avatar).toBe('https://cloudinary.com/avatar.jpg');
    });

    it('should throw ConflictException when email is already in use', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when username is already taken', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // email check passes
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser); // username conflict

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Username is already taken'),
      );
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when Cloudinary upload fails', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockCloudinaryService.uploadAvatar.mockRejectedValue(new Error('upload error'));
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const mockFile = { buffer: Buffer.from('img') } as Express.Multer.File;
      await expect(service.register(registerDto, mockFile)).rejects.toThrow(
        new BadRequestException('Avatar upload to Cloudinary failed'),
      );
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should skip username uniqueness check when no username is provided', async () => {
      const dtoWithoutUsername: RegisterDto = {
        email: 'jane@example.com',
        password: 'password123',
        username: undefined as any,
        name: 'Jane Doe',
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // email check only
      mockPrismaService.user.create.mockResolvedValue({ ...mockUser, username: undefined });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      await service.register(dtoWithoutUsername);

      // findUnique should only be called once (for email)
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should exclude password from the returned user object', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.register(registerDto);

      expect(result.user).not.toHaveProperty('password');
    });
  });

  // =========================================================================
  // validateLocalUser()
  // =========================================================================

  describe('validateLocalUser()', () => {
    it('should return user without password when credentials are valid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateLocalUser('john@example.com', 'password123');

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(result!.email).toBe(mockUser.email);
    });

    it('should return null when user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateLocalUser('nobody@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password does not match', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateLocalUser('john@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null when user has no password (OAuth account)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: null,
      });

      const result = await service.validateLocalUser('john@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // login()
  // =========================================================================

  describe('login()', () => {
    it('should sign a JWT with correct payload and return auth response', async () => {
      const user = { id: 'user-id-1', username: 'johndoe', email: 'john@example.com' };

      const result = await service.login(user);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        username: user.username,
        email: user.email,
      });
      expect(result.message).toBe('Logged in successfully');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).toBe(user);
    });
  });

  // =========================================================================
  // validateGithubUser()
  // =========================================================================

  describe('validateGithubUser()', () => {
    const githubData: GithubUserData = {
      providerId: 'github-123',
      username: 'gh-johndoe',
      name: 'John GitHub',
      email: 'john@github.com',
      avatar: 'https://avatars.githubusercontent.com/u/1',
      accessToken: 'github-access-token',
    };

    it('should create a new user when GitHub user does not exist in DB', async () => {
      const newGithubUser = {
        ...mockUser,
        providerId: 'github-123',
        authProvider: AuthProvider.GITHUB,
        email: 'john@github.com',
      };
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(newGithubUser);

      const result = await service.validateGithubUser(githubData);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          providerId: 'github-123',
          authProvider: AuthProvider.GITHUB,
          email: 'john@github.com',
        }),
      });
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.githubAccessToken).toBe('github-access-token');
    });

    it('should return existing user without updating when provider matches', async () => {
      const existingGithubUser = {
        ...mockUser,
        providerId: 'github-123',
        authProvider: AuthProvider.GITHUB,
      };
      mockPrismaService.user.findFirst.mockResolvedValue(existingGithubUser);

      const result = await service.validateGithubUser(githubData);

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
      expect(result.user).toEqual(existingGithubUser);
    });

    it('should update existing user when found by email but provider differs', async () => {
      const credentialsUser = {
        ...mockUser,
        email: 'john@github.com',
        authProvider: AuthProvider.CREDENTIALS,
        providerId: null,
      };
      const updatedUser = {
        ...credentialsUser,
        providerId: 'github-123',
        authProvider: AuthProvider.GITHUB,
      };
      mockPrismaService.user.findFirst.mockResolvedValue(credentialsUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.validateGithubUser(githubData);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: credentialsUser.id },
        data: expect.objectContaining({
          providerId: 'github-123',
          authProvider: AuthProvider.GITHUB,
        }),
      });
      expect(result.user).toEqual(updatedUser);
    });

    it('should use fallback email when GitHub provides no email', async () => {
      const dataWithNoEmail: GithubUserData = {
        ...githubData,
        email: null as any,
      };
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        email: `github-123@github.user`,
        authProvider: AuthProvider.GITHUB,
      });

      await service.validateGithubUser(dataWithNoEmail);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'github-123@github.user',
        }),
      });
    });
  });
});
