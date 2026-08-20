import {
  Controller,
  Get,
  Post,
  Req,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  constructor(private readonly authService: AuthService) {}

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
  async login(@Req() req: any) {
    return this.authService.login(req.user);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Initiate GitHub OAuth flow' })
  async githubAuth() {
    // Initiates GitHub OAuth authentication flow
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @UseInterceptors(AuthCookieInterceptor)
  @ApiOperation({ summary: 'GitHub OAuth callback handler' })
  async githubAuthCallback(@Req() req: any) {
    return this.authService.validateGithubUser(req.user);
  }

  @Post('logout')
  @UseInterceptors(ClearCookieInterceptor)
  @ApiOperation({ summary: 'Logout user and clear auth cookie' })
  async logout() {
    return { message: 'Logged out successfully' };
  }
}
