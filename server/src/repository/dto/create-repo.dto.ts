import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateRepoDto {
  @ApiProperty({
    example: 'https://github.com/octocat/Hello-World.git',
    description: 'Git repository URL (HTTP, HTTPS, or SSH)',
  })
  @IsString({ message: 'Repository URL must be a string' })
  @IsNotEmpty({ message: 'Repository URL is required' })
  @Matches(/^(https?:\/\/|git@).+/i, {
    message: 'Please provide a valid HTTP/HTTPS or SSH Git repository URL',
  })
  url: string;

  @ApiProperty({
    example: 'Hello-World',
    description: 'Repository name (inferred from URL if omitted)',
  })
  @IsString({ message: 'Repository name must be a string' })
  @IsNotEmpty({ message: 'Repository name is required' })
  name: string;

  @ApiPropertyOptional({
    example: 'main',
    description: 'Target branch to clone (defaults to repository default branch)',
  })
  @IsOptional()
  @IsString({ message: 'Branch name must be a string' })
  branch?: string;
}
