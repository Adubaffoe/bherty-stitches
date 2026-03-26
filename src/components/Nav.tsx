'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

const NAV_LINKS = [
  { href: '/#shop', label: 'Shop' },
  { href: '/#about', label: 'About' },
  { href: '/#order', label: 'Custom Order' },
  { href: '/#testimonials', label: 'Reviews' },
];

interface NavProps {
  onCartOpen: () => void;
}

export default function Nav({ onCartOpen }: NavProps) {
  const { totalItems } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  function closeDrawer() {
    setDrawerOpen(false);
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 transition-shadow duration-300 ${
          scrolled ? 'shadow-md' : ''
        }`}
        style={{ background: 'rgba(253,248,243,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(196,98,58,0.15)' }}
      >
        {/* Logo */}
        <Link href="/" className="font-playfair text-2xl text-brown">
          Bherty <span className="text-terra italic">Stitches</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex gap-8 list-none">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-xs font-medium uppercase tracking-widest text-brown hover:text-terra transition-colors"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop cart + hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCartOpen}
            className="flex items-center gap-2 bg-terra text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-brown transition-colors"
          >
            Cart
            {totalItems > 0 && (
              <span className="bg-gold text-white w-[18px] h-[18px] rounded-full text-[10px] font-bold inline-flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex flex-col gap-[5px] p-1"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <span className="block w-6 h-[2px] bg-brown" />
            <span className="block w-6 h-[2px] bg-brown" />
            <span className="block w-6 h-[2px] bg-brown" />
          </button>
        </div>
      </nav>

      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-dark/50 md:hidden"
          onClick={closeDrawer}
        />
      )}

      {/* Mobile slide-in drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-72 z-50 bg-ww shadow-2xl flex flex-col transition-transform duration-300 md:hidden ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-terra/10">
          <span className="font-playfair text-xl text-brown">
            Bherty <span className="text-terra italic">Stitches</span>
          </span>
          <button
            onClick={closeDrawer}
            aria-label="Close menu"
            className="text-muted hover:text-terra text-xl font-bold"
          >
            ✕
          </button>
        </div>

        <ul className="flex flex-col gap-1 p-6 list-none flex-1">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={closeDrawer}
                className="block py-3 text-sm font-medium uppercase tracking-widest text-brown hover:text-terra border-b border-cream transition-colors"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="p-6">
          <button
            onClick={() => { closeDrawer(); onCartOpen(); }}
            className="w-full bg-terra text-white py-3 text-sm font-semibold uppercase tracking-wider hover:bg-brown transition-colors flex items-center justify-center gap-2"
          >
            🛒 Cart
            {totalItems > 0 && (
              <span className="bg-gold text-white w-5 h-5 rounded-full text-xs font-bold inline-flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
