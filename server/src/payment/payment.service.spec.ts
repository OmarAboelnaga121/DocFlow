import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { planTier, SubscriptionStatus } from '@prisma/client';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { PayPalClient } from './paypal.client';

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: any;
  let payPalClient: any;
  let configService: any;

  beforeEach(async () => {
    prisma = {
      subscription: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      creditLedger: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    payPalClient = {
      createSubscription: jest.fn(),
      getSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
      verifyWebhookSignature: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const configs: Record<string, string> = {
          PAYPAL_PRO_PLAN_ID: 'P-PRO-123',
          PAYPAL_PREMIUM_PLAN_ID: 'P-PREM-456',
          FRONTEND_URL: 'http://localhost:3000',
        };
        return configs[key] ?? defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
        { provide: PayPalClient, useValue: payPalClient },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSubscription', () => {
    it('should throw UnauthorizedException if userId is missing', async () => {
      await expect(
        service.createSubscription('', { planTier: planTier.PRO }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if authenticated user does not exist in database', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createSubscription('non-existent-user', { planTier: planTier.PRO }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user already has an active subscription', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.subscription.findUnique.mockResolvedValue({
        status: SubscriptionStatus.ACTIVE,
        planTier: planTier.PRO,
      });

      await expect(
        service.createSubscription('user-1', { planTier: planTier.PRO }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should initiate checkout with PayPal and return approval URL', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.subscription.findUnique.mockResolvedValue(null);
      payPalClient.createSubscription.mockResolvedValue({
        id: 'I-SUB123',
        status: 'APPROVAL_PENDING',
        approveUrl: 'https://paypal.com/approve/123',
      });

      const result = await service.createSubscription('user-1', {
        planTier: planTier.PRO,
      });

      expect(result).toEqual({
        subscriptionId: 'I-SUB123',
        status: 'APPROVAL_PENDING',
        approvalUrl: 'https://paypal.com/approve/123',
      });
      expect(payPalClient.createSubscription).toHaveBeenCalledWith(
        'P-PRO-123',
        'user-1',
        'http://localhost:3000/billing/success',
        'http://localhost:3000/billing/cancel',
      );
    });
  });

  describe('activateSubscription', () => {
    it('should reject activation if subscription does not belong to user', async () => {
      payPalClient.getSubscription.mockResolvedValue({
        id: 'I-SUB123',
        status: 'ACTIVE',
        plan_id: 'P-PRO-123',
        custom_id: 'different-user',
      });

      await expect(
        service.activateSubscription('user-1', { subscriptionId: 'I-SUB123' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should activate subscription, record credit ledger and increment balance', async () => {
      payPalClient.getSubscription.mockResolvedValue({
        id: 'I-SUB123',
        status: 'ACTIVE',
        plan_id: 'P-PRO-123',
        custom_id: 'user-1',
        billing_info: {
          next_billing_time: new Date(Date.now() + 86400000).toISOString(),
        },
      });

      prisma.subscription.upsert.mockResolvedValue({
        id: 'sub-db-1',
        userId: 'user-1',
        planTier: planTier.PRO,
        paypalSubscriptionId: 'I-SUB123',
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date(),
      });

      prisma.creditLedger.findUnique.mockResolvedValue(null);
      prisma.user.update.mockResolvedValue({ creditBalance: 1050 });

      const result = await service.activateSubscription('user-1', {
        subscriptionId: 'I-SUB123',
      });

      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(result.tier).toBe(planTier.PRO);
      expect(result.creditBalance).toBe(1050);
      expect(prisma.creditLedger.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          amount: 1000,
          referenceId: 'activation_I-SUB123',
        }),
      });
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription with PayPal and set DB status to CANCELED', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
        status: SubscriptionStatus.ACTIVE,
        paypalSubscriptionId: 'I-SUB123',
        planTier: planTier.PRO,
      });

      prisma.subscription.update.mockResolvedValue({
        status: SubscriptionStatus.CANCELED,
        planTier: planTier.PRO,
      });

      const result = await service.cancelSubscription('user-1', {
        reason: 'User canceled',
      });

      expect(payPalClient.cancelSubscription).toHaveBeenCalledWith('I-SUB123', 'User canceled');
      expect(result.status).toBe(SubscriptionStatus.CANCELED);
    });
  });
});
