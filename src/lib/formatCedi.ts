/**
 * Formats a number as Ghanaian Cedi currency.
 * e.g. 1500 → "GH₵ 1,500.00"
 */
export function formatCedi(amount: number): string {
  return `GH₵ ${amount.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
