import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateProfileDto } from './DTO/update-profile.dto';

// ---------------------------------------------------------------------------
// Shared mock factories
// ---------------------------------------------------------------------------

const mockUser = {
  id: 'user-id-1',
  email: 'john@example.com',
  password: 'hashed-password',
  username: 'johndoe',
  name: 'John Doe',
  avatar: 'https://cloudinary.com/old-avatar.jpg',
  authProvider: 'CREDENTIALS',
  providerId: null,
  userRole: UserRole.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockCloudinaryService = {
  uploadAvatar: jest.fn(),
  deleteImage: jest.fn(),
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CloudinaryService, useValue: mockCloudinaryService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  // =========================================================================
  // findById()
  // =========================================================================

  describe('findById()', () => {
    it('should return a user object without the password field', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('user-id-1');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
      });
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(mockUser.email);
      expect(result.username).toBe(mockUser.username);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        new NotFoundException('User with ID non-existent-id not found'),
      );
    });
  });

  // =========================================================================
  // updateProfile()
  // =========================================================================

  describe('updateProfile()', () => {
    const updatedUser = {
      ...mockUser,
      name: 'Jane Doe',
      username: 'janedoe',
    };

    it('should update name only and return sanitized user without password', async () => {
      const dto: UpdateProfileDto = { name: 'Jane Doe' };
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser); // existence check
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser, name: 'Jane Doe' });

      const result = await service.updateProfile('user-id-1', dto);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: expect.objectContaining({ name: 'Jane Doe' }),
      });
      expect(result.message).toBe('Profile updated successfully');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should update username after passing uniqueness check', async () => {
      const dto: UpdateProfileDto = { username: 'newusername' };
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser); // existence check
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);    // username check passes
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser, username: 'newusername' });

      const result = await service.updateProfile('user-id-1', dto);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: expect.objectContaining({ username: 'newusername' }),
      });
      expect(result.user.username).toBe('newusername');
    });

    it('should upload new avatar and delete old avatar from Cloudinary', async () => {
      const dto: UpdateProfileDto = {};
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser); // has old avatar
      mockCloudinaryService.uploadAvatar.mockResolvedValue({
        secure_url: 'https://cloudinary.com/new-avatar.jpg',
      });
      mockCloudinaryService.deleteImage.mockResolvedValue({ result: 'ok' });
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        avatar: 'https://cloudinary.com/new-avatar.jpg',
      });

      const mockFile = { buffer: Buffer.from('img') } as Express.Multer.File;
      const result = await service.updateProfile('user-id-1', dto, mockFile);

      expect(mockCloudinaryService.uploadAvatar).toHaveBeenCalledWith(mockFile);
      expect(mockCloudinaryService.deleteImage).toHaveBeenCalledWith(mockUser.avatar);
      expect(result.user.avatar).toBe('https://cloudinary.com/new-avatar.jpg');
    });

    it('should NOT call deleteImage when user has no existing avatar', async () => {
      const userWithNoAvatar = { ...mockUser, avatar: null };
      const dto: UpdateProfileDto = {};
      mockPrismaService.user.findUnique.mockResolvedValueOnce(userWithNoAvatar);
      mockCloudinaryService.uploadAvatar.mockResolvedValue({
        secure_url: 'https://cloudinary.com/new-avatar.jpg',
      });
      mockPrismaService.user.update.mockResolvedValue({
        ...userWithNoAvatar,
        avatar: 'https://cloudinary.com/new-avatar.jpg',
      });

      const mockFile = { buffer: Buffer.from('img') } as Express.Multer.File;
      await service.updateProfile('user-id-1', dto, mockFile);

      expect(mockCloudinaryService.uploadAvatar).toHaveBeenCalled();
      expect(mockCloudinaryService.deleteImage).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateProfile('non-existent-id', { name: 'Test' }),
      ).rejects.toThrow(new NotFoundException('User with ID non-existent-id not found'));
    });

    it('should throw ConflictException when username is taken by another user', async () => {
      const dto: UpdateProfileDto = { username: 'taken-username' };
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser); // existence check
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        id: 'other-user-id',
        username: 'taken-username',
      }); // username conflict

      await expect(service.updateProfile('user-id-1', dto)).rejects.toThrow(
        new ConflictException('Username is already taken'),
      );
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should NOT throw when username belongs to the same user (no-op update)', async () => {
      const dto: UpdateProfileDto = { username: 'johndoe' }; // same as current
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser); // existence check
      // No username uniqueness check should be triggered because trimmed === user.username
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      await expect(service.updateProfile('user-id-1', dto)).resolves.not.toThrow();
      // findUnique called only once (existence check), NOT for username uniqueness
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when Cloudinary upload fails', async () => {
      const dto: UpdateProfileDto = {};
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      mockCloudinaryService.uploadAvatar.mockRejectedValue(new Error('upload error'));

      const mockFile = { buffer: Buffer.from('img') } as Express.Multer.File;
      await expect(service.updateProfile('user-id-1', dto, mockFile)).rejects.toThrow(
        new BadRequestException('Avatar upload to Cloudinary failed'),
      );
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should ignore name update when trimmed name is an empty string', async () => {
      const dto: UpdateProfileDto = { name: '   ' }; // whitespace only
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      await service.updateProfile('user-id-1', dto);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        // name should NOT be in the update data because it trims to empty string
        data: expect.not.objectContaining({ name: '   ' }),
      });
    });

    it('should ignore username update when trimmed username is an empty string', async () => {
      const dto: UpdateProfileDto = { username: '   ' }; // whitespace only
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      await service.updateProfile('user-id-1', dto);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: expect.not.objectContaining({ username: '   ' }),
      });
    });
  });

  // =========================================================================
  // updateRole()
  // =========================================================================

  describe('updateRole()', () => {
    it('should update user role and return sanitized user without password', async () => {
      const newRole = UserRole.DEVELOPER;
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        userRole: newRole,
      });

      const result = await service.updateRole('user-id-1', newRole);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: { userRole: newRole },
      });
      expect(result.message).toBe('User role updated successfully');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.userRole).toBe(newRole);
    });

    it('should throw NotFoundException when user to update role is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateRole('non-existent-id', UserRole.DEVELOPER),
      ).rejects.toThrow(new NotFoundException('User with ID non-existent-id not found'));
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });
});
