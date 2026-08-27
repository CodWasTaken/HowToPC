export type SupportedMarket = "US" | "PL";

export const MARKET_STORAGE_KEY = "howtopc-market";

export function marketForLocale(locale: string | null | undefined): SupportedMarket {
  return locale?.toLowerCase().startsWith("pl") ? "PL" : "US";
}

export function currencyForMarket(market: SupportedMarket): "USD" | "PLN" {
  return market === "PL" ? "PLN" : "USD";
}

export function normalizeMarket(value: string | null | undefined): SupportedMarket | null {
  return value === "US" || value === "PL" ? value : null;
}
