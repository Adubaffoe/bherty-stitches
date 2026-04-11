export type PublicOrderStatus = 'new' | 'paid' | 'in progress' | 'ready' | 'delivered' | 'cancelled';
export type DeliveryMode = 'delivery' | 'pickup' | null;

export interface PublicTrackingItem {
  name: string;
  qty: number;
}

export interface PublicTrackingRecord {
  orderNumber: string;
  customerName: string;
  status: PublicOrderStatus;
  total: number;
  deliveryMode: DeliveryMode;
  items: PublicTrackingItem[];
  createdAt: unknown;
  updatedAt?: unknown;
}

export function generateOrderNumber() {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BHS-${datePart}-${randomPart}`;
}

export function buildPublicTrackingRecord(input: {
  orderNumber: string;
  customerName: string;
  status: PublicOrderStatus;
  total: number;
  deliveryMode: DeliveryMode;
  items: PublicTrackingItem[];
  createdAt: unknown;
  updatedAt?: unknown;
}): PublicTrackingRecord {
  return {
    orderNumber: input.orderNumber,
    customerName: input.customerName,
    status: input.status,
    total: input.total,
    deliveryMode: input.deliveryMode,
    items: input.items,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}
