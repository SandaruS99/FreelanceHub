'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { CURRENCY_SYMBOLS, getCurrencySymbol, formatAmount } from './formatCurrency';

export { CURRENCY_SYMBOLS, getCurrencySymbol, formatAmount };

// Module-level cache so we only fetch once per page session
let ratesCache: Record<string, number> | null = null;

export function useCurrency() {
    const { data: session } = useSession();
    const currency = (session?.user as any)?.currency || 'USD';
    const symbol = getCurrencySymbol(currency);

    const [rates, setRates] = useState<Record<string, number>>(ratesCache || { USD: 1 });

    useEffect(() => {
        if (ratesCache) { setRates(ratesCache); return; }
        fetch('/api/exchange-rates')
            .then(res => res.json())
            .then(data => {
                if (data.rates) {
                    ratesCache = data.rates;
                    setRates(data.rates);
                }
            })
            .catch(() => { }); // silently use fallback rate of 1
    }, []);

    /**
     * Convert an amount stored in USD to the user's selected currency.
     */
    const convert = (usdAmount: number): number => {
        const rate = rates[currency] ?? 1;
        return usdAmount * rate;
    };

    const format = (usdAmount: number, opts?: { decimals?: number }) => {
        const converted = convert(usdAmount);
        const decimals = opts?.decimals ?? 2;
        const space = /^[a-zA-Z.]+$/.test(symbol) ? ' ' : '';
        return `${symbol}${space}${converted.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        })}`;
    };

    const formatFull = (usdAmount: number) => format(usdAmount, { decimals: 2 });

    return { currency, symbol, rates, convert, format, formatFull };
}

