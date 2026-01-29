/** Compute totals from line items + overrides */
export function computeTotals(items = [], { discount = 0, tip = 0, taxPct = 0 } = {}) {
  const base = items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 1), 0);
  const taxedBase = Math.max(0, base - Number(discount || 0) + Number(tip || 0));
  const taxAmt = taxedBase * (Number(taxPct || 0) / 100);
  const payable = Math.max(0, taxedBase + taxAmt);
  return {
    baseAmount: round2(base),
    discount: round2(discount),
    tip: round2(tip),
    taxPct: Number(taxPct || 0),
    taxAmt: round2(taxAmt),
    payable: round2(payable)
  };
}
export const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;
