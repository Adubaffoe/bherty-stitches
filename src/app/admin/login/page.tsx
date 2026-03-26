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

  // Redirect if already logged in
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
    <div className="min-h-screen bg-ww flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">🧶</span>
          <h1 className="font-playfair text-3xl text-dark">Bherty <span className="text-terra italic">Admin</span></h1>
          <p className="text-muted text-sm mt-1">Sign in to manage your store</p>
        </div>

        <form onSubmit={handleLogin} className="bg-cream p-8 shadow-lg flex flex-col gap-5">
          <div>
            <label className="block text-xs text-muted uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="w-full border border-muted/30 px-3 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-terra"
            />
          </div>
          <div>
            <label className="block text-xs text-muted uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-muted/30 px-3 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-terra"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="bg-terra text-white py-3 text-sm font-semibold uppercase tracking-widest hover:bg-brown transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
