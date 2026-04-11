'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { ReactNode } from 'react';
import AdminGuard from '@/components/AdminGuard';

/* ── Inline SVG icons ─────────────────────────────────────── */
function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}
function IconTag() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  );
}
function IconPackage() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <path d="M3.29 7 12 12l8.71-5"/>
      <path d="M12 22V12"/>
    </svg>
  );
}
function IconScissors() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3"/>
      <circle cx="6" cy="18" r="3"/>
      <line x1="20" y1="4" x2="8.12" y2="15.88"/>
      <line x1="14.47" y1="14.48" x2="20" y2="20"/>
      <line x1="8.12" y1="8.12" x2="12" y2="12"/>
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}
function IconExternalLink() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}
function IconLogOut() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

/* ── Nav items ─────────────────────────────────────────────── */
const NAV = [
  { href: '/admin', label: 'Dashboard', description: 'Overview and signals', icon: <IconGrid /> },
  { href: '/admin/orders', label: 'Orders', description: 'Payments and fulfilment', icon: <IconPackage /> },
  { href: '/admin/requests', label: 'Requests', description: 'Custom client pipeline', icon: <IconScissors /> },
  { href: '/admin/products', label: 'Products', description: 'Catalog and images', icon: <IconTag /> },
  { href: '/admin/settings', label: 'Settings', description: 'Store details and payment', icon: <IconSettings /> },
];

/* ── Layout ────────────────────────────────────────────────── */
interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  async function handleSignOut() {
    await signOut(auth);
    router.replace('/admin/login');
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'AD';

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[#f6f1ea]">

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className="fixed inset-y-0 left-0 w-72 bg-[#2b1d18] text-white flex flex-col z-30 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(196,98,58,0.24),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.03),_transparent)]" />
          {/* Brand */}
          <div className="relative px-7 pt-8 pb-6 border-b border-white/8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-terra flex items-center justify-center text-white font-playfair font-bold text-base shadow-[0_8px_30px_rgba(196,98,58,0.35)] flex-shrink-0">
                B
              </div>
              <div>
                <span className="font-playfair text-xl leading-none block">
                  Bherty <span className="text-terra italic">Admin</span>
                </span>
                <span className="text-[10px] uppercase tracking-[0.24em] text-white/45">Studio Console</span>
              </div>
            </div>
            <p className="text-sm text-white/58 leading-relaxed max-w-[15rem]">
              A refined control room for orders, clients, and collection management.
            </p>
          </div>

          {/* Nav */}
          <nav className="relative flex-1 px-5 py-6 space-y-3 overflow-y-auto">
            <p className="px-2 text-[10px] uppercase tracking-[0.24em] text-white/35 mb-3">Navigation</p>
            {NAV.map(({ href, label, description, icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group relative flex items-start gap-3 rounded-2xl px-4 py-4 transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-br from-white/14 to-white/6 text-white shadow-[0_14px_35px_rgba(0,0,0,0.18)] ring-1 ring-white/10'
                      : 'text-white/78 hover:bg-white/6 hover:text-white'
                  }`}
                >
                  <span className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl transition-colors ${
                    active ? 'bg-terra text-white shadow-[0_10px_24px_rgba(196,98,58,0.35)]' : 'bg-white/6 text-white/70 group-hover:bg-white/10 group-hover:text-white'
                  }`}>
                    {icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold tracking-[0.01em]">{label}</span>
                    <span className={`mt-1 block text-xs leading-relaxed ${active ? 'text-white/72' : 'text-white/42 group-hover:text-white/55'}`}>
                      {description}
                    </span>
                  </span>
                  {active && <span className="mt-1.5 h-2 w-2 rounded-full bg-terra shadow-[0_0_0_6px_rgba(196,98,58,0.12)]" />}
                </Link>
              );
            })}

            <div className="pt-5 mt-5 border-t border-white/8">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-medium text-white/70 hover:bg-white/6 hover:text-white transition-all duration-150"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/6">
                  <IconExternalLink />
                </span>
                <span>
                  <span className="block font-semibold">View Store</span>
                  <span className="block text-xs text-white/40">Open the public website</span>
                </span>
              </Link>
            </div>
          </nav>

          {/* User footer */}
          <div className="relative p-5 border-t border-white/8">
            <div className="flex items-center gap-3 rounded-2xl bg-white/6 px-3 py-3">
              <div className="w-10 h-10 rounded-2xl bg-terra/18 flex items-center justify-center text-terra text-xs font-bold flex-shrink-0 border border-terra/15">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{user?.email}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.18em] mt-0.5">Admin Session</p>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="text-white/45 hover:text-red-300 transition-colors p-1 flex-shrink-0"
              >
                <IconLogOut />
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main ────────────────────────────────────────────── */}
        <div className="flex-1 ml-72 flex flex-col min-h-screen">
          {/* Top bar */}
          <header className="sticky top-0 z-20 h-20 bg-[#f6f1ea]/92 backdrop-blur-md border-b border-[#e8ddd0] flex items-center px-10">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted mb-1">Bherty Stitches</p>
              <h1 className="text-2xl font-semibold text-dark tracking-tight">{title}</h1>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-10">
            {children}
          </main>
        </div>

      </div>
    </AdminGuard>
  );
}
