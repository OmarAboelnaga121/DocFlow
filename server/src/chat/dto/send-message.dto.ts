import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const QWEN_CHAT_MODELS = [
  'qwen3.7-plus',
  'qwen3.7-max',
  'qwen3.7-flash',
  'qwen3.6-plus',
] as const;

export type QwenChatModel = (typeof QWEN_CHAT_MODELS)[number];

export class SendMessageDto {
  @ApiProperty({
    example: 'How does the authentication flow work in this repository?',
    description: 'The content of the message sent by the user',
  })
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content cannot be empty' })
  content: string;

  @ApiPropertyOptional({
    enum: QWEN_CHAT_MODELS,
    example: 'qwen3.7-plus',
    description:
      'Optional model chosen by the user for this specific message. Supported Qwen APIs only.',
  })
  @IsOptional()
  @IsString({ message: 'Model must be a string' })
  @IsIn(QWEN_CHAT_MODELS, {
    message: 'Model must be one of: qwen3.7-plus, qwen3.7-max, qwen3.7-flash, qwen3.6-plus',
  })
  model?: QwenChatModel;
}
