'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { formatCedi } from '@/lib/formatCedi';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { fetchSettings, StoreSettings, DEFAULT_SETTINGS } from '@/lib/settings';

type DeliveryMode = 'delivery' | 'pickup' | null;
type Step = 1 | 2 | 3 | 4;

interface ContactInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  measurements: string;
  notes: string;
}

interface DeliveryInfo {
  address: string;
  town: string;
  region: string;
  landmark: string;
  deliveryDate: string;
  pickupDate: string;
  pickupTime: string;
}

interface PaymentInfo {
  momoName: string;
  momoNumber: string;
  transactionId: string;
  amountPaid: string;
}

const REGIONS = [
  'Greater Accra','Ashanti','Central','Western','Eastern','Volta',
  'Northern','Upper East','Upper West','Brong-Ahafo','Oti','Savannah',
  'North East','Western North','Ahafo','Bono East',
];

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
}

/* ── Shared field components ─────────────────────────────── */
function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-muted/25 rounded-lg px-3.5 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/10 transition-all placeholder:text-muted/40"
      />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full border border-muted/25 rounded-lg px-3.5 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/10 transition-all resize-none placeholder:text-muted/40"
      />
    </div>
  );
}

function DeliveryCard({ icon, title, sub, selected, onClick }: {
  icon: string; title: string; sub: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
        selected
          ? 'border-terra bg-terra/5 shadow-sm'
          : 'border-muted/15 hover:border-terra/40 hover:bg-cream/40'
      }`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-semibold text-sm text-dark mb-1">{title}</div>
      <div className="text-xs text-muted leading-relaxed">{sub}</div>
      {selected && (
        <div className="mt-2 flex items-center gap-1.5 text-terra text-[10px] font-semibold uppercase tracking-wider">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Selected
        </div>
      )}
    </button>
  );
}

/* ── Main component ─────────────────────────────────────── */
export default function CheckoutModal({ open, onClose }: CheckoutModalProps) {
  const { state, dispatch, totalPrice } = useCart();
  const [step, setStep] = useState<Step>(1);
  const [delMode, setDelMode] = useState<DeliveryMode>(null);
  const [success, setSuccess] = useState(false);
  const [waLink, setWaLink] = useState('');
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  const [contact, setContact] = useState<ContactInfo>({
    firstName: '', lastName: '', phone: '', email: '', measurements: '', notes: '',
  });
  const [delivery, setDelivery] = useState<DeliveryInfo>({
    address: '', town: '', region: '', landmark: '', deliveryDate: '', pickupDate: '', pickupTime: '',
  });
  const [payment, setPayment] = useState<PaymentInfo>({
    momoName: '', momoNumber: '', transactionId: '', amountPaid: '',
  });

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (open) fetchSettings().then(setSettings);
  }, [open]);

  function reset() {
    setStep(1); setDelMode(null); setSuccess(false); setWaLink('');
    setContact({ firstName: '', lastName: '', phone: '', email: '', measurements: '', notes: '' });
    setDelivery({ address: '', town: '', region: '', landmark: '', deliveryDate: '', pickupDate: '', pickupTime: '' });
    setPayment({ momoName: '', momoNumber: '', transactionId: '', amountPaid: '' });
  }

  function handleClose() { reset(); onClose(); }

  function validateStep1() {
    if (!contact.firstName || !contact.lastName || !contact.phone) {
      alert('Please fill in your First Name, Last Name, and Phone Number to continue.');
      return false;
    }
    return true;
  }

  function validateStep2() {
    if (!delMode) {
      alert('Please choose Home Delivery or Studio Pickup to continue.');
      return false;
    }
    if (delMode === 'delivery' && (!delivery.address || !delivery.town || !delivery.region)) {
      alert('Please complete your delivery address — street, town, and region are required.');
      return false;
    }
    return true;
  }

  function validateStep3() {
    if (!payment.momoName || !payment.momoNumber || !payment.transactionId) {
      alert('Please enter your MoMo name, number, and transaction ID to continue.');
      return false;
    }
    return true;
  }

  async function placeOrder() {
    const items = state.items.map((i) =>
      `• ${i.product.emoji} ${i.product.name} × ${i.qty} = ${formatCedi(i.product.price * i.qty)}`
    ).join('\n');

    let delText = '';
    if (delMode === 'delivery') {
      delText = `🚚 *HOME DELIVERY${totalPrice >= 1000 ? ' (FREE)' : ''}*\nAddress: ${delivery.address}, ${delivery.town}, ${delivery.region}${delivery.landmark ? '\nNearby landmark: ' + delivery.landmark : ''}${delivery.deliveryDate ? '\nPreferred date: ' + delivery.deliveryDate : ''}`;
    } else {
      delText = `🏠 *STUDIO PICKUP — ${settings.storeLocation} (Free)*${delivery.pickupDate ? '\nPreferred date: ' + delivery.pickupDate : ''}${delivery.pickupTime ? '\nPreferred time: ' + delivery.pickupTime : ''}`;
    }

    const payText = `\n\n💳 *PAYMENT*\nMoMo Name: ${payment.momoName}\nMoMo Number: ${payment.momoNumber}\nTransaction ID: ${payment.transactionId}${payment.amountPaid ? '\nAmount Paid: GH₵ ' + payment.amountPaid : ''}`;

    const msg = `Hi Bherty Stitches! 🧶\n\n*New Order from ${contact.firstName} ${contact.lastName}*\n📱 ${contact.phone}${contact.email ? '\n📧 ' + contact.email : ''}\n\n*Items Ordered:*\n${items}\n\n*Items Total: ${formatCedi(totalPrice)}*\n\n${delText}${payText}${contact.measurements ? '\n\n📏 Measurements: ' + contact.measurements : ''}${contact.notes ? '\n\n📝 Notes: ' + contact.notes : ''}\n\nPlease confirm my order. Thank you! 😊`;

    try {
      await addDoc(collection(db, 'orders'), {
        customerName: `${contact.firstName} ${contact.lastName}`,
        phone: contact.phone,
        email: contact.email || null,
        measurements: contact.measurements || null,
        notes: contact.notes || null,
        items: state.items.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          price: i.product.price,
          qty: i.qty,
        })),
        total: totalPrice,
        deliveryMode: delMode,
        deliveryInfo: delMode === 'delivery' ? {
          address: delivery.address,
          town: delivery.town,
          region: delivery.region,
          landmark: delivery.landmark || null,
          preferredDate: delivery.deliveryDate || null,
        } : {
          preferredDate: delivery.pickupDate || null,
          preferredTime: delivery.pickupTime || null,
        },
        paymentMethod: 'Mobile Money',
        paymentAccountNameShown: settings.mobileMoneyName,
        paymentAccountNumberShown: settings.mobileMoneyNumber,
        customerMobileMoneyName: payment.momoName,
        customerMobileMoneyNumber: payment.momoNumber,
        transactionId: payment.transactionId,
        amountPaid: payment.amountPaid ? parseFloat(payment.amountPaid) : null,
        status: 'new',
        createdAt: serverTimestamp(),
      });
    } catch {
      // Still proceed to WhatsApp even if Firestore write fails
    }

    setWaLink(`https://wa.me/message/UYA6ZRENI4P7O1?text=${encodeURIComponent(msg)}`);
    setSuccess(true);
    dispatch({ type: 'CLEAR' });
  }

  function goNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    if (step === 4) { placeOrder(); return; }
    setStep((s) => (s + 1) as Step);
  }

  function goBack() {
    if (step > 1) setStep((s) => (s - 1) as Step);
  }

  if (!open) return null;

  const stepLabels = ['Info', 'Delivery', 'Payment', 'Review'];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-dark/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-[520px] mx-auto bg-ww rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-7 pt-6 pb-5 border-b border-terra/8 flex-shrink-0">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-playfair text-2xl text-dark">Checkout</h2>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center text-muted hover:text-terra rounded-full hover:bg-terra/5 transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Step indicator */}
          {!success && (
            <div className="flex items-center gap-1.5">
              {([1, 2, 3, 4] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all duration-200 ${
                      step === s
                        ? 'bg-terra border-terra text-white shadow-sm shadow-terra/30'
                        : step > s
                        ? 'bg-brown border-brown text-white'
                        : 'bg-transparent border-muted/25 text-muted/60'
                    }`}>
                      {step > s ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : s}
                    </div>
                    <span className={`text-[9px] uppercase tracking-wider whitespace-nowrap font-medium ${step >= s ? 'text-terra' : 'text-muted/50'}`}>
                      {stepLabels[i]}
                    </span>
                  </div>
                  {i < 3 && (
                    <div className={`flex-1 h-px mx-1.5 mb-3.5 transition-colors duration-200 ${step > s ? 'bg-brown' : 'bg-muted/15'}`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          {success ? (
            /* Success state */
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-sage/15 rounded-full flex items-center justify-center text-3xl mx-auto mb-5">
                🎉
              </div>
              <h3 className="font-playfair text-2xl text-dark mb-2">Order Received!</h3>
              <p className="text-muted text-sm leading-relaxed mb-8 max-w-xs mx-auto">
                Click below to send your order details to us on WhatsApp. We&apos;ll confirm and get started right away.
              </p>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-[#25D366] text-white px-8 py-3.5 rounded-full font-semibold text-sm hover:brightness-95 transition-all hover:shadow-lg hover:-translate-y-px"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Send Order via WhatsApp
              </a>
              <p className="text-muted/60 text-xs mt-4">
                We&apos;ll confirm your order within a few hours.
              </p>
            </div>

          ) : step === 1 ? (
            /* Step 1: Contact */
            <div className="flex flex-col gap-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-terra mb-1">Your Contact Details</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name *" value={contact.firstName} onChange={(v) => setContact({ ...contact, firstName: v })} placeholder="Ama" />
                <Field label="Last Name *" value={contact.lastName} onChange={(v) => setContact({ ...contact, lastName: v })} placeholder="Mensah" />
              </div>
              <Field label="Phone Number *" type="tel" value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} placeholder="+233 XX XXX XXXX" />
              <Field label="Email Address (optional)" type="email" value={contact.email} onChange={(v) => setContact({ ...contact, email: v })} placeholder="ama@email.com" />
              <Field label="Measurements — chest / waist / hips / height (optional)" value={contact.measurements} onChange={(v) => setContact({ ...contact, measurements: v })} placeholder="36 / 28 / 38 / 5'6" />
              <TextareaField label="Special Notes or Requests" value={contact.notes} onChange={(v) => setContact({ ...contact, notes: v })} placeholder="Any special requests, colour preferences, deadline…" />
            </div>

          ) : step === 2 ? (
            /* Step 2: Delivery */
            <div className="flex flex-col gap-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-terra mb-1">How Would You Like to Receive Your Order?</p>
              <div className="grid grid-cols-2 gap-3">
                <DeliveryCard
                  icon="🚚"
                  title="Home Delivery"
                  sub={totalPrice >= 1000 ? 'Free delivery on your order!' : 'We bring it to your door. Fee confirmed via WhatsApp.'}
                  selected={delMode === 'delivery'}
                  onClick={() => setDelMode('delivery')}
                />
                <DeliveryCard
                  icon="🏠"
                  title="Studio Pickup"
                  sub={`Collect from our studio in ${settings.storeLocation}. Completely free.`}
                  selected={delMode === 'pickup'}
                  onClick={() => setDelMode('pickup')}
                />
              </div>

              {delMode === 'delivery' && (
                <div className="flex flex-col gap-3 mt-1">
                  <Field label="Street / House Address *" value={delivery.address} onChange={(v) => setDelivery({ ...delivery, address: v })} placeholder="House No. 12, Sunrise Road" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Town / Area *" value={delivery.town} onChange={(v) => setDelivery({ ...delivery, town: v })} placeholder="Dansoman" />
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">Region *</label>
                      <select
                        className="w-full border border-muted/25 rounded-lg px-3.5 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/10 transition-all"
                        value={delivery.region}
                        onChange={(e) => setDelivery({ ...delivery, region: e.target.value })}
                      >
                        <option value="">Select region</option>
                        {REGIONS.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  <Field label="Nearest Landmark (optional)" value={delivery.landmark} onChange={(v) => setDelivery({ ...delivery, landmark: v })} placeholder="Near Accra Mall" />
                  <Field label="Preferred Delivery Date (optional)" type="date" value={delivery.deliveryDate} onChange={(v) => setDelivery({ ...delivery, deliveryDate: v })} />
                </div>
              )}

              {delMode === 'pickup' && (
                <div className="flex flex-col gap-3 mt-1">
                  <div className="bg-cream rounded-xl p-4 text-sm text-dark border border-terra/10">
                    <p className="font-semibold text-xs uppercase tracking-wider text-terra mb-1.5">📍 Studio Location</p>
                    <p className="text-dark text-sm font-medium">{settings.storeLocation}</p>
                    <p className="text-muted text-xs mt-1">We&apos;ll send exact directions via WhatsApp once confirmed.</p>
                  </div>
                  <Field label="Preferred Pickup Date (optional)" type="date" value={delivery.pickupDate} onChange={(v) => setDelivery({ ...delivery, pickupDate: v })} />
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">Preferred Pickup Time (optional)</label>
                    <select
                      className="w-full border border-muted/25 rounded-lg px-3.5 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/10 transition-all"
                      value={delivery.pickupTime}
                      onChange={(e) => setDelivery({ ...delivery, pickupTime: e.target.value })}
                    >
                      <option value="">Any time during business hours</option>
                      <option>Morning (8am – 12pm)</option>
                      <option>Afternoon (12pm – 4pm)</option>
                      <option>Evening (4pm – 6pm)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

          ) : step === 3 ? (
            /* Step 3: Payment */
            <div className="flex flex-col gap-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-terra mb-1">Mobile Money Payment</p>
              {settings.paymentInstructions && (
                <p className="text-sm text-muted leading-relaxed">{settings.paymentInstructions}</p>
              )}

              {/* Payment details card */}
              <div className="bg-terra text-white rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
                <div className="relative">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 mb-4">Send Payment To</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/60 uppercase tracking-wider">Network</span>
                      <span className="text-sm font-medium">{settings.provider}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/60 uppercase tracking-wider">Number</span>
                      <span className="text-2xl font-bold tracking-widest font-playfair">{settings.mobileMoneyNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/60 uppercase tracking-wider">Name</span>
                      <span className="text-sm font-semibold">{settings.mobileMoneyName}</span>
                    </div>
                    <div className="border-t border-white/15 pt-3 mt-1 flex justify-between items-center">
                      <span className="text-xs text-white/60 uppercase tracking-wider">Amount Due</span>
                      <span className="text-xl font-bold font-playfair">{formatCedi(totalPrice)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-terra mt-1">Confirm Your Payment *</p>
              <Field label="Your MoMo Name *" value={payment.momoName} onChange={(v) => setPayment({ ...payment, momoName: v })} placeholder="Name on your MoMo account" />
              <Field label="Your MoMo Number *" type="tel" value={payment.momoNumber} onChange={(v) => setPayment({ ...payment, momoNumber: v })} placeholder="0XX XXX XXXX" />
              <Field label="Transaction ID *" value={payment.transactionId} onChange={(v) => setPayment({ ...payment, transactionId: v })} placeholder="e.g. A12345678B" />
              <Field label="Amount Paid (optional)" type="number" value={payment.amountPaid} onChange={(v) => setPayment({ ...payment, amountPaid: v })} placeholder={`${totalPrice}`} />
            </div>

          ) : (
            /* Step 4: Review */
            <div className="flex flex-col gap-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-terra mb-1">Review Your Order</p>

              <div className="bg-cream rounded-xl overflow-hidden border border-muted/10">
                {/* Items */}
                <div className="p-4 space-y-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-3">Items Ordered</p>
                  {state.items.map(({ product, qty }) => (
                    <div key={product.id} className="flex justify-between items-center">
                      <span className="text-sm text-dark">{product.emoji} {product.name} × {qty}</span>
                      <span className="text-sm font-semibold text-dark">{formatCedi(product.price * qty)}</span>
                    </div>
                  ))}
                  <div className="border-t border-muted/15 pt-2.5 mt-1 flex justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total</span>
                    <span className="font-bold text-terra">{formatCedi(totalPrice)}</span>
                  </div>
                </div>

                {/* Delivery */}
                <div className="border-t border-muted/10 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">
                    {delMode === 'delivery' ? '🚚 Home Delivery' : `🏠 Studio Pickup`}
                  </p>
                  {delMode === 'delivery' ? (
                    <>
                      <p className="text-sm text-dark">{delivery.address}, {delivery.town}, {delivery.region}</p>
                      {delivery.landmark && <p className="text-xs text-muted mt-0.5">Near: {delivery.landmark}</p>}
                      {delivery.deliveryDate && <p className="text-xs text-muted mt-0.5">Date: {delivery.deliveryDate}</p>}
                      <p className={`text-xs mt-1 font-medium ${totalPrice >= 1000 ? 'text-sage' : 'text-muted'}`}>
                        {totalPrice >= 1000 ? '✓ Free delivery' : 'Delivery fee confirmed via WhatsApp'}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-dark">{settings.storeLocation}</p>
                      <p className="text-xs text-sage font-medium mt-0.5">✓ Free</p>
                      {delivery.pickupDate && <p className="text-xs text-muted mt-0.5">{delivery.pickupDate}{delivery.pickupTime ? ', ' + delivery.pickupTime : ''}</p>}
                    </>
                  )}
                </div>

                {/* Payment */}
                <div className="border-t border-muted/10 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">💳 Payment</p>
                  <p className="text-sm text-dark">{payment.momoName} · {payment.momoNumber}</p>
                  <p className="text-xs text-muted mt-0.5">Txn ID: {payment.transactionId}</p>
                </div>

                {/* Contact */}
                <div className="border-t border-muted/10 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">👤 Contact</p>
                  <p className="text-sm text-dark">{contact.firstName} {contact.lastName} · {contact.phone}</p>
                  {contact.email && <p className="text-xs text-muted mt-0.5">{contact.email}</p>}
                  {contact.measurements && <p className="text-xs text-muted mt-0.5">Measurements: {contact.measurements}</p>}
                  {contact.notes && <p className="text-xs text-muted mt-0.5 italic">&ldquo;{contact.notes}&rdquo;</p>}
                </div>
              </div>

              <p className="text-xs text-muted/70 leading-relaxed">
                By placing your order, your details will be sent to our WhatsApp for confirmation. 🧶
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-between px-7 py-4 border-t border-terra/8 bg-white/40 flex-shrink-0">
            <button
              onClick={goBack}
              className={`flex items-center gap-1.5 text-xs font-medium text-muted hover:text-terra transition-colors ${step === 1 ? 'invisible' : ''}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back
            </button>
            <button
              onClick={goNext}
              className="flex items-center gap-2 bg-terra text-white text-xs font-semibold uppercase tracking-[0.16em] px-6 py-2.5 rounded-full hover:bg-brown transition-all duration-200 hover:shadow-md hover:-translate-y-px"
            >
              {step === 4 ? 'Place My Order' : 'Continue'}
              {step < 4 && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
