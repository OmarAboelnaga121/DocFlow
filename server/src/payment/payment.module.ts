import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PayPalClient } from './paypal.client';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, PayPalClient],
  exports: [PaymentService, PayPalClient],
})
export class PaymentModule {}
