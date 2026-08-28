import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './DTO/register.dto';
import { GithubUserData } from './DTO/github.dto';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const mockAuthResponse = {
  message: 'success',
  accessToken: 'mock-jwt-token',
  user: { id: 'user-id-1', email: 'john@example.com' },
};

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  validateGithubUser: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // =========================================================================
  // POST /auth/register
  // =========================================================================

  describe('register()', () => {
    it('should delegate to authService.register() with dto and file and return the result', async () => {
      const dto: RegisterDto = {
        email: 'john@example.com',
        password: 'password123',
        username: 'johndoe',
        name: 'John Doe',
      };
      const file = { originalname: 'avatar.jpg' } as Express.Multer.File;
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(dto, file);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto, file);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should call authService.register() with undefined file when no file is uploaded', async () => {
      const dto: RegisterDto = {
        email: 'jane@example.com',
        password: 'password123',
        username: 'janedoe',
        name: 'Jane Doe',
      };
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      await controller.register(dto, undefined);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto, undefined);
    });
  });

  // =========================================================================
  // POST /auth/login
  // =========================================================================

  describe('login()', () => {
    it('should delegate to authService.login() with the current user and return the result', async () => {
      const user = { id: 'user-id-1', email: 'john@example.com', username: 'johndoe' };
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(user);

      expect(mockAuthService.login).toHaveBeenCalledWith(user);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  // =========================================================================
  // GET /auth/github
  // =========================================================================

  describe('githubAuth()', () => {
    it('should return undefined (OAuth redirect is handled by PassportGuard)', async () => {
      const result = await controller.githubAuth();
      expect(result).toBeUndefined();
    });
  });

  // =========================================================================
  // GET /auth/github/callback
  // =========================================================================

  describe('githubAuthCallback()', () => {
    it('should validate github user, set auth cookie, and redirect to dashboard', async () => {
      const githubUser: GithubUserData = {
        providerId: 'github-123',
        username: 'gh-johndoe',
        name: 'John GitHub',
        email: 'john@github.com',
        avatar: 'https://avatars.githubusercontent.com/u/1',
        accessToken: 'github-access-token',
      };
      mockAuthService.validateGithubUser.mockResolvedValue(mockAuthResponse);
      mockConfigService.get.mockReturnValue('http://localhost:3000');

      const mockResponse: any = {
        cookie: jest.fn(),
        redirect: jest.fn(),
      };

      await controller.githubAuthCallback(githubUser, mockResponse);

      expect(mockAuthService.validateGithubUser).toHaveBeenCalledWith(githubUser);
      expect(mockResponse.cookie).toHaveBeenCalledWith('token', mockAuthResponse.accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      expect(mockResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/dashboard');
    });

    it('should fallback to default frontend url if FRONTEND_URL is not configured', async () => {
      const githubUser: GithubUserData = {
        providerId: 'github-123',
        username: 'gh-johndoe',
        name: 'John GitHub',
        email: 'john@github.com',
        avatar: 'https://avatars.githubusercontent.com/u/1',
        accessToken: 'github-access-token',
      };
      mockAuthService.validateGithubUser.mockResolvedValue(mockAuthResponse);
      mockConfigService.get.mockReturnValue(undefined);

      const mockResponse: any = {
        cookie: jest.fn(),
        redirect: jest.fn(),
      };

      await controller.githubAuthCallback(githubUser, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/dashboard');
    });
  });

  // =========================================================================
  // POST /auth/logout
  // =========================================================================

  describe('logout()', () => {
    it('should return the logout success message without calling any service method', async () => {
      const result = await controller.logout();

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockAuthService.register).not.toHaveBeenCalled();
      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(mockAuthService.validateGithubUser).not.toHaveBeenCalled();
    });
  });
});
