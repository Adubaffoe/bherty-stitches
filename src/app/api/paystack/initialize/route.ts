import { NextRequest, NextResponse } from 'next/server';
import { createPaystackReference, PaystackInitializeResponse, toPaystackAmount } from '@/lib/paystack';

interface InitializePayload {
  email: string;
  amount: number;
  orderId: string;
  orderNumber: string;
  customerName: string;
  origin?: string;
}

export async function POST(request: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json({ message: 'Missing PAYSTACK_SECRET_KEY' }, { status: 500 });
  }

  const body = (await request.json()) as InitializePayload;

  if (!body.email || !body.amount || !body.orderId || !body.orderNumber || !body.customerName) {
    return NextResponse.json({ message: 'Missing required payment fields' }, { status: 400 });
  }

  const callbackBase =
    body.origin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    request.nextUrl.origin;

  const reference = createPaystackReference(body.orderNumber);

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: body.email,
      amount: toPaystackAmount(body.amount),
      currency: 'GHS',
      reference,
      callback_url: `${callbackBase}/checkout/paystack/callback`,
      metadata: {
        orderId: body.orderId,
        orderNumber: body.orderNumber,
        customerName: body.customerName,
      },
    }),
  });

  const data = (await response.json()) as PaystackInitializeResponse;

  if (!response.ok || !data.status || !data.data) {
    return NextResponse.json(
      { message: data.message || 'Failed to initialize Paystack transaction' },
      { status: 502 },
    );
  }

  return NextResponse.json(data);
}
