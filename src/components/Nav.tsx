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
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  function closeDrawer() { setDrawerOpen(false); }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 lg:px-20 h-[72px] transition-all duration-300 ${
          scrolled ? 'shadow-[0_1px_24px_rgba(42,26,20,0.08)]' : ''
        }`}
        style={{
          background: scrolled
            ? 'rgba(253,248,243,0.97)'
            : 'rgba(253,248,243,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(196,98,58,0.10)',
        }}
      >
        {/* Logo */}
        <Link href="/" className="font-playfair text-[1.35rem] text-brown leading-none tracking-tight hover:text-terra transition-colors">
          Bherty <span className="text-terra italic">Stitches</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-10 list-none">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="nav-link text-[11px] font-medium uppercase tracking-[0.18em] text-brown/80 hover:text-terra transition-colors">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right: cart + hamburger */}
        <div className="flex items-center gap-3">
          {/* Cart button */}
          <button
            onClick={onCartOpen}
            className="hidden md:flex items-center gap-2.5 bg-terra text-white text-[11px] font-semibold uppercase tracking-[0.16em] px-5 py-2.5 rounded-full hover:bg-brown transition-all duration-200 hover:shadow-md hover:-translate-y-px"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Cart
            {totalItems > 0 && (
              <span className="bg-white/25 text-white w-5 h-5 rounded-full text-[10px] font-bold inline-flex items-center justify-center leading-none">
                {totalItems}
              </span>
            )}
          </button>

          {/* Mobile cart icon */}
          <button
            onClick={onCartOpen}
            className="md:hidden relative p-2 text-brown hover:text-terra transition-colors"
            aria-label="Open cart"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-terra text-white w-4 h-4 rounded-full text-[9px] font-bold inline-flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          {/* Hamburger */}
          <button
            className="md:hidden flex flex-col gap-[5px] p-1.5 ml-0.5"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <span className="block w-5 h-[1.5px] bg-brown" />
            <span className="block w-5 h-[1.5px] bg-brown" />
            <span className="block w-3.5 h-[1.5px] bg-brown self-end" />
          </button>
        </div>
      </nav>

      {/* Mobile backdrop */}
      <div
        onClick={closeDrawer}
        className={`fixed inset-0 z-50 bg-dark/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Mobile slide-in menu */}
      <div
        className={`fixed top-0 right-0 h-full w-[300px] z-50 flex flex-col transition-transform duration-300 ease-out md:hidden ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ background: 'var(--ww)' }}
      >
        {/* Menu header */}
        <div className="flex items-center justify-between px-7 h-[72px] border-b border-terra/10">
          <span className="font-playfair text-lg text-brown leading-none">
            Bherty <span className="text-terra italic">Stitches</span>
          </span>
          <button
            onClick={closeDrawer}
            aria-label="Close menu"
            className="w-8 h-8 flex items-center justify-center text-muted hover:text-terra transition-colors rounded-full hover:bg-terra/5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Menu links */}
        <ul className="flex flex-col px-7 pt-6 list-none flex-1">
          {NAV_LINKS.map((l, i) => (
            <li key={l.href} style={{ animationDelay: `${i * 60}ms` }}>
              <a
                href={l.href}
                onClick={closeDrawer}
                className="flex items-center justify-between py-4 text-sm font-medium text-brown hover:text-terra border-b border-cream/80 transition-colors group"
              >
                <span className="uppercase tracking-[0.18em] text-xs">{l.label}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </a>
            </li>
          ))}
        </ul>

        {/* Mobile cart CTA */}
        <div className="p-7 pb-10">
          <button
            onClick={() => { closeDrawer(); onCartOpen(); }}
            className="w-full bg-terra text-white py-3.5 text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-brown transition-colors flex items-center justify-center gap-2.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            View Cart
            {totalItems > 0 && (
              <span className="bg-white/25 text-white w-5 h-5 rounded-full text-[10px] font-bold inline-flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
