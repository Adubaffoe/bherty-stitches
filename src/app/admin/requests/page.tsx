'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AdminLayout from '@/components/admin/AdminLayout';

type FireDate = { toDate: () => Date } | null;
type RequestStatus = 'new' | 'contacted' | 'quoted' | 'in progress' | 'completed' | 'cancelled';

interface CustomRequestRecord {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  description: string;
  budget?: number | null;
  status: RequestStatus;
  adminNote?: string | null;
  createdAt: FireDate;
}

const STATUS_OPTIONS: RequestStatus[] = ['new', 'contacted', 'quoted', 'in progress', 'completed', 'cancelled'];

function formatDate(date: FireDate) {
  return date?.toDate().toLocaleString() ?? 'No date';
}

function StatusPill({ status }: { status: RequestStatus }) {
  const styles: Record<RequestStatus, string> = {
    new: 'bg-gold/15 text-gold',
    contacted: 'bg-blue-100 text-blue-700',
    quoted: 'bg-violet-100 text-violet-700',
    'in progress': 'bg-sage/15 text-sage',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-600',
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-[#eadfd3] bg-white p-6 shadow-[0_18px_50px_rgba(42,26,20,0.05)]">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted mb-3">{label}</p>
      <p className="font-playfair text-4xl text-dark">{value}</p>
    </div>
  );
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<CustomRequestRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function fetchRequests() {
    try {
      const snap = await getDocs(query(collection(db, 'customRequests'), orderBy('createdAt', 'desc')));
      const rows = snap.docs.map((item) => ({ id: item.id, ...item.data() } as CustomRequestRecord));
      setRequests(rows);
      setSelectedId((current) => current ?? rows[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesSearch =
        term.length === 0 ||
        request.name.toLowerCase().includes(term) ||
        request.phone.toLowerCase().includes(term) ||
        request.description.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [requests, search, statusFilter]);

  const selectedRequest =
    filteredRequests.find((request) => request.id === selectedId) ??
    requests.find((request) => request.id === selectedId) ??
    filteredRequests[0] ??
    null;

  async function updateRequest(requestId: string, patch: Partial<CustomRequestRecord>) {
    setSavingId(requestId);
    try {
      await updateDoc(doc(db, 'customRequests', requestId), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
      setRequests((current) =>
        current.map((request) => (request.id === requestId ? { ...request, ...patch } : request)),
      );
    } finally {
      setSavingId(null);
    }
  }

  const activeRequests = requests.filter((request) => !['completed', 'cancelled'].includes(request.status)).length;

  return (
    <AdminLayout title="Custom Requests">
      <section className="rounded-[2rem] border border-[#e6d9cb] bg-[linear-gradient(135deg,#fffaf5_0%,#f6ede4_100%)] px-8 py-8 mb-8 shadow-[0_20px_60px_rgba(42,26,20,0.06)]">
        <p className="text-[10px] font-semibold text-terra uppercase tracking-[0.28em] mb-3">Client Pipeline</p>
        <h2 className="font-playfair text-4xl text-dark mb-3">A clearer view of custom enquiries</h2>
        <p className="max-w-2xl text-sm text-muted leading-relaxed">
          Keep bespoke requests organized, polished, and easy to move from first message to confirmed work.
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <MetricCard label="Total Requests" value={requests.length} accent="bg-gradient-to-r from-terra to-gold" />
        <MetricCard label="Active Pipeline" value={activeRequests} accent="bg-gradient-to-r from-sage to-[#9ab38a]" />
        <MetricCard label="New Requests" value={requests.filter((request) => request.status === 'new').length} accent="bg-gradient-to-r from-gold to-[#e0bf73]" />
      </div>

      <div className="grid xl:grid-cols-[1.15fr_0.95fr] gap-6">
        <section className="rounded-[1.75rem] border border-[#e6d9cb] bg-white overflow-hidden shadow-[0_18px_45px_rgba(42,26,20,0.05)]">
          <div className="px-6 py-5 border-b border-[#f1e7dc] bg-[#fffaf5]">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone, or request details"
                className="flex-1 border border-[#e4d5c7] rounded-2xl px-4 py-3 text-sm text-dark focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/10"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | RequestStatus)}
                className="border border-[#e4d5c7] rounded-2xl px-4 py-3 text-sm text-dark bg-white focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/10"
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
          ) : filteredRequests.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-3xl mb-2">✂️</p>
              <p className="text-sm text-gray-400">No requests matched your filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f5ece2]">
              {filteredRequests.map((request) => (
                <button
                  key={request.id}
                  onClick={() => setSelectedId(request.id)}
                  className={`w-full text-left px-6 py-4 transition-colors ${
                    selectedRequest?.id === request.id ? 'bg-terra/5' : 'hover:bg-[#fffaf5]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-dark">{request.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{request.phone} · {formatDate(request.createdAt)}</p>
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{request.description}</p>
                    </div>
                    <div className="text-right">
                      {request.budget != null && <p className="text-sm font-semibold text-terra">GH₵ {request.budget}</p>}
                      <div className="mt-2">
                        <StatusPill status={request.status} />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-[1.75rem] border border-[#e6d9cb] bg-white overflow-hidden shadow-[0_18px_45px_rgba(42,26,20,0.05)]">
          {!selectedRequest ? (
            <div className="px-6 py-14 text-center">
              <p className="text-3xl mb-2">🧵</p>
              <p className="text-sm text-gray-400">Select a request to view its details.</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-5 border-b border-[#f1e7dc] bg-[#fffaf5]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-playfair text-2xl text-dark">{selectedRequest.name}</p>
                    <p className="text-xs text-gray-400 mt-1">Request ID: {selectedRequest.id}</p>
                  </div>
                  <StatusPill status={selectedRequest.status} />
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Status</p>
                  <select
                    value={selectedRequest.status}
                    onChange={(e) => updateRequest(selectedRequest.id, { status: e.target.value as RequestStatus })}
                    disabled={savingId === selectedRequest.id}
                    className="w-full border border-[#e4d5c7] rounded-2xl px-4 py-3 text-sm text-dark bg-white focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/10 disabled:opacity-60"
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
                    <p>{selectedRequest.phone}</p>
                    {selectedRequest.email && <p>{selectedRequest.email}</p>}
                    <p className="text-gray-500">{formatDate(selectedRequest.createdAt)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Request Details</p>
                  <div className="rounded-2xl bg-[#faf4ee] px-4 py-4 text-sm text-dark leading-relaxed whitespace-pre-wrap border border-[#f1e7dc]">
                    {selectedRequest.description}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Budget</p>
                  <div className="rounded-2xl bg-[#faf4ee] px-4 py-4 text-sm text-dark border border-[#f1e7dc]">
                    {selectedRequest.budget != null ? `GH₵ ${selectedRequest.budget}` : 'No budget provided'}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Private Admin Note</p>
                  <textarea
                    value={selectedRequest.adminNote ?? ''}
                    onChange={(e) =>
                      setRequests((current) =>
                        current.map((request) =>
                          request.id === selectedRequest.id ? { ...request, adminNote: e.target.value } : request,
                        ),
                      )
                    }
                    onBlur={(e) => updateRequest(selectedRequest.id, { adminNote: e.target.value })}
                    placeholder="Add a note about measurements, quote progress, or follow-up"
                    className="w-full border border-[#e4d5c7] rounded-2xl px-4 py-3 text-sm text-dark bg-white min-h-28 focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/10"
                  />
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </AdminLayout>
  );
}
