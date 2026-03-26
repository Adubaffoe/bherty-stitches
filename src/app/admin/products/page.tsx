'use client';

import { useState, useEffect, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { formatCedi } from '@/lib/formatCedi';
import { Product, STATIC_PRODUCTS } from '@/lib/products';
import AdminLayout from '@/components/admin/AdminLayout';

const COLOR_CLASSES = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
const EMOJIS = ['🌸', '🌿', '🌷', '☀️', '🌊', '🍂', '🦋', '🌺', '✨', '🎀'];

interface FormState {
  name: string;
  price: string;
  description: string;
  badge: string;
  emoji: string;
  colorClass: string;
  active: boolean;
  imageUrl: string;
}

const EMPTY_FORM: FormState = {
  name: '', price: '', description: '', badge: '',
  emoji: '🌸', colorClass: 'c1', active: true, imageUrl: '',
};

function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}
function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function IconImage() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}

function FormField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/10 transition-all"
      />
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    try {
      const snap = await getDocs(collection(db, 'products'));
      if (snap.empty) {
        setProducts(STATIC_PRODUCTS);
      } else {
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
      }
    } catch {
      setProducts(STATIC_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(file: File): Promise<string> {
    const path = `products/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);
    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file);
      task.on(
        'state_changed',
        (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        (err) => { setUploadProgress(null); reject(err); },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          setUploadProgress(null);
          resolve(url);
        }
      );
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await handleImageUpload(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch {
      alert('Image upload failed. Please try again.');
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price) { alert('Name and price are required.'); return; }
    setSaving(true);
    try {
      const data = {
        name: form.name,
        price: Number(form.price),
        description: form.description,
        badge: form.badge || null,
        emoji: form.emoji,
        colorClass: form.colorClass,
        active: form.active,
        imageUrl: form.imageUrl || null,
        updatedAt: serverTimestamp(),
      };
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), data);
      } else {
        await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
      }
      setForm(EMPTY_FORM); setEditingId(null); setShowForm(false);
      await fetchProducts();
    } catch {
      alert('Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts((p) => p.filter((x) => x.id !== id));
    } catch {
      alert('Failed to delete product.');
    }
  }

  function startEdit(product: Product) {
    setForm({
      name: product.name,
      price: String(product.price),
      description: product.description,
      badge: product.badge ?? '',
      emoji: product.emoji,
      colorClass: product.colorClass,
      active: product.active,
      imageUrl: product.imageUrl ?? '',
    });
    setEditingId(product.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelForm() {
    setForm(EMPTY_FORM); setEditingId(null); setShowForm(false);
  }

  return (
    <AdminLayout title="Products">

      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-400">{products.length} product{products.length !== 1 ? 's' : ''}</p>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setForm(EMPTY_FORM); setEditingId(null); }}
            className="flex items-center gap-2 bg-terra text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brown transition-colors"
          >
            <span className="text-base leading-none">+</span> Add Product
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 mb-6 overflow-hidden">
          {/* Form header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-dark">
              {editingId ? 'Edit Product' : 'New Product'}
            </h2>
            <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600 transition-colors">
              <IconClose />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6">
            <div className="grid md:grid-cols-2 gap-5">
              <FormField label="Product Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Summer Bloom Dress" />
              <FormField label="Price (GH₵) *" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} placeholder="350" />

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the dress…"
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/10 transition-all resize-none"
                />
              </div>

              <FormField label="Badge (e.g. Bestseller, New)" value={form.badge} onChange={(v) => setForm({ ...form, badge: v })} placeholder="Optional" />

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Emoji</label>
                <div className="flex gap-1.5 flex-wrap">
                  {EMOJIS.map((e) => (
                    <button key={e} type="button" onClick={() => setForm({ ...form, emoji: e })}
                      className={`text-xl p-1.5 rounded-lg border-2 transition-all ${form.emoji === e ? 'border-terra bg-terra/5 scale-110' : 'border-gray-100 hover:border-gray-200'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Card Colour</label>
                <div className="flex gap-2">
                  {COLOR_CLASSES.map((c) => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, colorClass: c })}
                      className={`w-8 h-8 rounded-full border-4 transition-all ${c} ${form.colorClass === c ? 'border-terra scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`} />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Product Image</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-lg px-4 py-4 text-sm text-gray-400 hover:border-terra hover:text-terra transition-all text-center flex flex-col items-center gap-1.5">
                  <IconImage />
                  {form.imageUrl ? 'Image uploaded — click to replace' : 'Click to upload image'}
                </button>
                {uploadProgress !== null && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Uploading…</span><span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-terra h-1.5 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
                {form.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.imageUrl} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded-lg border border-gray-100" />
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active (visible in shop)</label>
                <button type="button" onClick={() => setForm({ ...form, active: !form.active })}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.active ? 'bg-terra' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${form.active ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
              <button type="submit" disabled={saving || uploadProgress !== null}
                className="bg-terra text-white px-6 py-2.5 text-sm font-medium rounded-lg hover:bg-brown transition-colors disabled:opacity-60">
                {saving ? 'Saving…' : editingId ? 'Update Product' : 'Add Product'}
              </button>
              <button type="button" onClick={cancelForm}
                className="border border-gray-200 text-gray-500 px-5 py-2.5 text-sm font-medium rounded-lg hover:border-gray-300 hover:text-gray-700 transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Product table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                  <div className="h-2.5 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Product</th>
                <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Badge</th>
                <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 flex items-center justify-center text-base rounded-lg flex-shrink-0 overflow-hidden ${p.colorClass}`}>
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : p.emoji}
                      </div>
                      <div>
                        <p className="font-medium text-dark">{p.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-terra">{formatCedi(p.price)}</td>
                  <td className="px-6 py-4">
                    {p.badge
                      ? <span className="text-[10px] bg-terra/10 text-terra px-2 py-1 rounded-full uppercase tracking-wider font-medium">{p.badge}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-medium ${p.active ? 'bg-sage/15 text-sage' : 'bg-gray-100 text-gray-400'}`}>
                      {p.active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => startEdit(p)}
                        className="p-2 text-gray-400 hover:text-terra hover:bg-terra/10 rounded-lg transition-all"
                        title="Edit"
                      >
                        <IconEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
