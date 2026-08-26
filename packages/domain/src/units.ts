type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type Millimetres = Brand<number, "Millimetres">;
export type CurrencyCode = Brand<string, "CurrencyCode">;
export interface Money { readonly amountMinor: number; readonly currency: CurrencyCode; }

export function millimetres(value: number): Millimetres {
  if (!Number.isFinite(value) || value < 0) throw new RangeError("Millimetres must be a finite non-negative value.");
  return value as Millimetres;
}

export function money(amountMinor: number, currency: string): Money {
  if (!Number.isSafeInteger(amountMinor)) throw new TypeError("Money must use integer minor units.");
  const normalized = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) throw new TypeError("Currency must be a three-letter ISO-style code.");
  return { amountMinor, currency: normalized as CurrencyCode };
}
