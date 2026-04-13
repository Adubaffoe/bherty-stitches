import { NextResponse } from 'next/server';
import { PaystackVerifyResponse } from '@/lib/paystack';

export async function GET(
  _request: Request,
  { params }: { params: { reference: string } },
) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json({ message: 'Missing PAYSTACK_SECRET_KEY' }, { status: 500 });
  }

  const reference = params.reference;

  if (!reference) {
    return NextResponse.json({ message: 'Missing transaction reference' }, { status: 400 });
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
    cache: 'no-store',
  });

  const data = (await response.json()) as PaystackVerifyResponse;

  if (!response.ok) {
    return NextResponse.json(
      { message: data.message || 'Failed to verify Paystack transaction' },
      { status: 502 },
    );
  }

  return NextResponse.json(data);
}
