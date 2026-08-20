import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProvider } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { GithubUserData } from './DTO/github.dto';
import { RegisterDto } from './DTO/register.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async register(registerDto: RegisterDto, file?: Express.Multer.File) {
    const { email, password, username, name } = registerDto;

    // 1. Check if email already in use
    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    // 2. Check if username already in use
    if (username) {
      const existingUserByUsername = await this.prisma.user.findUnique({
        where: { username },
      });

      if (existingUserByUsername) {
        throw new ConflictException('Username is already taken');
      }
    }

    // 3. Upload avatar to Cloudinary if provided
    let avatarUrl: string | undefined;
    if (file) {
      try {
        const uploadResult = await this.cloudinaryService.uploadAvatar(file);
        avatarUrl = uploadResult.secure_url;
      } catch (error) {
        throw new BadRequestException('Avatar upload to Cloudinary failed');
      }
    }

    // 4. Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 5. Create user in database
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username: username,
        name: name,
        avatar: avatarUrl,
        authProvider: AuthProvider.CREDENTIALS,
      },
    });

    // 6. Exclude password from response
    const { password: _, ...sanitizedUser } = user;

    // 7. Generate JWT
    const payload = { sub: user.id, username: user.username };
    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'User registered successfully',
      accessToken,
      user: sanitizedUser,
    };
  }

  async validateLocalUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { sub: user.id, username: user.username, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Logged in successfully',
      accessToken,
      user,
    };
  }

  async validateGithubUser(githubData: GithubUserData) {
    const { providerId, username, name, email, avatar } = githubData;

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { providerId: providerId },
          { email: email ? email : undefined },
        ],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          providerId,
          username,
          name,
          email: email || `${providerId}@github.user`,
          avatar,
          authProvider: AuthProvider.GITHUB,
        },
      });
    } else if (user.authProvider !== AuthProvider.GITHUB || user.providerId !== providerId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          providerId,
          authProvider: AuthProvider.GITHUB,
          avatar: avatar || user.avatar,
        },
      });
    }

    const payload = { sub: user.id, username: user.username };
    const jwtToken = this.jwtService.sign(payload);

    return {
      accessToken: jwtToken,
      user,
      githubAccessToken: githubData.accessToken,
    };
  }
}
