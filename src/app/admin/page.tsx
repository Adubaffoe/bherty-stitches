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

function StatCard({ label, value, icon, loading }: { label: string; value: number; icon: string; loading: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">{label}</p>
          {loading ? (
            <div className="h-9 w-16 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <p className="text-4xl font-semibold text-dark">{value}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-terra/10 flex items-center justify-center text-xl">
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
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard label="Total Orders" value={stats.orders} icon="📦" loading={loading} />
        <StatCard label="Custom Requests" value={stats.requests} icon="✂️" loading={loading} />
        <StatCard label="Products" value={stats.products} icon="👗" loading={loading} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Revenue Tracked</p>
          {loading ? (
            <div className="h-9 w-28 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <p className="text-4xl font-semibold text-dark">{formatCedi(stats.revenue)}</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Pending Orders</p>
          {loading ? (
            <div className="h-9 w-16 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <p className="text-4xl font-semibold text-dark">{stats.pendingOrders}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Link href="/admin/orders" className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Order Workflow</p>
          <h2 className="text-xl font-semibold text-dark mb-2">Manage every order from one place</h2>
          <p className="text-sm text-gray-400 leading-relaxed">Review payment details, update statuses, and keep internal notes as each order moves from new to delivered.</p>
        </Link>
        <Link href="/admin/requests" className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Custom Requests</p>
          <h2 className="text-xl font-semibold text-dark mb-2">Track enquiries and quote follow-up</h2>
          <p className="text-sm text-gray-400 leading-relaxed">Open each request, move it through your pipeline, and keep private notes while you convert enquiries into orders.</p>
        </Link>
      </div>

      {/* Recent activity */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-dark">Recent Orders</h2>
            <span className="text-xs text-gray-400">Last 5</span>
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
            <div className="px-6 py-10 text-center">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm text-gray-400">No orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-dark">{o.customerName}</p>
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
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-dark">Custom Requests</h2>
            <span className="text-xs text-gray-400">Last 5</span>
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
            <div className="px-6 py-10 text-center">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm text-gray-400">No requests yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {customRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
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
