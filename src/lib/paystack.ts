export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at?: string | null;
    channel?: string | null;
    gateway_response?: string | null;
    customer?: {
      email?: string | null;
    } | null;
    metadata?: {
      orderId?: string;
      orderNumber?: string;
      customerName?: string;
    } | null;
  };
}

export function toPaystackAmount(amount: number) {
  return Math.round(amount * 100);
}

export function createPaystackReference(orderNumber: string) {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${orderNumber}-${suffix}`;
}
