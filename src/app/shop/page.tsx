'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, STATIC_PRODUCTS } from '@/lib/products';
import { formatCedi } from '@/lib/formatCedi';
import { useCart } from '@/context/CartContext';
import Nav from '@/components/Nav';
import CartDrawer from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';

export default function ShopPage() {
  const { dispatch } = useCart();
  const [products, setProducts] = useState<Product[]>(STATIC_PRODUCTS);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const q = query(collection(db, 'products'), where('active', '==', true));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
        }
      } catch {
        // Fall back to static products if Firestore is not yet set up
      }
    }
    fetchProducts();
  }, []);

  function handleAddToCart(product: Product) {
    dispatch({ type: 'ADD', product });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1800);
  }

  return (
    <>
      <Nav onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => setCheckoutOpen(true)} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />

      <main className="pt-24 pb-20 bg-cream min-h-screen px-8 md:px-16 lg:px-24">
        <div className="mb-12">
          <div className="flex items-center gap-3 text-terra text-xs font-semibold uppercase tracking-[0.25em] mb-3">
            <span className="block w-7 h-px bg-terra" /> Ready to Ship
          </div>
          <h1 className="font-playfair text-5xl text-dark">
            Our <em className="text-terra not-italic italic">Collection</em>
          </h1>
          <p className="font-cormorant text-xl text-muted mt-2">
            {products.length} piece{products.length !== 1 ? 's' : ''} available — ships within 3–5 business days
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-ww hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
              {product.badge && (
                <span className="absolute top-3 left-3 z-10 bg-terra text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                  {product.badge}
                </span>
              )}
              <Link href={`/shop/${product.id}`}>
                <div className={`h-64 flex items-center justify-center text-7xl cursor-pointer ${product.colorClass}`}>
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    product.emoji
                  )}
                </div>
              </Link>
              <div className="p-5">
                <div className="text-gold text-xs tracking-wider mb-1.5">★★★★★</div>
                <Link href={`/shop/${product.id}`}>
                  <h3 className="font-playfair text-lg text-dark mb-1 hover:text-terra transition-colors">{product.name}</h3>
                </Link>
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
      </main>
    </>
  );
}
