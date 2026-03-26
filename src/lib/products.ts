export interface Product {
  id: string;
  name: string;
  price: number;
  emoji: string;
  description: string;
  badge?: string;
  colorClass: string;
  active: boolean;
  imageUrl?: string;
}

// Fallback static products used until Firestore is seeded
export const STATIC_PRODUCTS: Product[] = [
  { id: '1', name: 'Summer Bloom Dress', price: 350, emoji: '🌸', description: 'Light and airy crochet summer dress with floral details.', badge: 'Bestseller', colorClass: 'c1', active: true },
  { id: '2', name: 'Garden Maxi Dress', price: 480, emoji: '🌿', description: 'Elegant full-length crochet maxi perfect for any occasion.', badge: 'New', colorClass: 'c2', active: true },
  { id: '3', name: 'Rosette Mini', price: 295, emoji: '🌷', description: 'Charming mini with intricate rosette crochet details.', badge: '', colorClass: 'c3', active: true },
  { id: '4', name: 'Golden Hour Dress', price: 420, emoji: '☀️', description: 'Warm-toned midi dress for golden moments.', badge: 'Popular', colorClass: 'c4', active: true },
  { id: '5', name: 'Ocean Breeze Dress', price: 365, emoji: '🌊', description: 'Cool blue-toned flowing crochet dress.', badge: '', colorClass: 'c5', active: true },
  { id: '6', name: 'Terracotta Dreams', price: 395, emoji: '🍂', description: 'Rich earth-toned crochet beauty with vintage charm.', badge: 'Limited', colorClass: 'c6', active: true },
];
