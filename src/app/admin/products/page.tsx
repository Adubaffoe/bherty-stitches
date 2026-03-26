'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import AdminGuard from '@/components/AdminGuard';
import { formatCedi } from '@/lib/formatCedi';
import { Product, STATIC_PRODUCTS } from '@/lib/products';

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

export default function AdminProductsPage() {
  const router = useRouter();
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

  async function handleSignOut() {
    await signOut(auth);
    router.replace('/admin/login');
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-ww">
        {/* Admin Nav */}
        <nav className="bg-dark text-cream px-8 py-4 flex items-center justify-between">
          <Link href="/admin" className="font-playfair text-xl">Bherty <span className="text-terra italic">Admin</span></Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-cream/70 hover:text-cream transition-colors">View Site</Link>
            <button onClick={handleSignOut} className="text-sm bg-terra text-white px-4 py-1.5 hover:bg-brown transition-colors">Sign Out</button>
          </div>
        </nav>

        <main className="px-8 md:px-16 py-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-playfair text-3xl text-dark">Products</h2>
            <button
              onClick={() => { setShowForm(true); setForm(EMPTY_FORM); setEditingId(null); }}
              className="bg-terra text-white px-6 py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-brown transition-colors"
            >
              + Add Product
            </button>
          </div>

          {/* Add / Edit Form */}
          {showForm && (
            <form onSubmit={handleSave} className="bg-cream p-8 mb-10 shadow-md">
              <h3 className="font-playfair text-2xl text-dark mb-6">
                {editingId ? 'Edit Product' : 'New Product'}
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <FormField label="Product Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Summer Bloom Dress" />
                <FormField label="Price (GH₵) *" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} placeholder="350" />
                <div className="md:col-span-2">
                  <label className="block text-xs text-muted uppercase tracking-wider mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the dress…" rows={2} className="w-full border border-muted/30 px-3 py-2 text-sm text-dark bg-white focus:outline-none focus:border-terra resize-none" />
                </div>
                <FormField label="Badge (e.g. Bestseller, New)" value={form.badge} onChange={(v) => setForm({ ...form, badge: v })} placeholder="Optional" />
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wider mb-1">Emoji</label>
                  <div className="flex gap-2 flex-wrap">
                    {EMOJIS.map((e) => (
                      <button key={e} type="button" onClick={() => setForm({ ...form, emoji: e })}
                        className={`text-2xl p-1.5 rounded border-2 transition-colors ${form.emoji === e ? 'border-terra' : 'border-transparent hover:border-muted/40'}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wider mb-1">Card Colour</label>
                  <div className="flex gap-2">
                    {COLOR_CLASSES.map((c) => (
                      <button key={c} type="button" onClick={() => setForm({ ...form, colorClass: c })}
                        className={`w-8 h-8 rounded-full border-4 transition-all ${c} ${form.colorClass === c ? 'border-terra scale-110' : 'border-transparent'}`} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wider mb-1">Product Image</label>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-muted/40 px-4 py-3 text-sm text-muted hover:border-terra hover:text-terra transition-colors text-center">
                    {form.imageUrl ? '✓ Image uploaded — click to replace' : '📷 Click to upload image'}
                  </button>
                  {uploadProgress !== null && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted mb-1">
                        <span>Uploading…</span><span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-cream rounded-full h-2 overflow-hidden">
                        <div className="bg-terra h-2 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}
                  {form.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imageUrl} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-muted uppercase tracking-wider">Active (visible in shop)</label>
                  <button type="button" onClick={() => setForm({ ...form, active: !form.active })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${form.active ? 'bg-sage' : 'bg-muted/30'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.active ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button type="submit" disabled={saving || uploadProgress !== null}
                  className="bg-terra text-white px-8 py-3 text-sm font-semibold uppercase tracking-wider hover:bg-brown transition-colors disabled:opacity-60">
                  {saving ? 'Saving…' : editingId ? 'Update Product' : 'Add Product'}
                </button>
                <button type="button" onClick={cancelForm} className="border border-muted/30 text-muted px-6 py-3 text-sm font-semibold uppercase tracking-wider hover:border-terra hover:text-terra transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Product table */}
          {loading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-cream animate-pulse" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-muted/20 text-left">
                    <th className="pb-3 text-xs uppercase tracking-wider text-muted font-semibold">Product</th>
                    <th className="pb-3 text-xs uppercase tracking-wider text-muted font-semibold">Price</th>
                    <th className="pb-3 text-xs uppercase tracking-wider text-muted font-semibold">Badge</th>
                    <th className="pb-3 text-xs uppercase tracking-wider text-muted font-semibold">Status</th>
                    <th className="pb-3 text-xs uppercase tracking-wider text-muted font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-cream hover:bg-cream/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 flex items-center justify-center text-lg rounded flex-shrink-0 ${p.colorClass}`}>
                            {p.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded" />
                            ) : p.emoji}
                          </div>
                          <div>
                            <p className="font-semibold text-dark">{p.name}</p>
                            <p className="text-xs text-muted line-clamp-1">{p.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 font-playfair text-terra font-bold">{formatCedi(p.price)}</td>
                      <td className="py-4">
                        {p.badge ? <span className="text-[10px] bg-terra/10 text-terra px-2 py-1 uppercase tracking-wider">{p.badge}</span> : <span className="text-muted text-xs">—</span>}
                      </td>
                      <td className="py-4">
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-1 ${p.active ? 'bg-sage/20 text-sage' : 'bg-muted/20 text-muted'}`}>
                          {p.active ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-3">
                          <button onClick={() => startEdit(p)} className="text-terra hover:text-brown text-xs font-semibold uppercase tracking-wider transition-colors">Edit</button>
                          <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold uppercase tracking-wider transition-colors">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}

function FormField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-muted uppercase tracking-wider mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-muted/30 px-3 py-2 text-sm text-dark bg-white focus:outline-none focus:border-terra" />
    </div>
  );
}
