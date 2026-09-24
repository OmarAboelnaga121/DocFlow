import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CalculateRepoDto {
  @ApiProperty({
    example: 'https://github.com/octocat/Hello-World.git',
    description: 'Git repository URL to estimate indexing credits for',
  })
  @IsString({ message: 'Repository URL must be a string' })
  @IsNotEmpty({ message: 'Repository URL is required' })
  repoUrl: string;
}