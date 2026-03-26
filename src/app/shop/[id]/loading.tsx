export default function ProductDetailLoading() {
  return (
    <div className="pt-24 pb-20 min-h-screen bg-ww px-8 md:px-16 lg:px-24">
      <div className="flex items-center gap-2 mb-8">
        <div className="h-3 w-12 bg-muted/20 rounded animate-pulse" />
        <div className="h-3 w-2 bg-muted/20 rounded animate-pulse" />
        <div className="h-3 w-16 bg-muted/20 rounded animate-pulse" />
        <div className="h-3 w-2 bg-muted/20 rounded animate-pulse" />
        <div className="h-3 w-24 bg-terra/20 rounded animate-pulse" />
      </div>
      <div className="grid md:grid-cols-2 gap-16 items-start max-w-5xl">
        <div className="aspect-square bg-cream animate-pulse" />
        <div className="flex flex-col gap-4">
          <div className="h-4 w-24 bg-gold/20 rounded animate-pulse" />
          <div className="h-10 w-64 bg-dark/10 rounded animate-pulse" />
          <div className="h-5 w-full bg-muted/15 rounded animate-pulse" />
          <div className="h-5 w-4/5 bg-muted/15 rounded animate-pulse" />
          <div className="h-12 w-40 bg-terra/20 rounded animate-pulse mt-2" />
          <div className="flex gap-4 mt-4">
            <div className="h-10 w-24 bg-cream animate-pulse" />
            <div className="h-10 flex-1 bg-dark/10 animate-pulse" />
          </div>
          <div className="h-10 w-full bg-terra/20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
