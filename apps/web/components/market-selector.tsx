"use client";

import { useEffect } from "react";
import { MARKET_STORAGE_KEY, marketForLocale, normalizeMarket, type SupportedMarket } from "@/lib/market";

export function MarketSelector({ market, onChange }: { market:SupportedMarket; onChange:(market:SupportedMarket)=>void }) {
  useEffect(() => {
    const saved = normalizeMarket(window.localStorage.getItem(MARKET_STORAGE_KEY));
    const resolved = saved ?? marketForLocale(window.navigator.language);
    if (resolved !== market) onChange(resolved);
  }, []);

  function select(next: SupportedMarket) {
    window.localStorage.setItem(MARKET_STORAGE_KEY, next);
    onChange(next);
  }

  return (
    <select className="market-selector" aria-label="Price market" value={market} onChange={(event) => select(event.target.value as SupportedMarket)}>
      <option value="US">United States · USD</option>
      <option value="PL">Poland · PLN</option>
    </select>
  );
}
