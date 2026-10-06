import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  InternalServerErrorException,
} from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './DTO/register.dto';
import { LoginDto } from './DTO/login.dto';
import {
  AuthCookieInterceptor,
  ClearCookieInterceptor,
} from './interceptors/auth-cookie.interceptor';
import { getAuthCookieOptions } from './constants/cookie.config';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('avatar'), AuthCookieInterceptor)
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary: 'Register a new user with optional avatar image upload',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.authService.register(registerDto, file);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(AuthGuard('local'))
  @UseInterceptors(AuthCookieInterceptor)
  @ApiBody({ type: LoginDto })
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@CurrentUser() user: any) {
    return this.authService.login(user);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Initiate GitHub OAuth flow' })
  async githubAuth() {
    // Initiates GitHub OAuth authentication flow
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth callback handler' })
  async githubAuthCallback(@CurrentUser() user: any, @Res() res: Response) {
    const authData = await this.authService.validateGithubUser(user);

    res.cookie('token', authData.accessToken, getAuthCookieOptions());

    const rawFrontendUrl =
      this.configService.get<string>('FRONTEND_URL');

    if (!rawFrontendUrl) {
      throw new InternalServerErrorException(
        'FRONTEND_URL environment variable is not configured',
      );
    }

    const allowedOrigins = rawFrontendUrl
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);

    const frontendUrl =
      allowedOrigins.find((origin) => !origin.includes('api.')) ||
      allowedOrigins[0];

    if (frontendUrl.includes('api.')) {
      throw new InternalServerErrorException(
        'FRONTEND_URL is misconfigured: points to the backend API instead of the frontend client',
      );
    }

    return res.redirect(`${frontendUrl}/dashboard`);
  }

  @Post('logout')
  @UseInterceptors(ClearCookieInterceptor)
  @ApiOperation({ summary: 'Logout user and clear auth cookie' })
  async logout() {
    return { message: 'Logged out successfully' };
  }
}
