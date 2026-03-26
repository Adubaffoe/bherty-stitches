'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import AdminGuard from '@/components/AdminGuard';
import { formatCedi } from '@/lib/formatCedi';

interface OrderSummary {
  id: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: { toDate: () => Date } | null;
}

interface CustomRequestSummary {
  id: string;
  name: string;
  phone: string;
  status: string;
  createdAt: { toDate: () => Date } | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomRequestSummary[]>([]);
  const [stats, setStats] = useState({ orders: 0, requests: 0, products: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersSnap, requestsSnap, productsSnap] = await Promise.all([
          getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5))),
          getDocs(query(collection(db, 'customRequests'), orderBy('createdAt', 'desc'), limit(5))),
          getDocs(collection(db, 'products')),
        ]);
        setOrders(ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as OrderSummary)));
        setCustomRequests(requestsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as CustomRequestSummary)));
        setStats({ orders: ordersSnap.size, requests: requestsSnap.size, products: productsSnap.size });
      } catch {
        // Handle error silently — empty state shows
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleSignOut() {
    await signOut(auth);
    router.replace('/admin/login');
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-ww">
        {/* Admin Nav */}
        <nav className="bg-dark text-cream px-8 py-4 flex items-center justify-between">
          <h1 className="font-playfair text-xl">Bherty <span className="text-terra italic">Admin</span></h1>
          <div className="flex items-center gap-6">
            <Link href="/admin/products" className="text-sm text-cream/70 hover:text-cream transition-colors">Products</Link>
            <Link href="/" className="text-sm text-cream/70 hover:text-cream transition-colors">View Site</Link>
            <button onClick={handleSignOut} className="text-sm bg-terra text-white px-4 py-1.5 hover:bg-brown transition-colors">Sign Out</button>
          </div>
        </nav>

        <main className="px-8 md:px-16 py-10">
          <h2 className="font-playfair text-3xl text-dark mb-8">Dashboard</h2>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {[
              { label: 'Total Orders', value: stats.orders, icon: '📦' },
              { label: 'Custom Requests', value: stats.requests, icon: '✂️' },
              { label: 'Products', value: stats.products, icon: '👗' },
            ].map((s) => (
              <div key={s.label} className="bg-cream p-6">
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="font-playfair text-4xl text-terra">{loading ? '…' : s.value}</div>
                <div className="text-xs text-muted uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Recent Orders */}
            <div>
              <h3 className="font-playfair text-2xl text-dark mb-4">Recent Orders</h3>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-cream animate-pulse" />)}
                </div>
              ) : orders.length === 0 ? (
                <p className="text-muted font-cormorant text-lg">No orders yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {orders.map((o) => (
                    <div key={o.id} className="bg-cream p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-dark">{o.customerName}</p>
                        <p className="text-xs text-muted">{o.createdAt?.toDate().toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-playfair text-terra font-bold">{formatCedi(o.total)}</p>
                        <span className="text-[10px] uppercase tracking-wider bg-sage/20 text-sage px-2 py-0.5">{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Custom Requests */}
            <div>
              <h3 className="font-playfair text-2xl text-dark mb-4">Custom Requests</h3>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-cream animate-pulse" />)}
                </div>
              ) : customRequests.length === 0 ? (
                <p className="text-muted font-cormorant text-lg">No custom requests yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {customRequests.map((r) => (
                    <div key={r.id} className="bg-cream p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-dark">{r.name}</p>
                        <p className="text-xs text-muted">{r.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted">{r.createdAt?.toDate().toLocaleDateString()}</p>
                        <span className="text-[10px] uppercase tracking-wider bg-gold/20 text-gold px-2 py-0.5">{r.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-10">
            <Link
              href="/admin/products"
              className="inline-block bg-terra text-white px-8 py-3 text-sm font-semibold uppercase tracking-widest hover:bg-brown transition-colors"
            >
              Manage Products →
            </Link>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
