import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateRoleDto {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.DEVELOPER,
    description: 'User role in the system (DEVELOPER, BUSINESS, USER)',
  })
  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(UserRole, {
    message: 'Role must be one of: DEVELOPER, BUSINESS, USER',
  })
  role: UserRole;
}
