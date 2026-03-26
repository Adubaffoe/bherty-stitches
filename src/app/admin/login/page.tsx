'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/admin');
    }
  }, [user, loading, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/admin');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* Brand mark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-terra text-white font-playfair font-bold text-2xl mb-4 shadow-lg shadow-terra/20">
            B
          </div>
          <h1 className="font-playfair text-2xl text-dark">
            Bherty <span className="text-terra italic">Admin</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to manage your store</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-terra focus:ring-2 focus:ring-terra/10 transition-all"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
                <span className="text-red-400 flex-shrink-0 mt-0.5">⚠</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="bg-terra text-white py-2.5 text-sm font-medium rounded-lg hover:bg-brown transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
