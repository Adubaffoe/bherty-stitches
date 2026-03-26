'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { formatCedi } from '@/lib/formatCedi';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

type DeliveryMode = 'delivery' | 'pickup' | null;
type Step = 1 | 2 | 3;

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

const REGIONS = [
  'Greater Accra','Ashanti','Central','Western','Eastern','Volta',
  'Northern','Upper East','Upper West','Brong-Ahafo','Oti','Savannah',
  'North East','Western North','Ahafo','Bono East',
];

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ open, onClose }: CheckoutModalProps) {
  const { state, dispatch, totalPrice } = useCart();
  const [step, setStep] = useState<Step>(1);
  const [delMode, setDelMode] = useState<DeliveryMode>(null);
  const [success, setSuccess] = useState(false);
  const [waLink, setWaLink] = useState('');

  const [contact, setContact] = useState<ContactInfo>({
    firstName: '', lastName: '', phone: '', email: '', measurements: '', notes: '',
  });
  const [delivery, setDelivery] = useState<DeliveryInfo>({
    address: '', town: '', region: '', landmark: '', deliveryDate: '', pickupDate: '', pickupTime: '',
  });

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function reset() {
    setStep(1); setDelMode(null); setSuccess(false); setWaLink('');
    setContact({ firstName: '', lastName: '', phone: '', email: '', measurements: '', notes: '' });
    setDelivery({ address: '', town: '', region: '', landmark: '', deliveryDate: '', pickupDate: '', pickupTime: '' });
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

  async function placeOrder() {
    const items = state.items.map((i) =>
      `• ${i.product.emoji} ${i.product.name} × ${i.qty} = ${formatCedi(i.product.price * i.qty)}`
    ).join('\n');

    let delText = '';
    if (delMode === 'delivery') {
      delText = `🚚 *HOME DELIVERY*\nAddress: ${delivery.address}, ${delivery.town}, ${delivery.region}${delivery.landmark ? '\nNearby landmark: ' + delivery.landmark : ''}${delivery.deliveryDate ? '\nPreferred date: ' + delivery.deliveryDate : ''}`;
    } else {
      delText = `🏠 *STUDIO PICKUP — Kasoa (Free)*${delivery.pickupDate ? '\nPreferred date: ' + delivery.pickupDate : ''}${delivery.pickupTime ? '\nPreferred time: ' + delivery.pickupTime : ''}`;
    }

    const msg = `Hi Bherty Stitches! 🧶\n\n*New Order from ${contact.firstName} ${contact.lastName}*\n📱 ${contact.phone}${contact.email ? '\n📧 ' + contact.email : ''}\n\n*Items Ordered:*\n${items}\n\n*Items Total: ${formatCedi(totalPrice)}*\n\n${delText}${contact.measurements ? '\n\n📏 Measurements: ' + contact.measurements : ''}${contact.notes ? '\n\n📝 Notes: ' + contact.notes : ''}\n\nPlease confirm my order. Thank you! 😊`;

    // Save to Firestore
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
    if (step === 3) { placeOrder(); return; }
    setStep((s) => (s + 1) as Step);
  }

  function goBack() {
    if (step > 1) setStep((s) => (s - 1) as Step);
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-dark/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-x-4 top-[50%] -translate-y-1/2 z-50 max-w-xl mx-auto bg-ww shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-terra/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair text-2xl text-dark">Checkout</h2>
            <button onClick={handleClose} className="text-muted hover:text-terra text-xl font-bold">✕</button>
          </div>
          {/* Step bar */}
          {!success && (
            <div className="flex items-center gap-2">
              {([1, 2, 3] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                      step === s ? 'bg-terra border-terra text-white' :
                      step > s ? 'bg-brown border-brown text-white' :
                      'bg-transparent border-muted text-muted'
                    }`}>{s}</div>
                    <span className="text-[10px] text-muted mt-0.5 uppercase tracking-wide">
                      {['Your Info', 'Delivery', 'Review'][i]}
                    </span>
                  </div>
                  {i < 2 && <div className={`flex-1 h-[2px] transition-colors ${step > s ? 'bg-brown' : 'bg-cream'}`} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {success ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="font-playfair text-2xl text-dark mb-2">Order Placed!</h3>
              <p className="text-muted font-cormorant text-base mb-6">
                Click below to send your order details to us on WhatsApp. We'll confirm and share payment info shortly.
              </p>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#25D366] text-white px-8 py-3 font-semibold text-sm uppercase tracking-wider hover:brightness-90 transition-all"
              >
                💬 Send via WhatsApp
              </a>
              <p className="text-muted text-xs mt-4">We'll confirm your order within a few hours.</p>
            </div>
          ) : step === 1 ? (
            <div className="flex flex-col gap-4">
              <p className="text-xs uppercase tracking-widest text-terra font-semibold">Your Contact Details</p>
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
            <div className="flex flex-col gap-4">
              <p className="text-xs uppercase tracking-widest text-terra font-semibold">How Would You Like to Receive Your Order?</p>
              <div className="grid grid-cols-2 gap-3">
                <DeliveryCard icon="🚚" title="Home Delivery" sub="We bring it to your door. Fee confirmed via WhatsApp." selected={delMode === 'delivery'} onClick={() => setDelMode('delivery')} />
                <DeliveryCard icon="🏠" title="Studio Pickup" sub="Collect from our studio in Kasoa. Completely free." selected={delMode === 'pickup'} onClick={() => setDelMode('pickup')} />
              </div>
              {delMode === 'delivery' && (
                <div className="flex flex-col gap-3 mt-1">
                  <Field label="Street / House Address *" value={delivery.address} onChange={(v) => setDelivery({ ...delivery, address: v })} placeholder="House No. 12, Sunrise Road" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Town / Area *" value={delivery.town} onChange={(v) => setDelivery({ ...delivery, town: v })} placeholder="Kasoa" />
                    <div>
                      <label className="block text-xs text-muted uppercase tracking-wider mb-1">Region *</label>
                      <select className="w-full border border-muted/30 px-3 py-2 text-sm text-dark bg-white focus:outline-none focus:border-terra" value={delivery.region} onChange={(e) => setDelivery({ ...delivery, region: e.target.value })}>
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
                  <div className="bg-cream p-4 text-sm text-dark">
                    <strong>📍 Studio Location</strong>
                    <p className="mt-1 text-muted font-cormorant text-base">Bherty Stitches Studio, Kasoa, Central Region.<br />We'll send exact directions via WhatsApp once confirmed.</p>
                  </div>
                  <Field label="Preferred Pickup Date (optional)" type="date" value={delivery.pickupDate} onChange={(v) => setDelivery({ ...delivery, pickupDate: v })} />
                  <div>
                    <label className="block text-xs text-muted uppercase tracking-wider mb-1">Preferred Pickup Time (optional)</label>
                    <select className="w-full border border-muted/30 px-3 py-2 text-sm text-dark bg-white focus:outline-none focus:border-terra" value={delivery.pickupTime} onChange={(e) => setDelivery({ ...delivery, pickupTime: e.target.value })}>
                      <option value="">Any time during business hours</option>
                      <option>Morning (8am – 12pm)</option>
                      <option>Afternoon (12pm – 4pm)</option>
                      <option>Evening (4pm – 6pm)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Step 3: Review
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-widest text-terra font-semibold">Review & Confirm Your Order</p>
              <div className="bg-cream p-4 flex flex-col gap-2 text-sm">
                <p className="font-semibold text-muted uppercase tracking-wider text-xs">🛍 Items Ordered</p>
                {state.items.map(({ product, qty }) => (
                  <div key={product.id} className="flex justify-between">
                    <span>{product.emoji} {product.name} × {qty}</span>
                    <span className="font-semibold">{formatCedi(product.price * qty)}</span>
                  </div>
                ))}
                <div className="border-t border-muted/20 pt-2 mt-1 flex justify-between font-bold text-dark">
                  <span>Items Total</span>
                  <span className="text-terra">{formatCedi(totalPrice)}</span>
                </div>
                <div className="border-t border-muted/20 pt-2 mt-1">
                  <p className="font-semibold text-muted uppercase tracking-wider text-xs mb-1">
                    {delMode === 'delivery' ? '🚚 Home Delivery' : '🏠 Studio Pickup — Kasoa'}
                  </p>
                  {delMode === 'delivery' ? (
                    <>
                      <p>{delivery.address}, {delivery.town}, {delivery.region}</p>
                      {delivery.landmark && <p className="text-muted">Near: {delivery.landmark}</p>}
                      {delivery.deliveryDate && <p className="text-muted">Preferred: {delivery.deliveryDate}</p>}
                      <p className="text-muted mt-1">Delivery fee confirmed via WhatsApp</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sage font-semibold">Free</p>
                      {delivery.pickupDate && <p className="text-muted">Preferred: {delivery.pickupDate}{delivery.pickupTime ? ', ' + delivery.pickupTime : ''}</p>}
                    </>
                  )}
                </div>
                <div className="border-t border-muted/20 pt-2 mt-1">
                  <p className="font-semibold text-muted uppercase tracking-wider text-xs mb-1">👤 Your Details</p>
                  <p>{contact.firstName} {contact.lastName} · {contact.phone}</p>
                  {contact.email && <p className="text-muted">{contact.email}</p>}
                  {contact.measurements && <p className="text-muted">Measurements: {contact.measurements}</p>}
                  {contact.notes && <p className="text-muted">Notes: &ldquo;{contact.notes}&rdquo;</p>}
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed">By placing your order, your details will be sent to our WhatsApp. We'll confirm and share payment info. 🧶</p>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {!success && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-terra/10">
            <button
              onClick={goBack}
              className={`text-sm text-muted hover:text-terra transition-colors ${step === 1 ? 'invisible' : ''}`}
            >
              ← Back
            </button>
            <button
              onClick={goNext}
              className="bg-terra text-white px-6 py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-brown transition-colors"
            >
              {step === 3 ? '✦ Place My Order' : 'Continue →'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Small helper components ─────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-muted uppercase tracking-wider mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-muted/30 px-3 py-2 text-sm text-dark bg-white focus:outline-none focus:border-terra"
      />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-muted uppercase tracking-wider mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full border border-muted/30 px-3 py-2 text-sm text-dark bg-white focus:outline-none focus:border-terra resize-none"
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
      className={`text-left p-4 border-2 transition-all ${
        selected ? 'border-terra bg-terra/5' : 'border-muted/20 hover:border-terra/50'
      }`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="font-semibold text-sm text-dark">{title}</div>
      <div className="text-xs text-muted mt-1 leading-relaxed">{sub}</div>
    </button>
  );
}
