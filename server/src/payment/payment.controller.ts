import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentService } from './payment.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ActivateSubscriptionDto } from './dto/activate-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('subscriptions/create')
  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth('token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate a PayPal subscription checkout session' })
  @ApiResponse({
    status: 201,
    description: 'Subscription session initialized; returns PayPal approval URL',
  })
  async createSubscription(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.paymentService.createSubscription(userId, dto);
  }

  @Post('subscriptions/activate')
  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth('token')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Confirm client approval and activate the subscription in DocFlow',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription activated, tier assigned, and credits awarded',
  })
  async activateSubscription(
    @CurrentUser('id') userId: string,
    @Body() dto: ActivateSubscriptionDto,
  ) {
    return this.paymentService.activateSubscription(userId, dto);
  }

  @Get('subscriptions/current')
  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth('token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve current subscription status and credit balance' })
  @ApiResponse({ status: 200, description: 'Current subscription and balance returned' })
  async getCurrentSubscription(@CurrentUser('id') userId: string) {
    return this.paymentService.getCurrentSubscription(userId);
  }

  @Post('subscriptions/cancel')
  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth('token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel active PayPal subscription' })
  @ApiResponse({ status: 200, description: 'Subscription canceled successfully' })
  async cancelSubscription(
    @CurrentUser('id') userId: string,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.paymentService.cancelSubscription(userId, dto);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public PayPal webhook receiver for subscription events' })
  @ApiResponse({ status: 200, description: 'Webhook event processed' })
  async handleWebhook(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: any,
  ) {
    return this.paymentService.handleWebhook(headers, body);
  }
}
