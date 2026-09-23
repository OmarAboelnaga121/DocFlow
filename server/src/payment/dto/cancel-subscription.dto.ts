import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelSubscriptionDto {
  @ApiPropertyOptional({
    description: 'Reason for canceling the subscription',
    example: 'No longer need higher credit limits',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Cancellation reason must be a string' })
  @MaxLength(255, { message: 'Cancellation reason must not exceed 255 characters' })
  reason?: string;
}
