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

const MARQUEE_TEXT = Array(4).fill(
  '✦ Handcrafted with Love  ✦ Made to Order  ✦ Kasoa, Ghana  ✦ Crochet Couture  ✦ Wearable Art'
).join('   ');

const TESTIMONIALS = [
  { name: 'Abena K.', loc: 'Accra, Ghana', avatar: '👩🏾', text: 'I ordered a custom maxi dress for my birthday and it was absolutely stunning. Everyone kept asking where I got it. Bherty Stitches is everything!' },
  { name: 'Efua T.', loc: 'Kumasi, Ghana', avatar: '👩🏽', text: 'The quality is incredible — so much detail in every stitch. My dress arrived perfectly packaged and fit like a dream. I\'m already planning my next order!' },
  { name: 'Adwoa M.', loc: 'Takoradi, Ghana', avatar: '👩🏿', text: 'Fast delivery, beautiful craftsmanship, and the seller was so communicative. This is true artistry. I\'ve recommended Bherty Stitches to all my friends!' },
];

const STYLES = ['Mini Dress', 'Midi Dress', 'Maxi Dress', 'Custom'];

export default function HomePage() {
  const { dispatch } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);

  // Custom order form state
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

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section id="home" className="min-h-screen grid md:grid-cols-2 pt-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 80% at 70% 50%,rgba(196,98,58,.07) 0%,transparent 70%),radial-gradient(ellipse 40% 60% at 20% 80%,rgba(212,168,67,.06) 0%,transparent 60%)' }} />

        {/* Left */}
        <div className="flex flex-col justify-center px-8 md:px-16 lg:px-24 py-16 z-10">
          <div className="flex items-center gap-3 text-terra text-xs font-semibold uppercase tracking-[0.25em] mb-6">
            <span className="block w-9 h-px bg-terra" />
            Handcrafted in Ghana
          </div>
          <h1 className="font-playfair text-5xl md:text-6xl lg:text-7xl leading-tight text-dark mb-6">
            Wearable <em className="text-terra not-italic">Art</em>,<br />Crafted for <em className="text-terra not-italic">You</em>
          </h1>
          <p className="font-cormorant text-xl text-muted leading-relaxed max-w-md mb-10">
            Each piece is lovingly handcrafted to celebrate your unique beauty. Discover our collection of bespoke crochet dresses.
          </p>
          <div className="flex gap-4 flex-wrap">
            <a href="#shop" className="bg-terra text-white px-8 py-4 text-sm font-semibold uppercase tracking-widest hover:bg-brown transition-all hover:-translate-y-0.5 hover:shadow-lg">
              Shop Collection
            </a>
            <a href="#order" className="border-2 border-brown text-brown px-8 py-4 text-sm font-semibold uppercase tracking-widest hover:bg-brown hover:text-white transition-all">
              Custom Order
            </a>
          </div>
        </div>

        {/* Right — hero card */}
        <div className="flex items-center justify-center px-8 md:px-12 py-16">
          <div className="bg-cream p-10 md:p-12 text-center shadow-2xl relative max-w-sm w-full">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-terra via-gold to-sage" />
            <div className="absolute -top-3 -right-3 bg-gold text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5">New Collection</div>
            <span className="block text-7xl mb-4 animate-float">🧶</span>
            <h3 className="font-playfair text-2xl text-brown mb-1">Crochet Couture</h3>
            <p className="font-cormorant text-base text-muted italic mb-6">Made to measure, made with love</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {['Handcrafted', 'Made-to-Order', 'Ghana Made'].map((t) => (
                <span key={t} className="bg-white text-terra border border-terra/25 px-3 py-1.5 text-xs font-medium uppercase tracking-wider">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────────────── */}
      <div className="bg-brown text-cream py-3.5 overflow-hidden whitespace-nowrap">
        <div className="inline-block animate-marquee font-cormorant text-base tracking-[0.15em] italic">
          {MARQUEE_TEXT}
          &nbsp;&nbsp;&nbsp;
          {MARQUEE_TEXT}
        </div>
      </div>

      {/* ── SHOP ─────────────────────────────────────────────────── */}
      <section id="shop" className="bg-cream px-8 md:px-16 lg:px-24 py-20">
        <div className="flex justify-between items-end mb-12 flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-3 text-terra text-xs font-semibold uppercase tracking-[0.25em] mb-3">
              <span className="block w-7 h-px bg-terra" /> Ready to Ship
            </div>
            <h2 className="font-playfair text-4xl md:text-5xl text-dark">
              Our <em className="text-terra not-italic italic">Collection</em>
            </h2>
          </div>
          <p className="font-cormorant text-lg text-muted max-w-xs">Each piece ships within 3–5 business days.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {STATIC_PRODUCTS.map((product) => (
            <div key={product.id} className="bg-ww hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 relative overflow-hidden cursor-pointer group">
              {product.badge && (
                <span className="absolute top-3 left-3 z-10 bg-terra text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                  {product.badge}
                </span>
              )}
              <div className={`h-64 flex items-center justify-center text-7xl ${product.colorClass}`}>
                {product.emoji}
              </div>
              <div className="p-5">
                <div className="text-gold text-xs tracking-wider mb-1.5">★★★★★</div>
                <h3 className="font-playfair text-lg text-dark mb-1">{product.name}</h3>
                <p className="text-xs text-muted mb-4 leading-relaxed">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-playfair text-xl text-terra font-bold">{formatCedi(product.price)}</span>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                      addedId === product.id
                        ? 'bg-sage text-white'
                        : 'bg-dark text-white hover:bg-terra'
                    }`}
                  >
                    {addedId === product.id ? '✓ Added!' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────────────────── */}
      <section id="about" className="grid md:grid-cols-2 gap-16 items-center bg-ww px-8 md:px-16 lg:px-24 py-20">
        <div className="bg-cream p-10 relative shadow-2xl">
          <div className="absolute bottom-[-14px] right-[-14px] w-full h-full border-2 border-terra/25 -z-10" />
          <span className="block text-5xl mb-4">🪡</span>
          <p className="font-cormorant text-2xl text-brown italic leading-relaxed mb-6">
            "Every stitch is a labour of love — crafted with patience, passion, and a deep respect for the art of crochet."
          </p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[['200+', 'Happy Clients'], ['3–10', 'Days per Piece'], ['100%', 'Handcrafted'], ['5★', 'Reviews']].map(([n, l]) => (
              <div key={l} className="bg-white p-4 text-center">
                <span className="block font-playfair text-3xl text-terra">{n}</span>
                <span className="text-xs uppercase tracking-wider text-muted">{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 text-terra text-xs font-semibold uppercase tracking-[0.25em] mb-4">
            <span className="block w-7 h-px bg-terra" /> Our Story
          </div>
          <h2 className="font-playfair text-4xl md:text-5xl text-dark mb-4">
            Crafted with <em className="text-terra not-italic italic">Heart</em>
          </h2>
          <p className="font-cormorant text-xl text-muted leading-relaxed mb-6">
            Bherty Stitches was born from a passion for crochet and a vision to create wearable art that empowers women. Based in Kasoa, Ghana, every piece is handcrafted with the finest yarns.
          </p>
          <ul className="flex flex-col gap-4">
            {[
              'Premium yarn sourced for durability and comfort',
              'Custom measurements for your perfect fit',
              'Every piece is unique — no two alike',
              'Packaged beautifully, delivered with care',
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-dark leading-relaxed">
                <span className="text-terra text-xs mt-1 flex-shrink-0">✦</span>
                {f}
              </li>
            ))}
          </ul>
          <a href="#order" className="inline-block mt-8 bg-terra text-white px-8 py-4 text-sm font-semibold uppercase tracking-widest hover:bg-brown transition-colors">
            Start a Custom Order
          </a>
        </div>
      </section>

      {/* ── CUSTOM ORDER ─────────────────────────────────────────── */}
      <section id="order" className="px-8 md:px-16 lg:px-24 py-20">
        <div className="flex items-center gap-3 text-terra text-xs font-semibold uppercase tracking-[0.25em] mb-3">
          <span className="block w-7 h-px bg-terra" /> Custom Orders
        </div>
        <h2 className="font-playfair text-4xl md:text-5xl text-dark mb-2">
          Order Your <em className="text-terra not-italic italic">Dream Dress</em>
        </h2>
        <p className="font-cormorant text-xl text-muted mb-12">Tell us exactly what you want. We&apos;ll handcraft it just for you.</p>

        <div className="grid md:grid-cols-2 gap-16">
          {/* How it works */}
          <div>
            <h3 className="font-playfair text-2xl text-dark mb-6">How it works</h3>
            <div className="flex flex-col gap-5 mb-8">
              {[
                ['1', 'Fill the Order Form', 'Share your measurements, colour preferences, and style ideas.'],
                ['2', 'Receive Confirmation', "We'll reach out within 24 hours to confirm details and pricing."],
                ['3', 'We Get to Work', 'Your dress is handcrafted with care over 3–10 days.'],
                ['4', 'Delivered to You', 'Packaged beautifully — delivered or ready for pickup.'],
              ].map(([n, t, d]) => (
                <div key={n} className="flex gap-4">
                  <div className="w-9 h-9 rounded-full bg-terra text-white font-bold text-sm flex items-center justify-center flex-shrink-0">{n}</div>
                  <div>
                    <strong className="block text-dark text-sm mb-0.5">{t}</strong>
                    <p className="text-muted text-sm leading-relaxed">{d}</p>
                  </div>
                </div>
              ))}
            </div>
            <h3 className="font-playfair text-xl text-dark mb-3">Pricing Guide</h3>
            {[
              ['Mini Dresses', 250],
              ['Midi Dresses', 350],
              ['Maxi Dresses', 450],
            ].map(([name, price]) => (
              <p key={name as string} className="text-sm text-dark mb-1">
                {name as string}: from <strong className="text-terra">{formatCedi(price as number)}</strong>
              </p>
            ))}
            <p className="text-sm text-dark mb-1">Rush orders (under 3 days): <strong className="text-terra">+ {formatCedi(100)}</strong></p>
            <p className="text-sm text-muted italic mt-2">Final price depends on complexity and yarn type.</p>
          </div>

          {/* Order form */}
          <form onSubmit={handleCustomOrder} className="bg-cream p-8 flex flex-col gap-4">
            <h3 className="font-playfair text-2xl text-dark">Place Your Order</h3>
            <p className="text-muted font-cormorant text-base">Fill in the form and we'll be in touch shortly ✨</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First Name *" value={orderForm.firstName} onChange={(v) => setOrderForm({ ...orderForm, firstName: v })} placeholder="Ama" />
              <FormField label="Last Name *" value={orderForm.lastName} onChange={(v) => setOrderForm({ ...orderForm, lastName: v })} placeholder="Mensah" />
            </div>
            <FormField label="Phone Number *" type="tel" value={orderForm.phone} onChange={(v) => setOrderForm({ ...orderForm, phone: v })} placeholder="+233 XX XXX XXXX" />
            <FormField label="Email Address" type="email" value={orderForm.email} onChange={(v) => setOrderForm({ ...orderForm, email: v })} placeholder="ama@email.com" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted uppercase tracking-wider mb-1">Dress Style *</label>
                <select
                  value={orderForm.style}
                  onChange={(e) => setOrderForm({ ...orderForm, style: e.target.value })}
                  className="w-full border border-muted/30 px-3 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-terra"
                >
                  <option value="">Select style</option>
                  {STYLES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <FormField label="Colour Preference *" value={orderForm.colour} onChange={(v) => setOrderForm({ ...orderForm, colour: v })} placeholder="e.g. Coral, White" />
            </div>
            <FormField label="Measurements (chest/waist/hips/height)" value={orderForm.measurements} onChange={(v) => setOrderForm({ ...orderForm, measurements: v })} placeholder="e.g. 36/28/38/5'6" />
            <div>
              <label className="block text-xs text-muted uppercase tracking-wider mb-1">Special Requests</label>
              <textarea
                value={orderForm.description}
                onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })}
                placeholder="Occasion, pattern, deadline..."
                rows={3}
                className="w-full border border-muted/30 px-3 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-terra resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-terra text-white py-4 text-sm font-semibold uppercase tracking-widest hover:bg-brown transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting…' : '✦ Submit My Order'}
            </button>
          </form>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
      <section id="testimonials" className="bg-dark px-8 md:px-16 lg:px-24 py-20">
        <div className="flex items-center gap-3 text-terra text-xs font-semibold uppercase tracking-[0.25em] mb-3">
          <span className="block w-7 h-px bg-terra" /> Client Love
        </div>
        <h2 className="font-playfair text-4xl md:text-5xl text-cream mb-12">
          What Our <em className="text-terra not-italic italic">Clients Say</em>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-[rgba(255,255,255,0.05)] border border-white/10 p-7">
              <div className="text-gold text-sm tracking-wider mb-4">★★★★★</div>
              <p className="font-cormorant text-lg text-cream/90 leading-relaxed mb-6 italic">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-terra/20 flex items-center justify-center text-xl">{t.avatar}</div>
                <div>
                  <p className="font-semibold text-cream text-sm">{t.name}</p>
                  <p className="text-muted text-xs">{t.loc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-brown text-cream px-8 md:px-16 lg:px-24 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div>
            <h3 className="font-playfair text-2xl mb-3">Bherty <span className="text-terra italic">Stitches</span></h3>
            <p className="text-cream/70 text-sm leading-relaxed">Handcrafted crochet fashion made with love. Wearable art for the modern woman.</p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest font-semibold mb-4 text-gold">Quick Links</h4>
            <ul className="flex flex-col gap-2.5">
              {[['#home', 'Home'], ['#shop', 'Shop'], ['#about', 'About'], ['#order', 'Custom Orders'], ['#testimonials', 'Reviews']].map(([h, l]) => (
                <li key={l}><a href={h} className="text-cream/70 hover:text-cream text-sm transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest font-semibold mb-4 text-gold">Policies</h4>
            <ul className="flex flex-col gap-2.5">
              {['Shipping Info', 'Returns Policy', 'Care Guide', 'Size Guide', 'FAQs'].map((l) => (
                <li key={l}><a href="#" className="text-cream/70 hover:text-cream text-sm transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest font-semibold mb-4 text-gold">Get in Touch</h4>
            <div className="flex flex-col gap-2 text-sm text-cream/70">
              <p>📍 Prime Apartment and Hotel, Dansoman, Accra</p>
              <p>💬 <a href="https://wa.me/message/UYA6ZRENI4P7O1" target="_blank" rel="noopener noreferrer" className="hover:text-cream transition-colors">WhatsApp Us</a></p>
              <p>📧 <a href="mailto:quansahbetty@gmail.com" className="hover:text-cream transition-colors">quansahbetty@gmail.com</a></p>
              <p className="mt-1">Mon – Sat: 8am – 6pm</p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-cream/50 text-xs">© 2025 Bherty Stitches. All rights reserved. Made with 🧶 and love.</p>
          <div className="flex gap-4 text-xl">
            {[['#', '📸', 'Instagram'], ['#', '💙', 'Facebook'], ['https://wa.me/message/UYA6ZRENI4P7O1', '💬', 'WhatsApp'], ['#', '🎵', 'TikTok']].map(([h, e, t]) => (
              <a key={t} href={h as string} target={h === '#' ? undefined : '_blank'} rel="noopener noreferrer" title={t as string} className="opacity-60 hover:opacity-100 transition-opacity">{e}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* FAB cart button */}
      <button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-terra text-white shadow-lg hover:bg-brown transition-colors flex items-center justify-center text-xl"
        aria-label="Open cart"
      >
        🛒
      </button>
    </>
  );
}

function FormField({ label, value, onChange, placeholder, type = 'text' }: {
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
        className="w-full border border-muted/30 px-3 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-terra"
      />
    </div>
  );
}
