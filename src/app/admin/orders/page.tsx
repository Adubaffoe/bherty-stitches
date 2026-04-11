'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatCedi } from '@/lib/formatCedi';
import AdminLayout from '@/components/admin/AdminLayout';
import { buildPublicTrackingRecord } from '@/lib/orderTracking';

type FireDate = { toDate: () => Date } | null;
type OrderStatus = 'new' | 'paid' | 'in progress' | 'ready' | 'delivered' | 'cancelled';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

interface OrderRecord {
  id: string;
  orderNumber?: string;
  customerName: string;
  phone: string;
  email?: string | null;
  measurements?: string | null;
  notes?: string | null;
  items: OrderItem[];
  total: number;
  deliveryMode: 'delivery' | 'pickup' | null;
  deliveryInfo?: Record<string, string | null> | null;
  customerMobileMoneyName?: string | null;
  customerMobileMoneyNumber?: string | null;
  transactionId?: string | null;
  amountPaid?: number | null;
  status: OrderStatus;
  adminNote?: string | null;
  createdAt: FireDate;
}

const STATUS_OPTIONS: OrderStatus[] = ['new', 'paid', 'in progress', 'ready', 'delivered', 'cancelled'];

function formatDate(date: FireDate) {
  return date?.toDate().toLocaleString() ?? 'No date';
}

function StatusPill({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    new: 'bg-gold/15 text-gold',
    paid: 'bg-sage/15 text-sage',
    'in progress': 'bg-blue-100 text-blue-700',
    ready: 'bg-violet-100 text-violet-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-600',
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function fetchOrders() {
    try {
      const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
      const rows = snap.docs.map((item) => ({ id: item.id, ...item.data() } as OrderRecord));
      setOrders(rows);
      setSelectedId((current) => current ?? rows[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesSearch =
        term.length === 0 ||
        order.customerName.toLowerCase().includes(term) ||
        order.phone.toLowerCase().includes(term) ||
        order.transactionId?.toLowerCase().includes(term) ||
        order.orderNumber?.toLowerCase().includes(term) ||
        order.id.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const selectedOrder =
    filteredOrders.find((order) => order.id === selectedId) ??
    orders.find((order) => order.id === selectedId) ??
    filteredOrders[0] ??
    null;

  async function updateOrder(orderId: string, patch: Partial<OrderRecord>) {
    setSavingId(orderId);
    try {
      const currentOrder = orders.find((order) => order.id === orderId);
      await updateDoc(doc(db, 'orders', orderId), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
      if (currentOrder?.orderNumber) {
        await setDoc(
          doc(db, 'orderTracking', currentOrder.orderNumber),
          buildPublicTrackingRecord({
            orderNumber: currentOrder.orderNumber,
            customerName: currentOrder.customerName.split(' ')[0] || currentOrder.customerName,
            status: (patch.status as OrderStatus | undefined) ?? currentOrder.status,
            total: currentOrder.total,
            deliveryMode: currentOrder.deliveryMode,
            items: currentOrder.items.map((item) => ({ name: item.name, qty: item.qty })),
            createdAt: currentOrder.createdAt ?? serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
          { merge: true },
        );
      }
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, ...patch } : order)),
      );
    } finally {
      setSavingId(null);
    }
  }

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length;

  return (
    <AdminLayout title="Orders">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Total Orders</p>
          <p className="text-4xl font-semibold text-dark">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Pending</p>
          <p className="text-4xl font-semibold text-dark">{pendingOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Revenue Tracked</p>
          <p className="text-4xl font-semibold text-dark">{formatCedi(totalRevenue)}</p>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.2fr_0.9fr] gap-6">
        <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer, phone, transaction ID, or order ID"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-dark focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/10"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | OrderStatus)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/10"
              >
                <option value="all">All statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-20 rounded-xl bg-gray-50 animate-pulse" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-3xl mb-2">📦</p>
              <p className="text-sm text-gray-400">No orders matched your filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedId(order.id)}
                  className={`w-full text-left px-6 py-4 transition-colors ${
                    selectedOrder?.id === order.id ? 'bg-terra/5' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-dark">{order.customerName}</p>
                      <p className="text-xs text-gray-400 mt-1">{order.phone} · {formatDate(order.createdAt)}</p>
                      {order.orderNumber && <p className="text-xs text-terra mt-2 font-medium">{order.orderNumber}</p>}
                      <p className="text-xs text-gray-500 mt-2">
                        {order.items.reduce((sum, item) => sum + item.qty, 0)} item(s) · {order.deliveryMode === 'pickup' ? 'Studio pickup' : 'Home delivery'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-terra">{formatCedi(order.total)}</p>
                      <div className="mt-2">
                        <StatusPill status={order.status} />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {!selectedOrder ? (
            <div className="px-6 py-14 text-center">
              <p className="text-3xl mb-2">🧾</p>
              <p className="text-sm text-gray-400">Select an order to view its details.</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-dark">{selectedOrder.customerName}</p>
                    <p className="text-xs text-gray-400 mt-1">Order ID: {selectedOrder.id}</p>
                    {selectedOrder.orderNumber && <p className="text-xs text-terra mt-2 font-medium">Tracking No: {selectedOrder.orderNumber}</p>}
                  </div>
                  <StatusPill status={selectedOrder.status} />
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Status</p>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateOrder(selectedOrder.id, { status: e.target.value as OrderStatus })}
                    disabled={savingId === selectedOrder.id}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/10 disabled:opacity-60"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Contact</p>
                  <div className="space-y-1.5 text-sm text-dark">
                    <p>{selectedOrder.phone}</p>
                    {selectedOrder.email && <p>{selectedOrder.email}</p>}
                    <p className="text-gray-500">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Items</p>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={`${item.productId}-${index}`} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-dark">{item.name}</p>
                          <p className="text-gray-400">{item.qty} × {formatCedi(item.price)}</p>
                        </div>
                        <p className="font-semibold text-dark">{formatCedi(item.price * item.qty)}</p>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Total</span>
                      <span className="text-lg font-semibold text-terra">{formatCedi(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Delivery</p>
                  <div className="text-sm text-dark space-y-1.5">
                    <p>{selectedOrder.deliveryMode === 'pickup' ? 'Studio pickup' : 'Home delivery'}</p>
                    {selectedOrder.deliveryInfo?.address && <p>{selectedOrder.deliveryInfo.address}</p>}
                    {selectedOrder.deliveryInfo?.town && (
                      <p>{selectedOrder.deliveryInfo.town}{selectedOrder.deliveryInfo.region ? `, ${selectedOrder.deliveryInfo.region}` : ''}</p>
                    )}
                    {selectedOrder.deliveryInfo?.preferredDate && <p className="text-gray-500">Preferred date: {selectedOrder.deliveryInfo.preferredDate}</p>}
                    {selectedOrder.deliveryInfo?.preferredTime && <p className="text-gray-500">Preferred time: {selectedOrder.deliveryInfo.preferredTime}</p>}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Payment</p>
                  <div className="text-sm text-dark space-y-1.5">
                    {selectedOrder.customerMobileMoneyName && <p>{selectedOrder.customerMobileMoneyName}</p>}
                    {selectedOrder.customerMobileMoneyNumber && <p>{selectedOrder.customerMobileMoneyNumber}</p>}
                    {selectedOrder.transactionId && <p>Txn ID: {selectedOrder.transactionId}</p>}
                    {selectedOrder.amountPaid != null && <p>Amount paid: {formatCedi(selectedOrder.amountPaid)}</p>}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Measurements & Notes</p>
                  <div className="space-y-3">
                    <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-dark min-h-14">
                      {selectedOrder.measurements || 'No measurements provided.'}
                    </div>
                    <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-dark min-h-14">
                      {selectedOrder.notes || 'No customer notes provided.'}
                    </div>
                    <textarea
                      value={selectedOrder.adminNote ?? ''}
                      onChange={(e) =>
                        setOrders((current) =>
                          current.map((order) =>
                            order.id === selectedOrder.id ? { ...order, adminNote: e.target.value } : order,
                          ),
                        )
                      }
                      onBlur={(e) => updateOrder(selectedOrder.id, { adminNote: e.target.value })}
                      placeholder="Add a private admin note for this order"
                      className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm text-dark bg-white min-h-24 focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/10"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </AdminLayout>
  );
}
