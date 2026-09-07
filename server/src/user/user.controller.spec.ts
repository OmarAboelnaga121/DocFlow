import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UpdateProfileDto } from './DTO/update-profile.dto';
import { UpdateRoleDto } from './DTO/update-role.dto';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const mockUserProfile = {
  id: 'user-id-1',
  email: 'john@example.com',
  username: 'johndoe',
  name: 'John Doe',
  avatar: null,
  userRole: UserRole.USER,
};

const mockUserService = {
  findById: jest.fn(),
  updateProfile: jest.fn(),
  updateRole: jest.fn(),
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // =========================================================================
  // GET /user/profile
  // =========================================================================

  describe('getProfile()', () => {
    it('should delegate to userService.findById() with the current user id and return the result', async () => {
      mockUserService.findById.mockResolvedValue(mockUserProfile);

      const result = await controller.getProfile('user-id-1');

      expect(mockUserService.findById).toHaveBeenCalledWith('user-id-1');
      expect(result).toEqual(mockUserProfile);
    });
  });

  // =========================================================================
  // PATCH /user/profile
  // =========================================================================

  describe('updateProfile()', () => {
    it('should delegate to userService.updateProfile() with userId, dto, and file and return the result', async () => {
      const dto: UpdateProfileDto = { name: 'Jane Doe', username: 'janedoe' };
      const file = { originalname: 'avatar.jpg' } as Express.Multer.File;
      const mockResponse = { message: 'Profile updated successfully', user: mockUserProfile };
      mockUserService.updateProfile.mockResolvedValue(mockResponse);

      const result = await controller.updateProfile('user-id-1', dto, file);

      expect(mockUserService.updateProfile).toHaveBeenCalledWith('user-id-1', dto, file);
      expect(result).toEqual(mockResponse);
    });

    it('should call userService.updateProfile() with undefined file when no file is uploaded', async () => {
      const dto: UpdateProfileDto = { name: 'Jane Doe' };
      const mockResponse = { message: 'Profile updated successfully', user: mockUserProfile };
      mockUserService.updateProfile.mockResolvedValue(mockResponse);

      await controller.updateProfile('user-id-1', dto, undefined);

      expect(mockUserService.updateProfile).toHaveBeenCalledWith('user-id-1', dto, undefined);
    });
  });

  // =========================================================================
  // PATCH /user/:id/role
  // =========================================================================

  describe('updateUserRole()', () => {
    it('should delegate to userService.updateRole() with target user id and role from dto and return the result', async () => {
      const updateRoleDto: UpdateRoleDto = { role: UserRole.DEVELOPER };
      const mockResponse = {
        message: 'User role updated successfully',
        user: { ...mockUserProfile, userRole: UserRole.DEVELOPER },
      };
      mockUserService.updateRole.mockResolvedValue(mockResponse);

      const result = await controller.updateUserRole('user-id-1', 'user-id-1', updateRoleDto);

      expect(mockUserService.updateRole).toHaveBeenCalledWith('user-id-1', UserRole.DEVELOPER);
      expect(result).toEqual(mockResponse);
    });

    it('should throw ForbiddenException when user attempts to update another user role', async () => {
      const updateRoleDto: UpdateRoleDto = { role: UserRole.DEVELOPER };
      await expect(
        controller.updateUserRole('user-id-1', 'other-user-id', updateRoleDto),
      ).rejects.toThrow(ForbiddenException);
      expect(mockUserService.updateRole).not.toHaveBeenCalled();
    });
  });
});
