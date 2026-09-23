import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PayPalCreateSubscriptionResponseDto,
  PayPalSubscriptionDetailsDto,
} from './dto/paypal-response.dto';

export {
  PayPalCreateSubscriptionResponseDto,
  PayPalSubscriptionDetailsDto,
  // Backwards compatibility aliases
  PayPalCreateSubscriptionResponseDto as PayPalCreateSubscriptionResponse,
  PayPalSubscriptionDetailsDto as PayPalSubscriptionDetails,
};

@Injectable()
export class PayPalClient {
  private readonly logger = new Logger(PayPalClient.name);
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private readonly configService: ConfigService) {}

  private getBaseUrl(): string {
    const mode = this.configService.get<string>('PAYPAL_MODE', 'sandbox').toLowerCase();
    return mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  private getCredentials(): { clientId: string; clientSecret: string } {
    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      this.logger.error('PayPal credentials missing in environment configuration');
      throw new InternalServerErrorException('PayPal credentials are not properly configured on the server');
    }

    return { clientId, clientSecret };
  }

  /**
   * Thread-safe access token retrieval with proactive TTL cache refresh (5 min buffer).
   */
  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.tokenExpiresAt > now + 300_000) {
      return this.cachedToken;
    }

    const { clientId, clientSecret } = this.getCredentials();
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const url = `${this.getBaseUrl()}/v1/oauth2/token`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`PayPal OAuth token generation failed: ${response.status} - ${errorText}`);
        throw new InternalServerErrorException('Failed to authenticate with PayPal Gateway');
      }

      const data = (await response.json()) as { access_token: string; expires_in: number };
      this.cachedToken = data.access_token;
      this.tokenExpiresAt = now + data.expires_in * 1000;

      return this.cachedToken;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error(`Network error connecting to PayPal OAuth: ${error}`);
      throw new InternalServerErrorException('Unable to establish connection with PayPal Gateway');
    }
  }

  /**
   * Initializes a subscription agreement on PayPal Subscriptions REST API v1.
   */
  async createSubscription(
    planId: string,
    customId: string,
    returnUrl: string,
    cancelUrl: string,
  ): Promise<PayPalCreateSubscriptionResponseDto> {
    const token = await this.getAccessToken();
    const url = `${this.getBaseUrl()}/v1/billing/subscriptions`;

    const payload = {
      plan_id: planId,
      custom_id: customId,
      application_context: {
        brand_name: 'DocFlow',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      this.logger.error(`PayPal createSubscription failed [${response.status}]: ${JSON.stringify(responseData)}`);
      throw new BadRequestException(
        responseData?.message || 'Failed to initialize subscription checkout with PayPal',
      );
    }

    const approveLink = (responseData.links as Array<{ rel: string; href: string }>).find(
      (link) => link.rel === 'approve',
    );

    if (!approveLink?.href) {
      this.logger.error(`No approval URL returned by PayPal for subscription: ${responseData.id}`);
      throw new InternalServerErrorException('PayPal approval link missing from checkout creation');
    }

    return {
      id: responseData.id,
      status: responseData.status,
      approveUrl: approveLink.href,
    };
  }

  /**
   * Retrieves full subscription resource from PayPal.
   */
  async getSubscription(subscriptionId: string): Promise<PayPalSubscriptionDetailsDto> {
    const token = await this.getAccessToken();
    const url = `${this.getBaseUrl()}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      this.logger.error(`PayPal getSubscription failed [${response.status}]: ${JSON.stringify(responseData)}`);
      throw new BadRequestException(
        responseData?.message || `Subscription ${subscriptionId} could not be verified with PayPal`,
      );
    }

    return responseData as PayPalSubscriptionDetailsDto;
  }

  /**
   * Cancels an active or pending subscription on PayPal.
   */
  async cancelSubscription(subscriptionId: string, reason: string = 'User requested cancellation'): Promise<void> {
    const token = await this.getAccessToken();
    const url = `${this.getBaseUrl()}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok && response.status !== 204) {
      const responseData = await response.json().catch(() => null);
      this.logger.error(`PayPal cancelSubscription failed [${response.status}]: ${JSON.stringify(responseData)}`);
      throw new BadRequestException(responseData?.message || 'Failed to cancel subscription on PayPal');
    }
  }

  /**
   * Cryptographically verifies incoming PayPal webhook signature.
   */
  async verifyWebhookSignature(
    headers: Record<string, string | string[] | undefined>,
    rawBody: any,
    webhookId: string,
  ): Promise<boolean> {
    const token = await this.getAccessToken();
    const url = `${this.getBaseUrl()}/v1/notifications/verify-webhook-signature`;

    const authAlgo = headers['paypal-auth-algo'];
    const certUrl = headers['paypal-cert-url'];
    const transmissionId = headers['paypal-transmission-id'];
    const transmissionSig = headers['paypal-transmission-sig'];
    const transmissionTime = headers['paypal-transmission-time'];

    if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
      this.logger.warn('Webhook request missing required PayPal security verification headers');
      return false;
    }

    const payload = {
      auth_algo: Array.isArray(authAlgo) ? authAlgo[0] : authAlgo,
      cert_url: Array.isArray(certUrl) ? certUrl[0] : certUrl,
      transmission_id: Array.isArray(transmissionId) ? transmissionId[0] : transmissionId,
      transmission_sig: Array.isArray(transmissionSig) ? transmissionSig[0] : transmissionSig,
      transmission_time: Array.isArray(transmissionTime) ? transmissionTime[0] : transmissionTime,
      webhook_id: webhookId,
      webhook_event: rawBody,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        this.logger.warn(`PayPal webhook verification endpoint responded with status ${response.status}`);
        return false;
      }

      const result = (await response.json()) as { verification_status: string };
      return result.verification_status === 'SUCCESS';
    } catch (error) {
      this.logger.error(`Error during webhook signature verification: ${error}`);
      return false;
    }
  }
}
