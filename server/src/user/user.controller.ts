import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateProfileDto } from './DTO/update-profile.dto';
import { UpdateRoleDto } from './DTO/update-role.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth('token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.userService.findById(userId);
  }

  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiCookieAuth('token')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary: 'Update current user profile (name, username, and optional avatar image)',
  })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.userService.updateProfile(userId, updateProfileDto, file);
  }

  @Patch(':id/role')
  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth('token')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Target user ID' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiOperation({ summary: 'Update specific user role by user ID' })
  async updateUserRole(
    @CurrentUser('id') currentUserId: string,
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    if (id !== currentUserId) {
      throw new ForbiddenException('You can only update your own user role');
    }
    return this.userService.updateRole(id, updateRoleDto.role);
  }
}
