// Type definitions for Razorpay Checkout
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare class Razorpay {
  constructor(options: RazorpayOptions);
  open(): void;
  close(): void;
  on(event: string, handler: () => void): void;
}

interface Window {
  Razorpay: typeof Razorpay;
}
