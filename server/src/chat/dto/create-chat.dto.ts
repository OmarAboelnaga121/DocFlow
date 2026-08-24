import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
  @ApiProperty({
    example: 'cly1234567890abcdef',
    description: 'Repository ID associated with this chat session',
  })
  @IsString({ message: 'Repository ID must be a string' })
  @IsNotEmpty({ message: 'Repository ID is required' })
  repoId: string;

  @ApiPropertyOptional({
    example: 'Authentication Architecture Discussion',
    description: 'Optional title for the chat session',
  })
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  title?: string;
}
