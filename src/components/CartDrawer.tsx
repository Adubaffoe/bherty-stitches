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

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-dark/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[420px] z-50 bg-ww shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-terra/10">
          <h2 className="font-playfair text-2xl text-dark">Your Cart 🧶</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-terra text-xl font-bold leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {state.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-20">
              <span className="text-5xl">🛒</span>
              <p className="text-muted font-cormorant text-lg">
                Your cart is empty.<br />Add some beautiful dresses!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {state.items.map(({ product, qty }) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 border-b border-cream pb-4"
                >
                  {/* Emoji image */}
                  <div
                    className={`w-14 h-14 flex items-center justify-center text-2xl rounded flex-shrink-0 bg-cream`}
                  >
                    {product.emoji}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-playfair text-sm text-dark truncate">{product.name}</p>
                    <p className="text-terra text-sm font-semibold">
                      {formatCedi(product.price * qty)}
                    </p>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => dispatch({ type: 'SET_QTY', id: product.id, qty: qty - 1 })}
                      className="w-7 h-7 bg-cream hover:bg-terra hover:text-white transition-colors rounded text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                    <button
                      onClick={() => dispatch({ type: 'SET_QTY', id: product.id, qty: qty + 1 })}
                      className="w-7 h-7 bg-cream hover:bg-terra hover:text-white transition-colors rounded text-sm font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => dispatch({ type: 'REMOVE', id: product.id })}
                    className="text-muted hover:text-terra text-sm ml-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {totalItems > 0 && (
          <div className="px-6 py-5 border-t border-terra/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm uppercase tracking-wider text-muted font-semibold">Total</span>
              <span className="font-playfair text-xl text-terra font-bold">{formatCedi(totalPrice)}</span>
            </div>
            <button
              onClick={() => { onClose(); onCheckout(); }}
              className="w-full bg-dark text-white py-3 text-sm font-semibold uppercase tracking-wider hover:bg-terra transition-colors"
            >
              ✦ Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
