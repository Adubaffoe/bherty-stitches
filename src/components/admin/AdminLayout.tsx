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
  { href: '/admin', label: 'Dashboard', icon: <IconGrid /> },
  { href: '/admin/orders', label: 'Orders', icon: <IconPackage /> },
  { href: '/admin/requests', label: 'Custom Requests', icon: <IconScissors /> },
  { href: '/admin/products', label: 'Products', icon: <IconTag /> },
  { href: '/admin/settings', label: 'Settings', icon: <IconSettings /> },
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
      <div className="flex min-h-screen bg-[#F9FAFB]">

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 flex flex-col z-30">
          {/* Brand */}
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-terra flex items-center justify-center text-white font-playfair font-bold text-sm mr-3 flex-shrink-0">
              B
            </div>
            <span className="font-playfair text-dark text-lg leading-none">
              Bherty<span className="text-terra italic"> Admin</span>
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {NAV.map(({ href, label, icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                    active
                      ? 'bg-terra/10 text-terra'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className={`flex-shrink-0 transition-colors ${active ? 'text-terra' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    {icon}
                  </span>
                  {label}
                  {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-terra" />}
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-gray-100">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all duration-150"
              >
                <IconExternalLink />
                View Store
              </Link>
            </div>
          </nav>

          {/* User footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-terra/20 flex items-center justify-center text-terra text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-dark truncate">{user?.email}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Admin</p>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
              >
                <IconLogOut />
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main ────────────────────────────────────────────── */}
        <div className="flex-1 ml-64 flex flex-col min-h-screen">
          {/* Top bar */}
          <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-100 flex items-center px-8">
            <h1 className="text-lg font-semibold text-dark tracking-tight">{title}</h1>
          </header>

          {/* Page content */}
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>

      </div>
    </AdminGuard>
  );
}
