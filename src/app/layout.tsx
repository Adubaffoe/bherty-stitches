import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Bherty Stitches — Handcrafted Crochet Dresses',
  description: 'Wearable art for the modern woman. Handcrafted crochet fashion made with love in Kasoa, Ghana.',
  keywords: ['crochet', 'dresses', 'Ghana', 'handcrafted', 'fashion', 'Bherty Stitches'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: '#2a1a14',
                  color: '#fdf8f3',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.875rem',
                },
                success: {
                  iconTheme: { primary: '#8a9e7b', secondary: '#fdf8f3' },
                },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
