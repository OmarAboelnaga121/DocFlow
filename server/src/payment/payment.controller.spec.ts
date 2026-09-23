import { Test, TestingModule } from '@nestjs/testing';
import { planTier } from '@prisma/client';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

describe('PaymentController', () => {
  let controller: PaymentController;
  let paymentService: any;

  beforeEach(async () => {
    paymentService = {
      createSubscription: jest.fn().mockResolvedValue({
        subscriptionId: 'I-123',
        status: 'APPROVAL_PENDING',
        approvalUrl: 'https://paypal.com/approve/123',
      }),
      activateSubscription: jest.fn().mockResolvedValue({
        status: 'ACTIVE',
        tier: planTier.PRO,
        creditBalance: 1050,
      }),
      getCurrentSubscription: jest.fn().mockResolvedValue({
        subscription: { planTier: planTier.PRO },
        creditBalance: 1050,
      }),
      cancelSubscription: jest.fn().mockResolvedValue({
        status: 'CANCELED',
      }),
      handleWebhook: jest.fn().mockResolvedValue({
        received: true,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: paymentService,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate createSubscription to PaymentService', async () => {
    const result = await controller.createSubscription('user-1', {
      planTier: planTier.PRO,
    });
    expect(paymentService.createSubscription).toHaveBeenCalledWith('user-1', {
      planTier: planTier.PRO,
    });
    expect(result.subscriptionId).toBe('I-123');
  });

  it('should delegate activateSubscription to PaymentService', async () => {
    const result = await controller.activateSubscription('user-1', {
      subscriptionId: 'I-123',
    });
    expect(paymentService.activateSubscription).toHaveBeenCalledWith('user-1', {
      subscriptionId: 'I-123',
    });
    expect(result.tier).toBe(planTier.PRO);
  });

  it('should delegate cancelSubscription to PaymentService', async () => {
    const result = await controller.cancelSubscription('user-1', {
      reason: 'Cost',
    });
    expect(paymentService.cancelSubscription).toHaveBeenCalledWith('user-1', {
      reason: 'Cost',
    });
    expect(result.status).toBe('CANCELED');
  });
});
