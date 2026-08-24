import { ApiProperty } from '@nestjs/swagger';

export class RetrievedContextChunkDto {
  @ApiProperty({
    example: 'ck1234567890',
    description: 'Unique identifier of the code chunk',
  })
  id: string;

  @ApiProperty({
    example: 'export class AuthService { ... }',
    description: 'Code snippet content',
  })
  content: string;

  @ApiProperty({
    example: 1,
    description: 'Starting line number in the source file',
  })
  startLine: number;

  @ApiProperty({
    example: 45,
    description: 'Ending line number in the source file',
  })
  endLine: number;

  @ApiProperty({
    example: 'src/auth/auth.service.ts',
    description: 'Relative path of the source file',
  })
  filePath: string;

  @ApiProperty({
    example: 0.89,
    description: 'Cosine similarity score (0 to 1)',
  })
  similarity: number;
}
