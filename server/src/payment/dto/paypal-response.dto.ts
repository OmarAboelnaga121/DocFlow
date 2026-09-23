import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PayPalCreateSubscriptionResponseDto {
  @ApiProperty({
    description: 'The PayPal subscription ID (e.g. I-BW452GLLEP1G)',
    example: 'I-BW452GLLEP1G',
  })
  id: string;

  @ApiProperty({
    description: 'Status of the created subscription',
    example: 'APPROVAL_PENDING',
  })
  status: string;

  @ApiProperty({
    description: 'The URL where the user approves the subscription agreement',
    example: 'https://www.sandbox.paypal.com/checkoutnow?token=I-BW452GLLEP1G',
  })
  approveUrl: string;
}

export class PayPalSubscriberNameDto {
  @ApiPropertyOptional({ example: 'John' })
  given_name?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  surname?: string;
}

export class PayPalSubscriberDto {
  @ApiPropertyOptional({ example: 'buyer@example.com' })
  email_address?: string;

  @ApiPropertyOptional({ example: '2J9X8XG5L3L4N' })
  payer_id?: string;

  @ApiPropertyOptional({ type: () => PayPalSubscriberNameDto })
  name?: PayPalSubscriberNameDto;
}

export class PayPalAmountDto {
  @ApiProperty({ example: 'USD' })
  currency_code: string;

  @ApiProperty({ example: '15.00' })
  value: string;
}

export class PayPalLastPaymentDto {
  @ApiPropertyOptional({ type: () => PayPalAmountDto })
  amount?: PayPalAmountDto;

  @ApiPropertyOptional({ example: '2026-09-23T10:00:00Z' })
  time?: string;
}

export class PayPalBillingInfoDto {
  @ApiPropertyOptional({ example: '2026-10-23T10:00:00Z' })
  next_billing_time?: string;

  @ApiPropertyOptional({ type: () => PayPalLastPaymentDto })
  last_payment?: PayPalLastPaymentDto;
}

export type PayPalSubscriptionStatus =
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'EXPIRED';

export class PayPalSubscriptionDetailsDto {
  @ApiProperty({ example: 'I-BW452GLLEP1G' })
  id: string;

  @ApiProperty({
    example: 'ACTIVE',
    enum: ['APPROVAL_PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'],
  })
  status: PayPalSubscriptionStatus;

  @ApiProperty({ example: 'P-3837859192537902XNKZPMOY' })
  plan_id: string;

  @ApiPropertyOptional({ example: 'user-uuid-123' })
  custom_id?: string;

  @ApiPropertyOptional({ type: () => PayPalSubscriberDto })
  subscriber?: PayPalSubscriberDto;

  @ApiPropertyOptional({ type: () => PayPalBillingInfoDto })
  billing_info?: PayPalBillingInfoDto;

  @ApiPropertyOptional({ example: '2026-09-23T00:00:00Z' })
  create_time?: string;
}
