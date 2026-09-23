import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { planTier, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PayPalClient } from './paypal.client';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ActivateSubscriptionDto } from './dto/activate-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';

const TIER_CREDIT_ALLOCATIONS: Record<planTier, number> = {
  [planTier.FREE]: 50,
  [planTier.PRO]: 1000,
  [planTier.PREMIUM]: 5000,
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly payPalClient: PayPalClient,
  ) {}

  private getPlanId(tier: planTier): string {
    const planKey = tier === planTier.PRO ? 'PAYPAL_PRO_PLAN_ID' : 'PAYPAL_PREMIUM_PLAN_ID';
    const planId = this.configService.get<string>(planKey);

    if (!planId) {
      this.logger.error(`PayPal Plan ID for tier ${tier} is not configured (${planKey})`);
      throw new InternalServerErrorException(`Billing plan configuration for ${tier} is unavailable`);
    }

    return planId;
  }

  private resolveTierFromPlanId(planId: string): planTier {
    const proPlanId = this.configService.get<string>('PAYPAL_PRO_PLAN_ID');
    const premiumPlanId = this.configService.get<string>('PAYPAL_PREMIUM_PLAN_ID');

    if (planId === proPlanId) return planTier.PRO;
    if (planId === premiumPlanId) return planTier.PREMIUM;

    this.logger.warn(`Unrecognized PayPal Plan ID: ${planId}. Defaulting to PRO tier.`);
    return planTier.PRO;
  }

  /**
   * Initializes a PayPal subscription session and returns the approval URL for the client.
   */
  async createSubscription(userId: string, dto: CreateSubscriptionDto) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required to create a subscription');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Authenticated user not found');
    }

    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (existingSubscription && existingSubscription.status === SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(
        `User already has an active ${existingSubscription.planTier} subscription. Cancel or manage it before creating a new one.`,
      );
    }

    const planId = this.getPlanId(dto.planTier);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const returnUrl = `${frontendUrl}/billing/success`;
    const cancelUrl = `${frontendUrl}/billing/cancel`;

    const paypalSession = await this.payPalClient.createSubscription(
      planId,
      userId,
      returnUrl,
      cancelUrl,
    );

    return {
      subscriptionId: paypalSession.id,
      status: paypalSession.status,
      approvalUrl: paypalSession.approveUrl,
    };
  }

  /**
   * Verifies the client-approved subscription with PayPal and applies tier & credits atomically.
   */
  async activateSubscription(userId: string, dto: ActivateSubscriptionDto) {
    const details = await this.payPalClient.getSubscription(dto.subscriptionId);

    if (details.status !== 'ACTIVE' && details.status !== 'APPROVED') {
      throw new BadRequestException(
        `Subscription ${dto.subscriptionId} cannot be activated. Current PayPal status: ${details.status}`,
      );
    }

    if (details.custom_id && details.custom_id !== userId) {
      this.logger.warn(
        `Subscription custom_id mismatch: expected ${userId}, got ${details.custom_id}`,
      );
      throw new ForbiddenException('This subscription is not associated with your account');
    }

    const tier = this.resolveTierFromPlanId(details.plan_id);
    const creditsToAward = TIER_CREDIT_ALLOCATIONS[tier];

    // Compute period end from PayPal next_billing_time or fallback to 30 days
    const nextBilling = details.billing_info?.next_billing_time
      ? new Date(details.billing_info.next_billing_time)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const idempotencyKey = `activation_${dto.subscriptionId}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Upsert Subscription record
      const subscription = await tx.subscription.upsert({
        where: { userId },
        update: {
          planTier: tier,
          paypalSubscriptionId: dto.subscriptionId,
          paypalAgreementId: dto.subscriptionId,
          paypalPlanId: details.plan_id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: nextBilling,
        },
        create: {
          userId,
          planTier: tier,
          paypalSubscriptionId: dto.subscriptionId,
          paypalAgreementId: dto.subscriptionId,
          paypalPlanId: details.plan_id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: nextBilling,
        },
      });

      // 2. Check for duplicate credit allocation (idempotency)
      const existingLedger = await tx.creditLedger.findUnique({
        where: { referenceId: idempotencyKey },
      });

      let updatedBalance = 0;

      if (!existingLedger) {
        // Record credit event in ledger
        await tx.creditLedger.create({
          data: {
            userId,
            amount: creditsToAward,
            reason: `paypal_subscription_activation_${tier.toLowerCase()}`,
            referenceId: idempotencyKey,
          },
        });

        // Increment user credit balance
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            creditBalance: { increment: creditsToAward },
          },
          select: { creditBalance: true },
        });

        updatedBalance = updatedUser.creditBalance;
      } else {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { creditBalance: true },
        });
        updatedBalance = user?.creditBalance ?? 0;
      }

      return {
        message: 'Subscription successfully activated',
        subscriptionId: subscription.paypalSubscriptionId,
        tier: subscription.planTier,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        creditBalance: updatedBalance,
      };
    });
  }

  /**
   * Retrieves active subscription details and credit balance for current authenticated user.
   */
  async getCurrentSubscription(userId: string) {
    const [subscription, user] = await Promise.all([
      this.prisma.subscription.findUnique({ where: { userId } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { creditBalance: true },
      }),
    ]);

    return {
      subscription: subscription ?? {
        planTier: planTier.FREE,
        status: SubscriptionStatus.INACTIVE,
        currentPeriodEnd: null,
      },
      creditBalance: user?.creditBalance ?? 0,
    };
  }

  /**
   * Cancels active subscription both on PayPal Gateway and locally.
   */
  async cancelSubscription(userId: string, dto: CancelSubscriptionDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new NotFoundException('No active subscription found for this user');
    }

    if (subscription.paypalSubscriptionId) {
      await this.payPalClient.cancelSubscription(
        subscription.paypalSubscriptionId,
        dto.reason || 'User requested cancellation from DocFlow portal',
      );
    }

    const updated = await this.prisma.subscription.update({
      where: { userId },
      data: {
        status: SubscriptionStatus.CANCELED,
      },
    });

    return {
      message: 'Subscription successfully canceled',
      status: updated.status,
      planTier: updated.planTier,
    };
  }

  /**
   * Processes asynchronous PayPal webhook notifications.
   */
  async handleWebhook(headers: Record<string, string | string[] | undefined>, body: any) {
    const webhookId = this.configService.get<string>('PAYPAL_WEBHOOK_ID');

    // Webhook signature verification (if WEBHOOK_ID is provided)
    if (webhookId) {
      const isValid = await this.payPalClient.verifyWebhookSignature(headers, body, webhookId);
      if (!isValid) {
        this.logger.warn('PayPal Webhook verification failed. Request discarded.');
        throw new BadRequestException('Invalid webhook signature');
      }
    } else {
      this.logger.warn('PAYPAL_WEBHOOK_ID is not configured; skipping signature verification.');
    }

    const eventType = body?.event_type;
    const resource = body?.resource;

    this.logger.log(`Handling PayPal webhook event: ${eventType}`);

    switch (eventType) {
      case 'PAYMENT.SALE.COMPLETED': {
        await this.handleRecurringPaymentCompleted(resource);
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        await this.handleSubscriptionStatusChange(
          resource?.id,
          SubscriptionStatus.CANCELED,
          'Subscription canceled via PayPal portal',
        );
        break;
      }

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        await this.handleSubscriptionStatusChange(
          resource?.id,
          SubscriptionStatus.INACTIVE,
          `Subscription updated to inactive: ${eventType}`,
        );
        break;
      }

      default:
        this.logger.debug(`Unhandled PayPal event type: ${eventType}`);
    }

    return { received: true };
  }

  /**
   * Idempotently credits the user for recurring billing cycles.
   */
  private async handleRecurringPaymentCompleted(resource: any) {
    const subscriptionId = resource?.billing_agreement_id;
    const saleId = resource?.id;

    if (!subscriptionId || !saleId) {
      this.logger.warn('PAYMENT.SALE.COMPLETED missing billing_agreement_id or sale ID');
      return;
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        OR: [{ paypalSubscriptionId: subscriptionId }, { paypalAgreementId: subscriptionId }],
      },
    });

    if (!subscription) {
      this.logger.warn(
        `Subscription ${subscriptionId} for sale ${saleId} not found in database.`,
      );
      return;
    }

    const creditsToAward = TIER_CREDIT_ALLOCATIONS[subscription.planTier];
    const idempotencyKey = `sale_${saleId}`;

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.creditLedger.findUnique({
        where: { referenceId: idempotencyKey },
      });

      if (existing) {
        this.logger.log(`Sale ${saleId} already processed. Skipping duplicate ledger insertion.`);
        return;
      }

      // Record ledger entry
      await tx.creditLedger.create({
        data: {
          userId: subscription.userId,
          amount: creditsToAward,
          reason: 'paypal_subscription_renewal',
          referenceId: idempotencyKey,
        },
      });

      // Increment credit balance
      await tx.user.update({
        where: { id: subscription.userId },
        data: {
          creditBalance: { increment: creditsToAward },
        },
      });

      // Extend period end by 30 days
      const currentPeriod = subscription.currentPeriodEnd > new Date()
        ? subscription.currentPeriodEnd
        : new Date();
      const extendedPeriod = new Date(currentPeriod.getTime() + 30 * 24 * 60 * 60 * 1000);

      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: extendedPeriod,
        },
      });

      this.logger.log(
        `Renewed subscription ${subscription.id} for user ${subscription.userId}. Awarded ${creditsToAward} credits.`,
      );
    });
  }

  private async handleSubscriptionStatusChange(
    subscriptionId: string,
    status: SubscriptionStatus,
    reason: string,
  ) {
    if (!subscriptionId) return;

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        OR: [{ paypalSubscriptionId: subscriptionId }, { paypalAgreementId: subscriptionId }],
      },
    });

    if (!subscription) {
      this.logger.warn(`Subscription ${subscriptionId} not found for status update to ${status}`);
      return;
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status },
    });

    this.logger.log(`Subscription ${subscription.id} updated to ${status}. Reason: ${reason}`);
  }
}
