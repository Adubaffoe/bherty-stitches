'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { formatCedi } from '@/lib/formatCedi';
import { STATIC_PRODUCTS, Product } from '@/lib/products';
import Nav from '@/components/Nav';
import CartDrawer from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

/* ── Marquee content ─────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  'Handcrafted with Love',
  'Made to Order',
  'Dansoman, Accra',
  'Crochet Couture',
  'Wearable Art',
  'Bespoke Dresses',
  'Ghana Made',
];

/* ── Testimonials ────────────────────────────────────────────── */
const TESTIMONIALS = [
  { name: 'Abena K.', loc: 'Accra', text: 'I ordered a custom maxi dress for my birthday and it was absolutely stunning. Everyone kept asking where I got it. Bherty Stitches is everything!' },
  { name: 'Efua T.', loc: 'Kumasi', text: 'The quality is incredible — so much detail in every stitch. My dress arrived perfectly packaged and fit like a dream. Already planning my next order!' },
  { name: 'Adwoa M.', loc: 'Takoradi', text: 'Fast delivery, beautiful craftsmanship, and the seller was so communicative. This is true artistry. I\'ve recommended Bherty Stitches to all my friends!' },
];

const STYLES = ['Mini Dress', 'Midi Dress', 'Maxi Dress', 'Custom'];

/* ── Shared form field ───────────────────────────────────────── */
function FormField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-muted/25 rounded-lg px-4 py-3 text-sm text-dark bg-white focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/8 transition-all placeholder:text-muted/40"
      />
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function HomePage() {
  const { dispatch } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);

  const [orderForm, setOrderForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    style: '', colour: '', measurements: '', description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  function handleAddToCart(product: Product) {
    dispatch({ type: 'ADD', product });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1800);
  }

  async function handleCustomOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!orderForm.firstName || !orderForm.lastName || !orderForm.phone || !orderForm.style || !orderForm.colour) {
      toast.error('Please fill in all required fields (marked with *).');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'customRequests'), {
        name: `${orderForm.firstName} ${orderForm.lastName}`,
        email: orderForm.email || null,
        phone: orderForm.phone,
        description: `Style: ${orderForm.style} | Colour: ${orderForm.colour}${orderForm.measurements ? ' | Measurements: ' + orderForm.measurements : ''}${orderForm.description ? ' | Notes: ' + orderForm.description : ''}`,
        budget: orderForm.style === 'Mini Dress' ? 250 : orderForm.style === 'Midi Dress' ? 350 : orderForm.style === 'Maxi Dress' ? 450 : null,
        status: 'new',
        createdAt: serverTimestamp(),
      });
      toast.success('🎉 Your order has been received! We\'ll reach out within 24 hours.');
      setOrderForm({ firstName: '', lastName: '', phone: '', email: '', style: '', colour: '', measurements: '', description: '' });
    } catch {
      toast.error('Something went wrong. Please try again or contact us on WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Nav onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => setCheckoutOpen(true)} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <section
        id="home"
        className="min-h-screen grid md:grid-cols-2 pt-[72px] relative overflow-hidden"
      >
        {/* Background gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: [
              'radial-gradient(ellipse 70% 90% at 80% 40%, rgba(196,98,58,0.06) 0%, transparent 65%)',
              'radial-gradient(ellipse 50% 70% at 10% 80%, rgba(212,168,67,0.05) 0%, transparent 60%)',
              'radial-gradient(ellipse 40% 50% at 50% 0%, rgba(138,158,123,0.04) 0%, transparent 60%)',
            ].join(','),
          }}
        />

        {/* ── Left copy ── */}
        <div className="flex flex-col justify-center px-8 md:px-14 lg:px-20 py-16 z-10">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-7">
            <span className="block w-8 h-px bg-terra/60" />
            <span className="text-terra text-[10px] font-semibold uppercase tracking-[0.28em]">Handcrafted in Ghana</span>
          </div>

          {/* Heading */}
          <h1 className="font-playfair text-5xl md:text-6xl lg:text-[4.5rem] leading-[1.08] text-dark mb-6">
            Wearable<br />
            <em className="text-terra not-italic">Art</em>, Crafted<br />
            for <em className="text-terra not-italic">You</em>
          </h1>

          {/* Subhead */}
          <p className="font-cormorant text-[1.25rem] text-muted leading-relaxed max-w-[380px] mb-10 italic">
            Each piece is lovingly handcrafted to celebrate your unique beauty — bespoke crochet dresses made to order.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <a
              href="#shop"
              className="inline-flex items-center gap-2.5 bg-terra text-white text-[11px] font-semibold uppercase tracking-[0.18em] px-7 py-3.5 rounded-full hover:bg-brown transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              Shop Collection
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
            <a
              href="#order"
              className="inline-flex items-center gap-2.5 border border-brown/40 text-brown text-[11px] font-semibold uppercase tracking-[0.18em] px-7 py-3.5 rounded-full hover:bg-brown hover:text-white hover:border-brown transition-all duration-200"
            >
              Custom Order
            </a>
          </div>

          {/* Social proof strip */}
          <div className="flex items-center gap-6 mt-12 pt-10 border-t border-dark/8">
            {[['200+', 'Happy clients'], ['100%', 'Handcrafted'], ['5★', 'Rated']].map(([n, l]) => (
              <div key={l}>
                <p className="font-playfair text-xl text-terra font-semibold">{n}</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right visual card ── */}
        <div className="flex items-center justify-center px-8 md:px-12 py-16">
          <div className="relative w-full max-w-[340px]">

            {/* Decorative offset layer */}
            <div className="absolute -bottom-4 -right-4 w-full h-full bg-terra/8 rounded-3xl" />
            <div className="absolute -bottom-8 -right-8 w-full h-full bg-terra/4 rounded-3xl" />

            {/* Main card */}
            <div className="relative bg-cream rounded-3xl p-10 text-center shadow-xl border border-terra/10 z-10">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-terra/40 via-gold/60 to-sage/40 rounded-t-3xl" />

              {/* "New Collection" badge */}
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-[10px] font-bold uppercase tracking-[0.16em] px-4 py-1.5 rounded-full whitespace-nowrap">
                New Collection
              </span>

              <span className="block text-6xl mb-5 animate-float">🧶</span>

              <h3 className="font-playfair text-2xl text-brown mb-1">Crochet Couture</h3>
              <p className="font-cormorant text-base text-muted italic mb-7">Made to measure, made with love</p>

              <div className="flex gap-2 justify-center flex-wrap">
                {['Handcrafted', 'Made-to-Order', 'Ghana Made'].map((t) => (
                  <span
                    key={t}
                    className="bg-white text-terra/80 border border-terra/20 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          MARQUEE
      ══════════════════════════════════════════════════════════ */}
      <div className="border-y border-terra/12 bg-cream overflow-hidden">
        <div className="flex items-center whitespace-nowrap">
          <div className="inline-flex items-center animate-marquee">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-5 px-3 py-3.5">
                <span className="font-cormorant italic text-[0.9rem] text-brown/70 tracking-[0.12em]">{item}</span>
                <span className="text-terra/40 text-xs">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SHOP
      ══════════════════════════════════════════════════════════ */}
      <section id="shop" className="px-8 md:px-14 lg:px-20 py-24 bg-ww">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="block w-7 h-px bg-terra/60" />
              <span className="text-terra text-[10px] font-semibold uppercase tracking-[0.28em]">Ready to Ship</span>
            </div>
            <h2 className="font-playfair text-4xl md:text-5xl text-dark">
              Our <em className="text-terra not-italic italic">Collection</em>
            </h2>
          </div>
          <p className="font-cormorant text-lg text-muted max-w-xs leading-relaxed italic">
            Each piece ships within 3–5 business days, beautifully packaged.
          </p>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {STATIC_PRODUCTS.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl overflow-hidden border border-muted/8 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer"
            >
              {/* Image / emoji area */}
              <div className={`relative h-72 flex items-center justify-center overflow-hidden ${product.colorClass}`}>
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/8 transition-colors duration-300" />

                {/* Badge */}
                {product.badge && (
                  <span className="absolute top-4 left-4 z-10 bg-terra text-white text-[10px] font-bold uppercase tracking-[0.14em] px-3 py-1.5 rounded-full">
                    {product.badge}
                  </span>
                )}

                {/* Emoji */}
                <span className="text-[5.5rem] group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">
                  {product.emoji}
                </span>

                {/* Quick-add overlay on hover */}
                <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                  <button
                    onClick={() => handleAddToCart(product)}
                    className={`w-full py-3 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
                      addedId === product.id
                        ? 'bg-sage text-white'
                        : 'bg-dark/90 text-white hover:bg-terra'
                    }`}
                  >
                    {addedId === product.id ? '✓ Added to Bag' : '+ Add to Bag'}
                  </button>
                </div>
              </div>

              {/* Card body */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="text-gold text-xs tracking-wider mb-1.5">★★★★★</div>
                    <h3 className="font-playfair text-[1.05rem] text-dark leading-snug">{product.name}</h3>
                  </div>
                  <span className="font-playfair text-lg text-terra font-semibold whitespace-nowrap flex-shrink-0">
                    {formatCedi(product.price)}
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed mb-4">{product.description}</p>

                {/* Bottom row */}
                <div className="flex items-center justify-between pt-4 border-t border-muted/8">
                  <span className="text-[10px] text-muted uppercase tracking-wider">Handcrafted</span>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] px-4 py-2 rounded-full transition-all duration-200 ${
                      addedId === product.id
                        ? 'bg-sage/15 text-sage'
                        : 'bg-terra/8 text-terra hover:bg-terra hover:text-white'
                    }`}
                  >
                    {addedId === product.id ? (
                      <>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Added
                      </>
                    ) : 'Add to Bag'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          ABOUT
      ══════════════════════════════════════════════════════════ */}
      <section id="about" className="bg-cream px-8 md:px-14 lg:px-20 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">

          {/* Left: quote card */}
          <div className="relative">
            <div className="bg-white rounded-3xl p-10 shadow-lg border border-terra/8 relative z-10">
              {/* Big quote mark */}
              <div className="font-playfair text-[7rem] text-terra/15 leading-none absolute -top-4 left-6 select-none">&ldquo;</div>

              <p className="font-cormorant text-2xl text-brown italic leading-relaxed mb-8 mt-4 relative z-10">
                Every stitch is a labour of love — crafted with patience, passion, and a deep respect for the art of crochet.
              </p>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[['200+', 'Happy Clients'], ['3–10', 'Days per Piece'], ['100%', 'Handcrafted'], ['5★', 'Reviews']].map(([n, l]) => (
                  <div key={l} className="bg-cream rounded-xl p-4 text-center">
                    <span className="block font-playfair text-2xl text-terra font-semibold">{n}</span>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-muted mt-1 block">{l}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Offset decoration */}
            <div className="absolute bottom-[-12px] right-[-12px] w-full h-full bg-terra/6 rounded-3xl -z-0" />
          </div>

          {/* Right: story */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="block w-7 h-px bg-terra/60" />
              <span className="text-terra text-[10px] font-semibold uppercase tracking-[0.28em]">Our Story</span>
            </div>
            <h2 className="font-playfair text-4xl md:text-5xl text-dark mb-6">
              Crafted with <em className="text-terra not-italic italic">Heart</em>
            </h2>
            <p className="font-cormorant text-xl text-muted leading-relaxed mb-8 italic">
              Bherty Stitches was born from a passion for crochet and a vision to create wearable art that empowers women. Based in Dansoman, Accra, every piece is handcrafted with the finest yarns and deepest care.
            </p>
            <ul className="flex flex-col gap-4 mb-10">
              {[
                'Premium yarn sourced for durability and comfort',
                'Custom measurements for your perfect fit',
                'Every piece is unique — no two alike',
                'Packaged beautifully, delivered with care',
              ].map((f) => (
                <li key={f} className="flex items-start gap-3.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-terra/12 flex items-center justify-center mt-0.5">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-terra">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                  <span className="text-sm text-dark/80 leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
            <a
              href="#order"
              className="inline-flex items-center gap-2.5 bg-terra text-white text-[11px] font-semibold uppercase tracking-[0.18em] px-7 py-3.5 rounded-full hover:bg-brown transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              Start a Custom Order
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CUSTOM ORDER
      ══════════════════════════════════════════════════════════ */}
      <section id="order" className="px-8 md:px-14 lg:px-20 py-24 bg-ww">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <span className="block w-7 h-px bg-terra/60" />
            <span className="text-terra text-[10px] font-semibold uppercase tracking-[0.28em]">Custom Orders</span>
          </div>
          <h2 className="font-playfair text-4xl md:text-5xl text-dark mb-3">
            Order Your <em className="text-terra not-italic italic">Dream Dress</em>
          </h2>
          <p className="font-cormorant text-xl text-muted mb-14 italic">
            Tell us exactly what you want. We&apos;ll handcraft it just for you.
          </p>

          <div className="grid md:grid-cols-2 gap-14">

            {/* How it works */}
            <div>
              <h3 className="font-playfair text-2xl text-dark mb-8">How it works</h3>
              <div className="flex flex-col gap-6 mb-10">
                {[
                  ['1', 'Fill the Order Form', 'Share your measurements, colour preferences, and style ideas.'],
                  ['2', 'Receive Confirmation', "We'll reach out within 24 hours to confirm details and pricing."],
                  ['3', 'We Get to Work', 'Your dress is handcrafted with care over 3–10 days.'],
                  ['4', 'Delivered to You', 'Packaged beautifully — delivered or ready for pickup.'],
                ].map(([n, t, d]) => (
                  <div key={n} className="flex gap-4 group">
                    <div className="w-9 h-9 rounded-full bg-terra text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
                      {n}
                    </div>
                    <div className="pt-0.5">
                      <strong className="block text-dark text-sm font-semibold mb-1">{t}</strong>
                      <p className="text-muted text-sm leading-relaxed">{d}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Order form */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-muted/8">
              <h3 className="font-playfair text-2xl text-dark mb-1">Place Your Order</h3>
              <p className="font-cormorant text-base text-muted italic mb-7">Fill in the form and we&apos;ll be in touch shortly ✨</p>

              <form onSubmit={handleCustomOrder} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="First Name *" value={orderForm.firstName} onChange={(v) => setOrderForm({ ...orderForm, firstName: v })} placeholder="Ama" />
                  <FormField label="Last Name *" value={orderForm.lastName} onChange={(v) => setOrderForm({ ...orderForm, lastName: v })} placeholder="Mensah" />
                </div>
                <FormField label="Phone Number *" type="tel" value={orderForm.phone} onChange={(v) => setOrderForm({ ...orderForm, phone: v })} placeholder="+233 XX XXX XXXX" />
                <FormField label="Email Address" type="email" value={orderForm.email} onChange={(v) => setOrderForm({ ...orderForm, email: v })} placeholder="ama@email.com" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted mb-1.5">Dress Style *</label>
                    <select
                      value={orderForm.style}
                      onChange={(e) => setOrderForm({ ...orderForm, style: e.target.value })}
                      className="w-full border border-muted/25 rounded-lg px-4 py-3 text-sm text-dark bg-white focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/8 transition-all"
                    >
                      <option value="">Select style</option>
                      {STYLES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <FormField label="Colour Preference *" value={orderForm.colour} onChange={(v) => setOrderForm({ ...orderForm, colour: v })} placeholder="e.g. Coral, White" />
                </div>

                <FormField label="Measurements (chest/waist/hips/height)" value={orderForm.measurements} onChange={(v) => setOrderForm({ ...orderForm, measurements: v })} placeholder="e.g. 36/28/38/5'6" />

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted mb-1.5">Special Requests</label>
                  <textarea
                    value={orderForm.description}
                    onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })}
                    placeholder="Occasion, pattern, deadline..."
                    rows={3}
                    className="w-full border border-muted/25 rounded-lg px-4 py-3 text-sm text-dark bg-white focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/8 transition-all resize-none placeholder:text-muted/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-terra text-white py-4 text-[11px] font-semibold uppercase tracking-[0.2em] rounded-full hover:bg-brown transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-1"
                >
                  {submitting ? 'Submitting…' : '✦ Submit My Order'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════ */}
      <section id="testimonials" className="bg-dark px-8 md:px-14 lg:px-20 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <span className="block w-7 h-px bg-terra/60" />
            <span className="text-terra text-[10px] font-semibold uppercase tracking-[0.28em]">Client Love</span>
          </div>
          <h2 className="font-playfair text-4xl md:text-5xl text-cream mb-16">
            What Our <em className="text-terra not-italic italic">Clients Say</em>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className="bg-white/5 border border-white/8 rounded-2xl p-7 hover:bg-white/8 hover:border-white/14 transition-all duration-300 relative group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Stars */}
                <div className="text-gold text-xs tracking-wider mb-5">★★★★★</div>

                {/* Big opening quote */}
                <div className="font-playfair text-[4rem] text-terra/25 leading-none absolute top-5 right-6 select-none group-hover:text-terra/35 transition-colors">
                  &rdquo;
                </div>

                <p className="font-cormorant text-lg text-cream/85 leading-relaxed mb-7 italic relative z-10">
                  &ldquo;{t.text}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-terra/30 to-gold/20 flex items-center justify-center text-cream text-xs font-bold flex-shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-cream text-sm font-semibold leading-none">{t.name}</p>
                    <p className="text-muted text-xs mt-0.5">{t.loc}, Ghana</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="bg-brown text-cream">
        {/* Main footer grid */}
        <div className="px-8 md:px-14 lg:px-20 pt-16 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="font-playfair text-2xl text-cream mb-3">
                Bherty <span className="text-terra italic">Stitches</span>
              </h3>
              <p className="text-cream/60 text-sm leading-relaxed mb-5">
                Handcrafted crochet fashion made with love. Wearable art for the modern woman.
              </p>
              <div className="flex gap-3">
                {[
                  ['#', 'IG'],
                  ['#', 'FB'],
                  ['https://wa.me/message/UYA6ZRENI4P7O1', 'WA'],
                  ['#', 'TT'],
                ].map(([h, l]) => (
                  <a
                    key={l}
                    href={h as string}
                    target={h === '#' ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-[10px] font-bold text-cream/50 hover:text-cream hover:border-white/40 transition-all"
                  >
                    {l}
                  </a>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold mb-5">Quick Links</h4>
              <ul className="flex flex-col gap-3">
                {[['#home', 'Home'], ['#shop', 'Shop'], ['#about', 'About'], ['#order', 'Custom Orders'], ['#testimonials', 'Reviews']].map(([h, l]) => (
                  <li key={l}>
                    <a href={h} className="text-sm text-cream/55 hover:text-cream transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold mb-5">Policies</h4>
              <ul className="flex flex-col gap-3">
                {['Shipping Info', 'Returns Policy', 'Care Guide', 'Size Guide', 'FAQs'].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-cream/55 hover:text-cream transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold mb-5">Get in Touch</h4>
              <div className="flex flex-col gap-3.5 text-sm text-cream/60">
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 mt-0.5 opacity-60">📍</span>
                  <span>Prime Apartment and Hotel, Dansoman, Accra</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="opacity-60">💬</span>
                  <a href="https://wa.me/message/UYA6ZRENI4P7O1" target="_blank" rel="noopener noreferrer" className="hover:text-cream transition-colors">
                    WhatsApp Us
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="opacity-60">📧</span>
                  <a href="mailto:quansahbetty@gmail.com" className="hover:text-cream transition-colors">
                    quansahbetty@gmail.com
                  </a>
                </div>
                <p className="text-xs text-cream/40 mt-1">Mon – Sat · 8am – 6pm</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 px-8 md:px-14 lg:px-20 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-cream/35 text-xs">© 2025 Bherty Stitches. All rights reserved.</p>
          <p className="text-cream/30 text-xs">Made with 🧶 and love in Ghana</p>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════
          FAB Cart
      ══════════════════════════════════════════════════════════ */}
      <button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-terra text-white shadow-lg shadow-terra/30 hover:bg-brown transition-all duration-200 hover:scale-105 hover:shadow-xl flex items-center justify-center"
        aria-label="Open cart"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
      </button>
    </>
  );
}
