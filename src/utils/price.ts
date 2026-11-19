export const TAX_RATE = 0.08;

export interface PricedLine {
  unitPrice: number;
  quantity: number;
}

export interface Totals {
  subtotal: number;
  tax: number;
  total: number;
}

// Parses the first money amount in a label such as "$44.99", "$44.99 each" or "Qty: 1 × $44.99"
export function parsePrice(text: string): number {
  const match = text.replace(/,/g, "").match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  if (!match) {
    throw new Error(`Could not parse a price from "${text}"`);
  }
  return Number(match[1]);
}

// Work in integer cents so that sums such as 0.1 + 0.2 never drift
const toCents = (amount: number): number => Math.round(amount * 100);
const fromCents = (cents: number): number => cents / 100;

export function calculateExpectedTotals(lines: PricedLine[], taxRate = TAX_RATE): Totals {
  const subtotalCents = lines.reduce((sum, line) => sum + toCents(line.unitPrice) * line.quantity, 0);
  const taxCents = Math.round(subtotalCents * taxRate);
  return {
    subtotal: fromCents(subtotalCents),
    tax: fromCents(taxCents),
    total: fromCents(subtotalCents + taxCents),
  };
}

export function lineTotal(line: PricedLine): number {
  return fromCents(toCents(line.unitPrice) * line.quantity);
}
