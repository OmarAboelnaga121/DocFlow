import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateProfileDto } from './DTO/update-profile.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { password: _, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    file?: Express.Multer.File,
  ) {
    // 1. Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 2. verify username not exists
    const trimmedUsername = dto.username?.trim();
    if (trimmedUsername && trimmedUsername !== user.username) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username: trimmedUsername },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Username is already taken');
      }
    }

    // 3. verify that the name or username is not empty string if they are empty it ignore it
    const trimmedName = dto.name?.trim();

    // 4. if file is provided upload it to cloudinary
    // 5. delete old image from cloudinary if exists
    let avatarUrl = user.avatar;
    if (file) {
      try {
        const uploadResult = await this.cloudinaryService.uploadAvatar(file);
        avatarUrl = uploadResult.secure_url;

        // Delete old image from cloudinary if it exists
        if (user.avatar) {
          await this.cloudinaryService.deleteImage(user.avatar);
        }
      } catch (error) {
        throw new BadRequestException('Avatar upload to Cloudinary failed');
      }
    }

    // 6. update user in database
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(trimmedName ? { name: trimmedName } : {}),
        ...(trimmedUsername ? { username: trimmedUsername } : {}),
        ...(avatarUrl !== undefined && { avatar: avatarUrl }),
      },
    });

    // 7. return updated user
    const { password: _, ...sanitizedUser } = updatedUser;
    return {
      message: 'Profile updated successfully',
      user: sanitizedUser,
    };
  }

  async updateRole(userId: string, role: UserRole) {
    // 1. Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 2. Update role
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        userRole: role,
      },
    });

    const { password: _, ...sanitizedUser } = updatedUser;
    return {
      message: 'User role updated successfully',
      user: sanitizedUser,
    };
  }
}
