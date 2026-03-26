'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import AdminGuard from '@/components/AdminGuard';
import { fetchSettings, StoreSettings, DEFAULT_SETTINGS } from '@/lib/settings';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings().then((s) => {
      setForm(s);
      setLoading(false);
    });
  }, []);

  async function handleSignOut() {
    await signOut(auth);
    router.replace('/admin/login');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'paymentSettings'), {
        ...form,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function field(label: string, key: keyof StoreSettings, placeholder?: string) {
    return (
      <div>
        <label className="block text-xs text-muted uppercase tracking-wider mb-1">{label}</label>
        <input
          type="text"
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full border border-muted/30 px-3 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-terra"
        />
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-ww">
        {/* Admin Nav */}
        <nav className="bg-dark text-cream px-8 py-4 flex items-center justify-between">
          <Link href="/admin" className="font-playfair text-xl">Bherty <span className="text-terra italic">Admin</span></Link>
          <div className="flex items-center gap-6">
            <Link href="/admin/products" className="text-sm text-cream/70 hover:text-cream transition-colors">Products</Link>
            <Link href="/admin/settings" className="text-sm text-cream hover:text-cream transition-colors font-semibold">Settings</Link>
            <Link href="/" className="text-sm text-cream/70 hover:text-cream transition-colors">View Site</Link>
            <button onClick={handleSignOut} className="text-sm bg-terra text-white px-4 py-1.5 hover:bg-brown transition-colors">Sign Out</button>
          </div>
        </nav>

        <main className="px-8 md:px-16 py-10 max-w-2xl">
          <h2 className="font-playfair text-3xl text-dark mb-2">Settings</h2>
          <p className="text-muted text-sm mb-8">Update payment details and store location. Changes take effect immediately for new customers.</p>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-cream animate-pulse" />)}
            </div>
          ) : (
            <form onSubmit={handleSave} className="flex flex-col gap-5">
              <div className="bg-cream p-5">
                <p className="text-xs uppercase tracking-widest text-terra font-semibold mb-4">Mobile Money Payment</p>
                <div className="flex flex-col gap-4">
                  {field('MoMo Number', 'mobileMoneyNumber', '0599026434')}
                  {field('Account Name', 'mobileMoneyName', 'Bherty Stitches')}
                  {field('Provider / Network', 'provider', 'Mobile Money')}
                  <div>
                    <label className="block text-xs text-muted uppercase tracking-wider mb-1">Payment Instructions</label>
                    <textarea
                      value={form.paymentInstructions}
                      onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })}
                      rows={3}
                      className="w-full border border-muted/30 px-3 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-terra resize-none"
                      placeholder="Instructions shown to customers before they pay"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-cream p-5">
                <p className="text-xs uppercase tracking-widest text-terra font-semibold mb-4">Store Location</p>
                {field('Pickup / Studio Location', 'storeLocation', 'Prime Apartment and Hotel, Dansoman, Accra')}
                <p className="text-xs text-muted mt-2">This is shown to customers who choose Studio Pickup.</p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="bg-terra text-white px-8 py-3 text-sm font-semibold uppercase tracking-widest hover:bg-brown transition-colors disabled:opacity-60 self-start"
              >
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </form>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
