export default function ShopLoading() {
  return (
    <div className="pt-24 pb-20 bg-cream min-h-screen px-8 md:px-16 lg:px-24">
      {/* Header skeleton */}
      <div className="mb-12">
        <div className="h-3 w-32 bg-terra/20 rounded mb-4 animate-pulse" />
        <div className="h-12 w-72 bg-dark/10 rounded mb-2 animate-pulse" />
        <div className="h-5 w-56 bg-muted/20 rounded animate-pulse" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-ww overflow-hidden">
            <div className="h-64 bg-cream animate-pulse" />
            <div className="p-5 flex flex-col gap-3">
              <div className="h-3 w-20 bg-gold/20 rounded animate-pulse" />
              <div className="h-5 w-40 bg-dark/10 rounded animate-pulse" />
              <div className="h-3 w-full bg-muted/15 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-muted/15 rounded animate-pulse" />
              <div className="flex justify-between items-center pt-1">
                <div className="h-7 w-24 bg-terra/20 rounded animate-pulse" />
                <div className="h-8 w-28 bg-dark/10 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
