'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { formatCedi } from '@/lib/formatCedi';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';

interface OrderSummary {
  id: string;
  orderNumber?: string;
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

function StatCard({ label, value, icon, loading, accent }: { label: string; value: number | string; icon: string; loading: boolean; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-[#eadfd3] bg-white p-6 shadow-[0_18px_50px_rgba(42,26,20,0.05)] transition-transform duration-200 hover:-translate-y-0.5">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold text-muted uppercase tracking-[0.22em] mb-3">{label}</p>
          {loading ? (
            <div className="h-10 w-20 bg-[#f2e8de] rounded-xl animate-pulse" />
          ) : (
            <p className="font-playfair text-4xl text-dark">{value}</p>
          )}
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[#fbf5ef] border border-[#efe2d5] flex items-center justify-center text-xl text-terra shadow-[0_10px_25px_rgba(42,26,20,0.04)]">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomRequestSummary[]>([]);
  const [stats, setStats] = useState({ orders: 0, requests: 0, products: 0, revenue: 0, pendingOrders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [recentOrdersSnap, recentRequestsSnap, allOrdersSnap, allRequestsSnap, productsSnap] = await Promise.all([
          getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5))),
          getDocs(query(collection(db, 'customRequests'), orderBy('createdAt', 'desc'), limit(5))),
          getDocs(collection(db, 'orders')),
          getDocs(collection(db, 'customRequests')),
          getDocs(collection(db, 'products')),
        ]);
        const allOrders = allOrdersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as OrderSummary));
        setOrders(recentOrdersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as OrderSummary)));
        setCustomRequests(recentRequestsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as CustomRequestSummary)));
        setStats({
          orders: allOrdersSnap.size,
          requests: allRequestsSnap.size,
          products: productsSnap.size,
          revenue: allOrders.reduce((sum, order) => sum + (order.total || 0), 0),
          pendingOrders: allOrders.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length,
        });
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <AdminLayout title="Dashboard">
      <section className="rounded-[2rem] border border-[#e6d9cb] bg-[linear-gradient(135deg,#fffaf5_0%,#f6ede4_100%)] px-8 py-8 mb-8 shadow-[0_20px_60px_rgba(42,26,20,0.06)]">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="text-[10px] font-semibold text-terra uppercase tracking-[0.28em] mb-3">Studio Overview</p>
            <h2 className="font-playfair text-4xl text-dark mb-3">A calmer, more premium control space</h2>
            <p className="max-w-2xl text-sm text-muted leading-relaxed">
              Keep an eye on revenue, client requests, and fulfilment from one polished dashboard designed for daily studio work.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-fit">
            <Link href="/admin/orders" className="rounded-2xl bg-dark text-white px-5 py-4 shadow-[0_18px_40px_rgba(42,26,20,0.15)] hover:bg-brown transition-colors">
              <span className="block text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">Primary</span>
              <span className="block text-sm font-semibold">Open Orders</span>
            </Link>
            <Link href="/admin/requests" className="rounded-2xl border border-[#e1d3c4] bg-white px-5 py-4 hover:border-terra/25 hover:bg-[#fffaf5] transition-colors">
              <span className="block text-[10px] uppercase tracking-[0.2em] text-muted mb-1">Pipeline</span>
              <span className="block text-sm font-semibold text-dark">View Requests</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
        <StatCard label="Total Orders" value={stats.orders} icon="📦" loading={loading} accent="bg-gradient-to-r from-terra to-gold" />
        <StatCard label="Client Requests" value={stats.requests} icon="✂️" loading={loading} accent="bg-gradient-to-r from-gold to-[#e0bf73]" />
        <StatCard label="Products" value={stats.products} icon="👗" loading={loading} accent="bg-gradient-to-r from-sage to-[#9ab38a]" />
        <StatCard label="Revenue" value={formatCedi(stats.revenue)} icon="✦" loading={loading} accent="bg-gradient-to-r from-brown to-terra" />
        <StatCard label="Pending Orders" value={stats.pendingOrders} icon="⏳" loading={loading} accent="bg-gradient-to-r from-dark to-brown" />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Link href="/admin/orders" className="group rounded-[1.75rem] border border-[#e6d9cb] bg-white p-7 shadow-[0_18px_45px_rgba(42,26,20,0.05)] hover:-translate-y-0.5 transition-all duration-200">
          <p className="text-[10px] font-semibold text-terra uppercase tracking-[0.22em] mb-3">Order Workflow</p>
          <h2 className="font-playfair text-2xl text-dark mb-2">Manage every order in one place</h2>
          <p className="text-sm text-muted leading-relaxed">Review payments, update fulfilment status, and keep private notes without leaving the order view.</p>
          <p className="text-sm font-semibold text-dark mt-5 group-hover:text-terra transition-colors">Open order tiles →</p>
        </Link>
        <Link href="/admin/requests" className="group rounded-[1.75rem] border border-[#e6d9cb] bg-white p-7 shadow-[0_18px_45px_rgba(42,26,20,0.05)] hover:-translate-y-0.5 transition-all duration-200">
          <p className="text-[10px] font-semibold text-terra uppercase tracking-[0.22em] mb-3">Custom Requests</p>
          <h2 className="font-playfair text-2xl text-dark mb-2">Track enquiries with more clarity</h2>
          <p className="text-sm text-muted leading-relaxed">Move bespoke enquiries through your pipeline and keep the studio’s follow-up process neat and premium.</p>
          <p className="text-sm font-semibold text-dark mt-5 group-hover:text-terra transition-colors">Open request tiles →</p>
        </Link>
      </div>

      {/* Recent activity */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Recent Orders */}
        <div className="rounded-[1.75rem] border border-[#e6d9cb] bg-white overflow-hidden shadow-[0_18px_45px_rgba(42,26,20,0.05)]">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#f1e7dc] bg-[#fffaf5]">
            <h2 className="font-playfair text-2xl text-dark">Recent Orders</h2>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Last 5</span>
          </div>
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                    <div className="h-2.5 w-20 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm text-gray-400">No orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f5ece2]">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#fffaf5] transition-colors">
                  <div>
                    <p className="text-sm font-medium text-dark">{o.customerName}</p>
                    {o.orderNumber && <p className="text-xs text-terra mt-1">{o.orderNumber}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{o.createdAt?.toDate().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-terra">{formatCedi(o.total)}</p>
                    <span className="inline-block text-[10px] uppercase tracking-wider bg-sage/15 text-sage px-2 py-0.5 rounded-full mt-0.5">
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Custom Requests */}
        <div className="rounded-[1.75rem] border border-[#e6d9cb] bg-white overflow-hidden shadow-[0_18px_45px_rgba(42,26,20,0.05)]">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#f1e7dc] bg-[#fffaf5]">
            <h2 className="font-playfair text-2xl text-dark">Recent Requests</h2>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Last 5</span>
          </div>
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                    <div className="h-2.5 w-20 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : customRequests.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm text-gray-400">No requests yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f5ece2]">
              {customRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#fffaf5] transition-colors">
                  <div>
                    <p className="text-sm font-medium text-dark">{r.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{r.createdAt?.toDate().toLocaleDateString()}</p>
                    <span className="inline-block text-[10px] uppercase tracking-wider bg-gold/15 text-gold px-2 py-0.5 rounded-full mt-0.5">
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
