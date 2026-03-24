'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

// Currency symbols map
const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$', CHF: 'Fr',
    CNY: '¥', SEK: 'kr', NZD: 'NZ$', MXN: '$', SGD: 'S$', HKD: 'HK$',
    NOK: 'kr', KRW: '₩', TRY: '₺', RUB: '₽', INR: '₹', BRL: 'R$',
    ZAR: 'R', DKK: 'kr', PLN: 'zł', TWD: 'NT$', THB: '฿', IDR: 'Rp',
    HUF: 'Ft', CZK: 'Kč', ILS: '₪', PHP: '₱', AED: 'د.إ', SAR: '﷼',
    MYR: 'RM', RON: 'lei', ARS: '$', QAR: 'QR', KWD: 'KD', BHD: 'BD',
    OMR: 'OMR', JOD: 'JD', LKR: '₨', PKR: '₨', NGN: '₦', EGP: '£',
    KES: 'KSh', GHS: 'GH₵', UAH: '₴', VND: '₫',
};

// Module-level cache so we only fetch once per page session
let ratesCache: Record<string, number> | null = null;

export function useCurrency() {
    const { data: session } = useSession();
    const currency = (session?.user as any)?.currency || 'USD';
    const symbol = CURRENCY_SYMBOLS[currency] || currency;

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
        const decimals = opts?.decimals ?? 0;
        return `${symbol}${converted.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        })}`;
    };

    const formatFull = (usdAmount: number) => format(usdAmount, { decimals: 2 });

    return { currency, symbol, rates, convert, format, formatFull };
}

