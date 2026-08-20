import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password (minimum 6 characters)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiPropertyOptional({
    example: 'johndoe',
    description: 'Unique username',
  })
  @IsString()
  username: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Full display name',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'User avatar image file (JPEG/PNG/WEBP)',
  })
  avatar?: string;
}
