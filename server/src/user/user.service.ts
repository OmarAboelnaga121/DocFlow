import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { RedisService } from '../redis/redis.service';
import { UpdateProfileDto } from './DTO/update-profile.dto';
import { User, UserRole } from '@prisma/client';

export type SanitizedUser = Omit<User, 'password'>;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private static readonly USER_CACHE_TTL = 3600; // 1 hour TTL

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly redis: RedisService,
  ) {}

  private getUserCacheKey(id: string): string {
    return `user:${id}`;
  }

  private sanitizeUser(user: User): SanitizedUser {
    const sanitized = { ...user } as Partial<User>;
    delete sanitized.password;
    return sanitized as SanitizedUser;
  }

  private async invalidateUserCache(userId: string): Promise<void> {
    await this.redis.invalidateCache(this.getUserCacheKey(userId));
  }

  async findById(id: string): Promise<SanitizedUser> {
    return this.redis.getOrSet(
      this.getUserCacheKey(id),
      UserService.USER_CACHE_TTL,
      async () => {
        const user = await this.prisma.user.findUnique({
          where: { id },
        });
        if (!user) {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
        return this.sanitizeUser(user);
      },
    );
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

    // 4. if file is provided upload it to cloudinary, else retain existing avatar or fallback
    let avatarUrl = user.avatar;
    if (file && file.buffer) {
      try {
        const uploadResult = await this.cloudinaryService.uploadAvatar(file);
        avatarUrl = uploadResult.secure_url;

        // Delete old image from cloudinary if it exists
        if (user.avatar && user.avatar.includes('cloudinary')) {
          await this.cloudinaryService.deleteImage(user.avatar);
        }
      } catch {
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

    // 7. Invalidate cached profile
    await this.invalidateUserCache(userId);

    // 8. return updated user
    const sanitizedUser = this.sanitizeUser(updatedUser);
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

    // 3. Invalidate cached profile
    await this.invalidateUserCache(userId);

    const sanitizedUser = this.sanitizeUser(updatedUser);
    return {
      message: 'User role updated successfully',
      user: sanitizedUser,
    };
  }
}
