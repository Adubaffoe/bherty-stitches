'use client';

import { useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { formatCedi } from '@/lib/formatCedi';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ open, onClose, onCheckout }: CartDrawerProps) {
  const { state, dispatch, totalItems, totalPrice } = useCart();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const freeDelivery = totalPrice >= 1000;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-dark/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[400px] z-50 flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ background: 'var(--ww)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-terra/10">
          <div className="flex items-center gap-3">
            <h2 className="font-playfair text-xl text-dark">Your Bag</h2>
            {totalItems > 0 && (
              <span className="bg-terra/10 text-terra text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-muted hover:text-terra rounded-full hover:bg-terra/5 transition-all"
            aria-label="Close cart"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-5">
          {state.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 pb-16">
              <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center text-3xl">
                🧺
              </div>
              <div>
                <p className="font-playfair text-lg text-dark mb-1">Your bag is empty</p>
                <p className="text-sm text-muted leading-relaxed">
                  Discover our handcrafted collection<br />and add something beautiful.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-terra border-b border-terra/40 hover:border-terra transition-colors pb-0.5"
              >
                Browse Collection →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Free delivery nudge */}
              {!freeDelivery && totalPrice > 0 && (
                <div className="bg-cream rounded-xl px-4 py-3 text-xs text-muted flex items-center gap-2.5">
                  <span className="text-base">🚚</span>
                  <span>
                    Add <strong className="text-terra font-semibold">{formatCedi(1000 - totalPrice)}</strong> more for free home delivery
                  </span>
                </div>
              )}
              {freeDelivery && (
                <div className="bg-sage/10 border border-sage/20 rounded-xl px-4 py-3 text-xs text-sage flex items-center gap-2.5">
                  <span className="text-base">✓</span>
                  <span className="font-medium">You qualify for free home delivery!</span>
                </div>
              )}

              {state.items.map(({ product, qty }) => (
                <div key={product.id} className="flex items-start gap-4 pb-5 border-b border-cream last:border-0 last:pb-0">
                  {/* Thumbnail */}
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${product.colorClass}`}>
                    {product.emoji}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-playfair text-sm text-dark leading-snug mb-0.5">{product.name}</p>
                    <p className="text-terra text-sm font-semibold">{formatCedi(product.price * qty)}</p>
                    <p className="text-[11px] text-muted mt-0.5">{formatCedi(product.price)} each</p>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <button
                      onClick={() => dispatch({ type: 'REMOVE', id: product.id })}
                      className="text-muted/60 hover:text-terra transition-colors"
                      aria-label="Remove item"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                    <div className="flex items-center gap-2 bg-cream rounded-full px-1 py-0.5">
                      <button
                        onClick={() => dispatch({ type: 'SET_QTY', id: product.id, qty: qty - 1 })}
                        className="w-6 h-6 flex items-center justify-center text-muted hover:text-terra text-base font-medium transition-colors rounded-full hover:bg-white"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-xs font-semibold text-dark">{qty}</span>
                      <button
                        onClick={() => dispatch({ type: 'SET_QTY', id: product.id, qty: qty + 1 })}
                        className="w-6 h-6 flex items-center justify-center text-muted hover:text-terra text-base font-medium transition-colors rounded-full hover:bg-white"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {totalItems > 0 && (
          <div className="px-7 py-6 border-t border-terra/10 bg-white/60">
            {/* Subtotal */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Subtotal</span>
              <span className="font-playfair text-xl text-dark font-semibold">{formatCedi(totalPrice)}</span>
            </div>
            {freeDelivery ? (
              <p className="text-[11px] text-sage mb-4">Free delivery included</p>
            ) : (
              <p className="text-[11px] text-muted mb-4">Delivery fee confirmed via WhatsApp</p>
            )}

            <button
              onClick={() => { onClose(); onCheckout(); }}
              className="w-full bg-dark text-white py-4 text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-terra transition-all duration-200 hover:shadow-lg hover:-translate-y-px"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={onClose}
              className="w-full mt-2.5 text-xs text-muted font-medium py-2 hover:text-terra transition-colors tracking-wider"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
