'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { fetchSettings, StoreSettings, DEFAULT_SETTINGS } from '@/lib/settings';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/AdminLayout';

function SettingField({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/10 transition-all"
      />
      {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-dark">{title}</h3>
      {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings().then((s) => {
      setForm(s);
      setLoading(false);
    });
  }, []);

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

  return (
    <AdminLayout title="Settings">
      <div className="max-w-2xl">
        <p className="text-sm text-gray-400 mb-8">
          Update payment details and store location. Changes apply immediately for new customers.
        </p>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-white rounded-xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">

            {/* Mobile Money section */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <SectionHeader
                title="Mobile Money Payment"
                description="These details are shown to customers at checkout."
              />
              <div className="space-y-4">
                <SettingField
                  label="MoMo Number"
                  value={form.mobileMoneyNumber}
                  onChange={(v) => setForm({ ...form, mobileMoneyNumber: v })}
                  placeholder="0599026434"
                />
                <SettingField
                  label="Account Name"
                  value={form.mobileMoneyName}
                  onChange={(v) => setForm({ ...form, mobileMoneyName: v })}
                  placeholder="Bherty Stitches"
                />
                <SettingField
                  label="Provider / Network"
                  value={form.provider}
                  onChange={(v) => setForm({ ...form, provider: v })}
                  placeholder="MTN Mobile Money"
                />
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                    Payment Instructions
                  </label>
                  <textarea
                    value={form.paymentInstructions}
                    onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })}
                    rows={3}
                    placeholder="Instructions shown to customers before they pay"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/10 transition-all resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Shown to the customer on the payment step.</p>
                </div>
              </div>
            </div>

            {/* Store location section */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <SectionHeader
                title="Store Location"
                description="Shown to customers who choose Studio Pickup at checkout."
              />
              <SettingField
                label="Pickup / Studio Location"
                value={form.storeLocation}
                onChange={(v) => setForm({ ...form, storeLocation: v })}
                placeholder="Prime Apartment and Hotel, Dansoman, Accra"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-terra text-white px-6 py-2.5 text-sm font-medium rounded-lg hover:bg-brown transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>

          </form>
        )}
      </div>
    </AdminLayout>
  );
}
