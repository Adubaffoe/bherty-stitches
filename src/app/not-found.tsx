import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ww flex flex-col items-center justify-center text-center px-6">
      <span className="text-7xl mb-6">🧶</span>
      <h1 className="font-playfair text-5xl text-dark mb-3">Page Not Found</h1>
      <p className="font-cormorant text-xl text-muted mb-8 max-w-sm">
        The page you're looking for seems to have unravelled. Let's get you back on track.
      </p>
      <Link
        href="/"
        className="bg-terra text-white px-8 py-4 text-sm font-semibold uppercase tracking-widest hover:bg-brown transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
