import { QuotationTotalInvalidError } from "./quotation.errors.ts";

/** BHD uses 3 decimal places; all authoritative amounts are stored as integer fils. */
export const FILS_PER_BHD = 1000;

export type MoneyFils = number;
export type QuantityMilli = number;

function assertFiniteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new QuotationTotalInvalidError(`${label} must be a non-negative finite number.`);
  }
}

/**
 * Parse a decimal amount (string or number) into integer fils.
 * Rejects negative values, non-finite values, and more than 3 decimal places.
 */
export function parseMoney(value: string | number): MoneyFils {
  const raw = typeof value === "number" ? String(value) : value.trim();
  if (raw.length === 0) {
    throw new QuotationTotalInvalidError("Amount is required.");
  }
  if (!/^\d+(\.\d+)?$/.test(raw)) {
    throw new QuotationTotalInvalidError("Amount must be a non-negative decimal.");
  }

  const [intPart, decPart = ""] = raw.split(".");
  if (decPart.length > 3) {
    throw new QuotationTotalInvalidError("Amount cannot have more than 3 decimal places.");
  }

  const fils = Number(intPart) * FILS_PER_BHD + Number(decPart.padEnd(3, "0"));
  assertFiniteNonNegative(fils, "Amount");
  return fils;
}

/** Parse quantity with the same precision rules as money (max 3 dp, must be > 0). */
export function parseQuantity(value: string | number): QuantityMilli {
  const raw = typeof value === "number" ? String(value) : value.trim();
  if (raw.length === 0) {
    throw new QuotationTotalInvalidError("Quantity is required.");
  }
  if (!/^\d+(\.\d+)?$/.test(raw)) {
    throw new QuotationTotalInvalidError("Quantity must be a positive decimal.");
  }

  const [intPart, decPart = ""] = raw.split(".");
  if (decPart.length > 3) {
    throw new QuotationTotalInvalidError("Quantity cannot have more than 3 decimal places.");
  }

  const milli = Number(intPart) * FILS_PER_BHD + Number(decPart.padEnd(3, "0"));
  if (!Number.isFinite(milli) || milli <= 0) {
    throw new QuotationTotalInvalidError("Quantity must be greater than zero.");
  }
  return milli;
}

export function formatMoney(fils: MoneyFils): number {
  assertFiniteNonNegative(fils, "Amount");
  return fils / FILS_PER_BHD;
}

export function formatQuantity(milli: QuantityMilli): number {
  if (!Number.isFinite(milli) || milli <= 0) {
    throw new QuotationTotalInvalidError("Quantity must be greater than zero.");
  }
  return milli / FILS_PER_BHD;
}

function multiplyScaled(quantityMilli: QuantityMilli, unitPriceFils: MoneyFils): MoneyFils {
  return Math.round((quantityMilli * unitPriceFils) / FILS_PER_BHD);
}

export type LineCalculation = {
  quantityMilli: QuantityMilli;
  unitPriceFils: MoneyFils;
  discountFils: MoneyFils;
  taxFils: MoneyFils;
  baseFils: MoneyFils;
  lineTotalFils: MoneyFils;
};

export function calculateLine(input: {
  quantity: string | number;
  unitPrice: string | number;
  discountAmount?: string | number;
  taxAmount?: string | number;
}): LineCalculation {
  const quantityMilli = parseQuantity(input.quantity);
  const unitPriceFils = parseMoney(input.unitPrice);
  const discountFils = input.discountAmount != null
    ? parseMoney(input.discountAmount)
    : 0;
  const taxFils = input.taxAmount != null ? parseMoney(input.taxAmount) : 0;

  const baseFils = multiplyScaled(quantityMilli, unitPriceFils);
  if (discountFils > baseFils) {
    throw new QuotationTotalInvalidError("Line discount cannot exceed line base amount.");
  }

  const lineTotalFils = baseFils - discountFils + taxFils;
  assertFiniteNonNegative(lineTotalFils, "Line total");

  return {
    quantityMilli,
    unitPriceFils,
    discountFils,
    taxFils,
    baseFils,
    lineTotalFils,
  };
}

export type TotalsCalculation = {
  subtotalFils: MoneyFils;
  discountTotalFils: MoneyFils;
  taxTotalFils: MoneyFils;
  grandTotalFils: MoneyFils;
};

export function calculateTotals(
  lines: Array<Pick<LineCalculation, "baseFils" | "discountFils" | "taxFils" | "lineTotalFils">>,
): TotalsCalculation {
  let subtotalFils = 0;
  let discountTotalFils = 0;
  let taxTotalFils = 0;
  let grandTotalFils = 0;

  for (const line of lines) {
    subtotalFils += line.baseFils;
    discountTotalFils += line.discountFils;
    taxTotalFils += line.taxFils;
    grandTotalFils += line.lineTotalFils;
  }

  const expectedGrand = subtotalFils - discountTotalFils + taxTotalFils;
  if (grandTotalFils !== expectedGrand) {
    throw new QuotationTotalInvalidError("Quotation totals are inconsistent.");
  }

  assertFiniteNonNegative(subtotalFils, "Subtotal");
  assertFiniteNonNegative(discountTotalFils, "Discount total");
  assertFiniteNonNegative(taxTotalFils, "Tax total");
  assertFiniteNonNegative(grandTotalFils, "Grand total");

  return { subtotalFils, discountTotalFils, taxTotalFils, grandTotalFils };
}
