import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface StoreSettings {
  mobileMoneyNumber: string;
  mobileMoneyName: string;
  paymentInstructions: string;
  provider: string;
  storeLocation: string;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  mobileMoneyNumber: '0599026434',
  mobileMoneyName: 'Bherty Stitches',
  paymentInstructions: 'Send payment via Mobile Money, then enter your transaction details below.',
  provider: 'Mobile Money',
  storeLocation: 'Prime Apartment and Hotel, Dansoman, Accra',
};

export async function fetchSettings(): Promise<StoreSettings> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'paymentSettings'));
    if (snap.exists()) {
      return { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<StoreSettings>) };
    }
  } catch {
    // fall through to defaults
  }
  return DEFAULT_SETTINGS;
}
