'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import Nav from '@/components/Nav';
import CartDrawer from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import { db } from '@/lib/firebase';
import { formatCedi } from '@/lib/formatCedi';
import { PublicOrderStatus, PublicTrackingRecord } from '@/lib/orderTracking';

const STATUS_STEPS: PublicOrderStatus[] = ['new', 'paid', 'in progress', 'ready', 'delivered'];

const STATUS_COPY: Record<PublicOrderStatus, { title: string; text: string }> = {
  new: { title: 'Order received', text: 'We have your order and will review payment and details shortly.' },
  paid: { title: 'Payment confirmed', text: 'Your payment has been confirmed and your order is queued for production.' },
  'in progress': { title: 'In production', text: 'Your crochet piece is currently being made.' },
  ready: { title: 'Ready', text: 'Your order is ready for pickup or final delivery arrangement.' },
  delivered: { title: 'Delivered', text: 'Your order has been completed and handed over successfully.' },
  cancelled: { title: 'Cancelled', text: 'This order was cancelled. Contact Bherty Stitches if you need help.' },
};

function normalizeOrderNumber(value: string) {
  return value.trim().toUpperCase();
}

export default function TrackOrderPage() {
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderInput, setOrderInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicTrackingRecord | null>(null);
  const [error, setError] = useState('');

  const activeStepIndex = useMemo(() => {
    if (!result || result.status === 'cancelled') return -1;
    return STATUS_STEPS.indexOf(result.status);
  }, [result]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderFromUrl = params.get('order');
    if (orderFromUrl) {
      setOrderInput(normalizeOrderNumber(orderFromUrl));
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const normalized = normalizeOrderNumber(orderInput);
    if (!normalized) {
      setError('Please enter your order number.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const snap = await getDoc(doc(db, 'orderTracking', normalized));
      if (!snap.exists()) {
        setResult(null);
        setError('We could not find that order number. Please check and try again.');
      } else {
        setResult(snap.data() as PublicTrackingRecord);
      }
    } catch {
      setResult(null);
      setError('Something went wrong while loading your tracking details.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Nav onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => setCheckoutOpen(true)} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />

      <main className="min-h-screen bg-ww pt-24 pb-20 px-6 md:px-12 lg:px-20">
        <section className="max-w-5xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-start">
          <div className="bg-cream rounded-[2rem] p-8 border border-terra/10">
            <div className="flex items-center gap-3 mb-5">
              <span className="block w-8 h-px bg-terra/60" />
              <span className="text-terra text-[10px] font-semibold uppercase tracking-[0.28em]">Track Your Order</span>
            </div>
            <h1 className="font-playfair text-4xl md:text-5xl text-dark leading-tight mb-4">
              Follow your <em className="text-terra not-italic">Bherty</em> order
            </h1>
            <p className="font-cormorant text-xl italic text-muted leading-relaxed mb-8">
              Enter your order number to see the latest production or delivery status.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted mb-1.5">
                  Order Number
                </label>
                <input
                  value={orderInput}
                  onChange={(e) => setOrderInput(e.target.value)}
                  placeholder="BHS-20260411-ABC123"
                  className="w-full border border-muted/25 rounded-xl px-4 py-3 text-sm text-dark bg-white focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/10"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2.5 bg-terra text-white text-[11px] font-semibold uppercase tracking-[0.18em] px-7 py-3.5 rounded-full hover:bg-brown transition-all duration-200 disabled:opacity-60"
              >
                {loading ? 'Checking...' : 'Track Order'}
              </button>
            </form>

            {error && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2rem] border border-terra/10 overflow-hidden min-h-[24rem]">
            {!result ? (
              <div className="h-full px-8 py-12 flex flex-col justify-center text-center">
                <div className="text-5xl mb-4">🧶</div>
                <h2 className="font-playfair text-3xl text-dark mb-3">Tracking details will appear here</h2>
                <p className="text-sm text-muted leading-relaxed max-w-md mx-auto">
                  Use the order number you received after checkout or in your WhatsApp confirmation.
                </p>
              </div>
            ) : (
              <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted mb-2">Order Number</p>
                    <h2 className="font-playfair text-3xl text-dark mb-2">{result.orderNumber}</h2>
                    <p className="text-sm text-muted">Placed for {result.customerName}</p>
                  </div>
                  <div className="bg-terra/6 border border-terra/10 rounded-2xl px-5 py-4 min-w-[13rem]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted mb-2">Current Status</p>
                    <p className="font-playfair text-2xl text-terra capitalize">{result.status}</p>
                    <p className="text-xs text-muted mt-2 leading-relaxed">{STATUS_COPY[result.status].text}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="rounded-2xl bg-cream px-5 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted mb-2">Order Summary</p>
                    <p className="text-sm text-dark">{result.items.reduce((sum, item) => sum + item.qty, 0)} item(s)</p>
                    <p className="text-sm text-dark mt-1">{result.deliveryMode === 'pickup' ? 'Studio pickup' : 'Home delivery'}</p>
                    <p className="font-playfair text-2xl text-terra mt-3">{formatCedi(result.total)}</p>
                  </div>
                  <div className="rounded-2xl bg-cream px-5 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted mb-2">What This Means</p>
                    <p className="text-sm text-dark leading-relaxed">{STATUS_COPY[result.status].title}</p>
                    <p className="text-sm text-muted leading-relaxed mt-2">
                      We update this page whenever your order moves to the next stage.
                    </p>
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted mb-4">Progress</p>
                  <div className="grid md:grid-cols-5 gap-3">
                    {STATUS_STEPS.map((step, index) => {
                      const active = activeStepIndex >= index;
                      return (
                        <div
                          key={step}
                          className={`rounded-2xl border px-4 py-4 ${active ? 'border-terra bg-terra/5' : 'border-muted/15 bg-white'}`}
                        >
                          <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${active ? 'text-terra' : 'text-muted/60'}`}>
                            Step {index + 1}
                          </p>
                          <p className="text-sm text-dark mt-2 capitalize">{step}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted mb-4">Items</p>
                  <div className="space-y-3">
                    {result.items.map((item, index) => (
                      <div key={`${item.name}-${index}`} className="flex items-center justify-between rounded-2xl bg-[#faf7f2] px-4 py-3">
                        <p className="text-sm text-dark">{item.name}</p>
                        <p className="text-sm font-semibold text-terra">x{item.qty}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
