'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import Nav from '@/components/Nav';
import CartDrawer from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import { db } from '@/lib/firebase';
import { formatCedi } from '@/lib/formatCedi';
import { PaystackVerifyResponse } from '@/lib/paystack';

interface CallbackState {
  phase: 'loading' | 'success' | 'error';
  message: string;
  orderNumber?: string;
  total?: number;
  reference?: string;
}

export default function PaystackCallbackPage() {
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [state, setState] = useState<CallbackState>({
    phase: 'loading',
    message: 'We are confirming your payment with Paystack.',
  });

  useEffect(() => {
    async function confirmPayment() {
      const params = new URLSearchParams(window.location.search);
      const reference = params.get('reference');

      if (!reference) {
        setState({
          phase: 'error',
          message: 'No Paystack reference was found in the callback URL.',
        });
        return;
      }

      try {
        const verifyRes = await fetch(`/api/paystack/verify/${encodeURIComponent(reference)}`, {
          cache: 'no-store',
        });
        const verifyData = (await verifyRes.json()) as PaystackVerifyResponse & { message?: string };

        if (!verifyRes.ok || !verifyData.status || !verifyData.data) {
          setState({
            phase: 'error',
            message: verifyData.message || 'We could not verify this payment yet.',
          });
          return;
        }

        const transaction = verifyData.data;
        const orderId = transaction.metadata?.orderId;
        const orderNumber = transaction.metadata?.orderNumber;

        if (transaction.status !== 'success' || !orderId || !orderNumber) {
          setState({
            phase: 'error',
            message: 'This transaction has not been confirmed as successful.',
          });
          return;
        }

        const total = transaction.amount / 100;

        await updateDoc(doc(db, 'orders', orderId), {
          paymentStatus: 'paid',
          paymentMethod: 'Paystack',
          amountPaid: total,
          paystackReference: transaction.reference,
          paystackStatus: transaction.status,
          paystackTransactionId: transaction.id,
          paystackChannel: transaction.channel || null,
          paystackCurrency: transaction.currency,
          paystackGatewayResponse: transaction.gateway_response || null,
          paidAt: transaction.paid_at || null,
          updatedAt: serverTimestamp(),
        });

        try {
          localStorage.removeItem('bherty_cart');
        } catch {
          // ignore storage issues
        }

        setState({
          phase: 'success',
          message: 'Your payment has been confirmed successfully.',
          orderNumber,
          total,
          reference: transaction.reference,
        });
      } catch {
        setState({
          phase: 'error',
          message: 'Something went wrong while confirming your payment.',
        });
      }
    }

    confirmPayment();
  }, []);

  return (
    <>
      <Nav onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => setCheckoutOpen(true)} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />

      <main className="min-h-screen bg-ww pt-24 pb-20 px-6 md:px-12 lg:px-20">
        <section className="max-w-3xl mx-auto">
          <div className="bg-white border border-terra/10 rounded-[2rem] p-8 md:p-12 text-center shadow-[0_18px_60px_rgba(42,26,20,0.08)]">
            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl bg-cream">
              {state.phase === 'success' ? '✓' : state.phase === 'error' ? '!' : '…'}
            </div>

            <h1 className="font-playfair text-4xl text-dark mb-3">
              {state.phase === 'success'
                ? 'Payment Confirmed'
                : state.phase === 'error'
                ? 'Payment Check Needed'
                : 'Confirming Payment'}
            </h1>

            <p className="font-cormorant text-xl italic text-muted leading-relaxed mb-8">
              {state.message}
            </p>

            {state.phase === 'success' && (
              <div className="bg-cream rounded-2xl border border-terra/10 px-6 py-5 max-w-lg mx-auto mb-8 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted mb-2">Order Number</p>
                <p className="font-playfair text-2xl text-terra">{state.orderNumber}</p>
                {state.total != null && (
                  <p className="text-sm text-dark mt-4">
                    Amount Paid: <strong>{formatCedi(state.total)}</strong>
                  </p>
                )}
                {state.reference && (
                  <p className="text-xs text-muted mt-2 break-all">Reference: {state.reference}</p>
                )}
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              {state.orderNumber && (
                <Link
                  href={`/track-order?order=${encodeURIComponent(state.orderNumber)}`}
                  className="inline-flex items-center gap-2.5 bg-terra text-white text-[11px] font-semibold uppercase tracking-[0.18em] px-7 py-3.5 rounded-full hover:bg-brown transition-all duration-200"
                >
                  Track My Order
                </Link>
              )}
              <Link
                href="/shop"
                className="inline-flex items-center gap-2.5 border border-brown/30 text-brown text-[11px] font-semibold uppercase tracking-[0.18em] px-7 py-3.5 rounded-full hover:bg-brown hover:text-white transition-all duration-200"
              >
                Back to Shop
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
