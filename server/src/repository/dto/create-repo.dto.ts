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
  @Matches(
    /^(?!\/)(?!-)(?!.*(?:--|\/\.|\.\.|\/\/|\.lock$|[\x00-\x1f\x7f ~^:?*\[\\]))[a-zA-Z0-9_\-\.\/]+$/,
    {
      message:
        'Invalid branch name format. Branch cannot start with a hyphen or slash, or contain git ref special characters.',
    },
  )
  branch?: string;
}
