import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth('token')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: any) {
    return this.userService.findById(req.user.id);
  }
}
