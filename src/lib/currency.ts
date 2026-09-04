// Live Currency Conversion Service with in-memory caching and resilient fallbacks

export interface ExchangeRatesResponse {
  base: string;
  ratesToInr: Record<string, number>;
  lastUpdated: string;
  source: string;
}

// Fallback rates if external exchange API is temporarily unreachable
export const FALLBACK_RATES_TO_INR: Record<string, number> = {
  INR: 1,
  USD: 87.5,
  EUR: 94.2,
  GBP: 111.8,
  AED: 23.82,
  CAD: 63.8,
  AUD: 56.4,
  SGD: 65.5,
  NZD: 51.2,
  JPY: 0.58,
  CHF: 98.4,
  CNY: 12.1
};

let cachedRates: Record<string, number> = { ...FALLBACK_RATES_TO_INR };
let lastFetchedTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

/**
 * Fetch latest live exchange rates against INR (Indian Rupee)
 */
export async function getLiveExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (now - lastFetchedTime < CACHE_TTL_MS && Object.keys(cachedRates).length > 1) {
    return cachedRates;
  }

  try {
    // Free open exchange rate API with no key required
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch("https://open.er-api.com/v6/latest/INR", {
      signal: controller.signal,
      next: { revalidate: 3600 }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        // data.rates gives how much 1 INR is in other currencies (e.g., USD: 0.0114)
        // We convert to: How much 1 Foreign Currency is in INR (e.g., 1 USD = 1 / 0.0114 = 87.7 INR)
        const updated: Record<string, number> = { INR: 1 };
        for (const [curr, val] of Object.entries(data.rates)) {
          const numVal = Number(val);
          if (numVal > 0) {
            updated[curr.toUpperCase()] = +(1 / numVal).toFixed(4);
          }
        }
        cachedRates = updated;
        lastFetchedTime = now;
        return cachedRates;
      }
    }
  } catch (err) {
    console.warn("Could not fetch live currency rates from open.er-api.com, trying backup...", err);
  }

  // Secondary Backup API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && data.rates.INR) {
        const usdToInr = Number(data.rates.INR);
        const updated: Record<string, number> = { INR: 1, USD: usdToInr };
        for (const [curr, val] of Object.entries(data.rates)) {
          const numVal = Number(val);
          if (numVal > 0) {
            // 1 USD = numVal CURR => 1 CURR = usdToInr / numVal INR
            updated[curr.toUpperCase()] = +(usdToInr / numVal).toFixed(4);
          }
        }
        cachedRates = updated;
        lastFetchedTime = now;
        return cachedRates;
      }
    }
  } catch (err) {
    console.warn("Could not fetch live currency rates from secondary API, using fallback rates:", err);
  }

  return cachedRates;
}

/**
 * Convert any amount from source currency to INR using latest rates
 */
export async function convertToInrLive(amount: number, sourceCurrency = "INR"): Promise<number> {
  const rates = await getLiveExchangeRates();
  const code = (sourceCurrency || "INR").toUpperCase();
  const rate = rates[code] || FALLBACK_RATES_TO_INR[code] || 1;
  return amount * rate;
}

/**
 * Synchronous convert using cached/fallback rates
 */
export function convertToInrSync(amount: number, sourceCurrency = "INR"): number {
  const code = (sourceCurrency || "INR").toUpperCase();
  const rate = cachedRates[code] || FALLBACK_RATES_TO_INR[code] || 1;
  return amount * rate;
}
