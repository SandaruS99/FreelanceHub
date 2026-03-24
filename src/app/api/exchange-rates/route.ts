import { NextResponse } from 'next/server';

let cachedRates: Record<string, number> | null = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET() {
    try {
        const now = Date.now();
        if (cachedRates && (now - cacheTime) < CACHE_DURATION) {
            return NextResponse.json({ base: 'USD', rates: cachedRates });
        }

        // Frankfurter API - no API key needed, returns rates based on USD
        const res = await fetch('https://api.frankfurter.app/latest?from=USD', {
            next: { revalidate: 3600 } // Next.js cache for 1hr
        });

        if (!res.ok) throw new Error('Failed to fetch exchange rates');

        const data = await res.json();
        // Frankfurter doesn't include USD itself; add it
        const rates: Record<string, number> = { USD: 1, ...data.rates };

        cachedRates = rates;
        cacheTime = now;

        return NextResponse.json({ base: 'USD', rates });
    } catch (error) {
        // Fallback with common approximate rates if API fails
        const fallback: Record<string, number> = {
            USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, AUD: 1.53,
            CAD: 1.36, CHF: 0.88, CNY: 7.24, INR: 83.1, BRL: 4.97,
            MXN: 17.1, SGD: 1.34, HKD: 7.82, SEK: 10.4, NOK: 10.5,
            NZD: 1.63, KRW: 1325, TRY: 32.1, ZAR: 18.7, AED: 3.67,
            SAR: 3.75, QAR: 3.64, KWD: 0.31, BHD: 0.38, OMR: 0.38,
        };
        return NextResponse.json({ base: 'USD', rates: fallback, fallback: true });
    }
}
