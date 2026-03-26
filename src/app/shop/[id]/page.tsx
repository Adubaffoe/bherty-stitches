'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, STATIC_PRODUCTS } from '@/lib/products';
import { formatCedi } from '@/lib/formatCedi';
import { useCart } from '@/context/CartContext';
import Nav from '@/components/Nav';
import CartDrawer from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import { notFound } from 'next/navigation';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { dispatch } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const ref = doc(db, 'products', id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() } as Product);
        } else {
          // Fall back to static data
          const staticProduct = STATIC_PRODUCTS.find((p) => p.id === id);
          setProduct(staticProduct ?? null);
        }
      } catch {
        const staticProduct = STATIC_PRODUCTS.find((p) => p.id === id);
        setProduct(staticProduct ?? null);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (!loading && !product) return notFound();

  function handleAddToCart() {
    if (!product) return;
    for (let i = 0; i < qty; i++) dispatch({ type: 'ADD', product });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <>
      <Nav onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => setCheckoutOpen(true)} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />

      <main className="pt-24 pb-20 min-h-screen bg-ww px-8 md:px-16 lg:px-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted mb-8 uppercase tracking-wider">
          <Link href="/" className="hover:text-terra transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-terra transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-terra">{product?.name ?? '…'}</span>
        </div>

        {loading || !product ? (
          <ProductDetailSkeleton />
        ) : (
          <div className="grid md:grid-cols-2 gap-16 items-start max-w-5xl">
            {/* Image */}
            <div className={`aspect-square flex items-center justify-center text-8xl ${product.colorClass} relative`}>
              {product.badge && (
                <span className="absolute top-4 left-4 bg-terra text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5">
                  {product.badge}
                </span>
              )}
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <span className="animate-float">{product.emoji}</span>
              )}
            </div>

            {/* Info */}
            <div>
              <div className="text-gold text-sm tracking-wider mb-2">★★★★★</div>
              <h1 className="font-playfair text-4xl text-dark mb-2">{product.name}</h1>
              <p className="font-cormorant text-xl text-muted mb-6 leading-relaxed">{product.description}</p>
              <p className="font-playfair text-4xl text-terra font-bold mb-8">{formatCedi(product.price)}</p>

              {/* Qty + CTA */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border border-muted/30">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-dark hover:bg-cream transition-colors text-lg">−</button>
                  <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} className="w-10 h-10 flex items-center justify-center text-dark hover:bg-cream transition-colors text-lg">+</button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider transition-colors ${
                    added ? 'bg-sage text-white' : 'bg-dark text-white hover:bg-terra'
                  }`}
                >
                  {added ? '✓ Added to Cart!' : 'Add to Cart'}
                </button>
              </div>

              <button
                onClick={() => { handleAddToCart(); setCartOpen(true); }}
                className="w-full bg-terra text-white py-3 text-sm font-semibold uppercase tracking-wider hover:bg-brown transition-colors mb-6"
              >
                Buy Now
              </button>

              <div className="border-t border-cream pt-6 flex flex-col gap-2 text-sm text-muted">
                <p>✦ Handcrafted to order</p>
                <p>✦ Ships within 3–5 business days</p>
                <p>✦ Free studio pickup in Kasoa</p>
                <p>✦ Custom measurements available — <a href="/#order" className="text-terra hover:underline">place a custom order</a></p>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-16 items-start max-w-5xl">
      <div className="aspect-square bg-cream animate-pulse" />
      <div className="flex flex-col gap-4">
        <div className="h-4 w-24 bg-gold/20 rounded animate-pulse" />
        <div className="h-10 w-64 bg-dark/10 rounded animate-pulse" />
        <div className="h-5 w-full bg-muted/15 rounded animate-pulse" />
        <div className="h-5 w-4/5 bg-muted/15 rounded animate-pulse" />
        <div className="h-12 w-40 bg-terra/20 rounded animate-pulse mt-2" />
        <div className="flex gap-4 mt-4">
          <div className="h-10 w-24 bg-cream animate-pulse" />
          <div className="h-10 flex-1 bg-dark/10 animate-pulse" />
        </div>
        <div className="h-10 w-full bg-terra/20 animate-pulse" />
      </div>
    </div>
  );
}
