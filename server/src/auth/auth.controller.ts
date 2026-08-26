import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
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

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('avatar'), AuthCookieInterceptor)
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ summary: 'Register a new user with optional avatar image upload' })
  async register(
    @Body() registerDto: RegisterDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.authService.register(registerDto, file);
  }

  @Post('login')
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
  async githubAuthCallback(
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const authData = await this.authService.validateGithubUser(user);

    res.cookie('token', authData.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

    return res.redirect(`${frontendUrl}/dashboard`);
  }

  @Post('logout')
  @UseInterceptors(ClearCookieInterceptor)
  @ApiOperation({ summary: 'Logout user and clear auth cookie' })
  async logout() {
    return { message: 'Logged out successfully' };
  }
}
