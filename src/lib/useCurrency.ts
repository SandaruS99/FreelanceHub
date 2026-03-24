'use client';

import { useSession } from 'next-auth/react';

// Currency symbols map
const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$', CHF: 'Fr',
    CNY: '¥', SEK: 'kr', NZD: 'NZ$', MXN: '$', SGD: 'S$', HKD: 'HK$',
    NOK: 'kr', KRW: '₩', TRY: '₺', RUB: '₽', INR: '₹', BRL: 'R$',
    ZAR: 'R', DKK: 'kr', PLN: 'zł', TWD: 'NT$', THB: '฿', IDR: 'Rp',
    HUF: 'Ft', CZK: 'Kč', ILS: '₪', PHP: '₱', AED: 'AED', SAR: 'SAR',
    MYR: 'RM', RON: 'lei', ARS: '$', QAR: 'QAR', KWD: 'KD', BHD: 'BD',
    OMR: 'OMR', JOD: 'JD', LKR: '₨', PKR: '₨', NGN: '₦', EGP: '£',
    KES: 'KSh', GHS: 'GH₵', UAH: '₴', VND: '₫',
};

export function useCurrency() {
    const { data: session } = useSession();
    const currency = (session?.user as any)?.currency || 'USD';
    const symbol = CURRENCY_SYMBOLS[currency] || currency;

    const format = (amount: number, opts?: { decimals?: number }) => {
        const decimals = opts?.decimals ?? 0;
        return `${symbol}${amount.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        })}`;
    };

    const formatFull = (amount: number) => format(amount, { decimals: 2 });

    return { currency, symbol, format, formatFull };
}
