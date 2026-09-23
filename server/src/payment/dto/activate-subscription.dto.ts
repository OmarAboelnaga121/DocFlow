import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ActivateSubscriptionDto {
  @ApiProperty({
    description: 'The PayPal subscription ID generated during checkout approval (e.g. I-BW452GLLEP1G)',
    example: 'I-BW452GLLEP1G',
  })
  @IsNotEmpty({ message: 'subscriptionId is required' })
  @IsString({ message: 'subscriptionId must be a valid string' })
  @Matches(/^I-[A-Z0-9]+$/, {
    message: 'subscriptionId must follow standard PayPal format (e.g., I-XXXXXXXXXXXX)',
  })
  subscriptionId: string;
}
