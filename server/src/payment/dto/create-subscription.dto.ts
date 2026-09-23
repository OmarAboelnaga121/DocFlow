import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsIn } from 'class-validator';
import { planTier } from '@prisma/client';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'The subscription plan tier to purchase',
    enum: [planTier.PRO, planTier.PREMIUM],
    example: planTier.PRO,
  })
  @IsNotEmpty({ message: 'planTier is required' })
  @IsEnum(planTier, { message: 'Invalid plan tier selected' })
  @IsIn([planTier.PRO, planTier.PREMIUM], {
    message: 'Subscription checkout can only be initiated for PRO or PREMIUM tiers',
  })
  planTier: planTier;
}
