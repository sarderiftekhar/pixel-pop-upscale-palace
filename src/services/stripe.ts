import { loadStripe, Stripe } from '@stripe/stripe-js';

export interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  popular: boolean;
  priceId: string; // Stripe Price ID
  description?: string;
}

export interface CheckoutSessionData {
  sessionId: string;
  url: string;
}

export const creditPackages: CreditPackage[] = [
  {
    id: 'starter',
    credits: 50,
    price: 4.99,
    popular: false,
    priceId: 'price_1Ra2YPPFQ0gfVHNFNVQB2skQ',
    description: 'Perfect for trying out the service'
  },
  {
    id: 'popular',
    credits: 100,
    price: 8.99,
    popular: true,
    priceId: 'price_1Ra2YPPFQ0gfVHNFhZKYRb1Z',
    description: 'Most popular choice'
  },
  {
    id: 'pro',
    credits: 250,
    price: 19.99,
    popular: false,
    priceId: 'price_1Ra2YQPFQ0gfVHNF2hbeLkCp',
    description: 'For power users'
  },
  {
    id: 'enterprise',
    credits: 500,
    price: 34.99,
    popular: false,
    priceId: 'price_1Ra2YQPFQ0gfVHNFg9aQgUsp',
    description: 'Maximum value pack'
  }
];

class StripeService {
  private stripe: Promise<Stripe | null>;

  constructor() {
    this.stripe = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
  }

  async createCheckoutSession(
    packageId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSessionData> {
    try {
      const pkg = creditPackages.find(p => p.id === packageId);
      if (!pkg) {
        throw new Error('Invalid package selected');
      }

      // In a real app, this would be a call to your backend API
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: pkg.priceId,
          userId,
          successUrl,
          cancelUrl,
          metadata: {
            credits: pkg.credits.toString(),
            packageId: pkg.id,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session. Please try again.');
    }
  }

  async redirectToCheckout(sessionId: string): Promise<void> {
    try {
      const stripe = await this.stripe;
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      throw new Error('Failed to redirect to checkout. Please try again.');
    }
  }

  async handleCheckout(
    packageId: string,
    userId: string
  ): Promise<void> {
    try {
      const successUrl = `${window.location.origin}/payment-success`;
      const cancelUrl = `${window.location.origin}/payment-cancelled`;

      const { sessionId } = await this.createCheckoutSession(
        packageId,
        userId,
        successUrl,
        cancelUrl
      );

      await this.redirectToCheckout(sessionId);
    } catch (error) {
      console.error('Error handling checkout:', error);
      throw error;
    }
  }

  // Method to handle subscription checkout (for future subscription plans)
  async createSubscriptionCheckout(
    priceId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSessionData> {
    try {
      const response = await fetch('/api/stripe/create-subscription-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId,
          successUrl,
          cancelUrl,
          mode: 'subscription',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating subscription session:', error);
      throw new Error('Failed to create subscription session. Please try again.');
    }
  }

  // Method to retrieve checkout session details
  async getCheckoutSession(sessionId: string) {
    try {
      const response = await fetch(`/api/stripe/checkout-session/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error retrieving checkout session:', error);
      throw new Error('Failed to retrieve checkout session.');
    }
  }

  // Method to handle payment success and update user credits
  async handlePaymentSuccess(sessionId: string): Promise<void> {
    try {
      const response = await fetch('/api/stripe/payment-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw new Error('Failed to process payment success.');
    }
  }

  // Utility method to format price
  static formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }

  // Utility method to calculate price per credit
  static getPricePerCredit(credits: number, price: number): string {
    const pricePerCredit = price / credits;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(pricePerCredit);
  }
}

// Create a singleton instance
export const stripeService = new StripeService();

// Export the class for static methods
export { StripeService };

// Export types for use in components
export type { CheckoutSessionData };