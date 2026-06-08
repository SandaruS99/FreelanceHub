export const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$', CHF: 'Fr',
    CNY: '¥', SEK: 'kr', NZD: 'NZ$', MXN: '$', SGD: 'S$', HKD: 'HK$',
    NOK: 'kr', KRW: '₩', TRY: '₺', RUB: '₽', INR: '₹', BRL: 'R$',
    ZAR: 'R', DKK: 'kr', PLN: 'zł', TWD: 'NT$', THB: '฿', IDR: 'Rp',
    HUF: 'Ft', CZK: 'Kč', ILS: '₪', PHP: '₱', AED: 'د.إ', SAR: '﷼',
    MYR: 'RM', RON: 'lei', ARS: '$', QAR: 'QR', KWD: 'KD', BHD: 'BD',
    OMR: 'OMR', JOD: 'JD', LKR: 'Rs.', PKR: 'Rs.', NGN: '₦', EGP: '£',
    KES: 'KSh', GHS: 'GH₵', UAH: '₴', VND: '₫', BDT: '৳'
};

export function getCurrencySymbol(currency: string): string {
    return CURRENCY_SYMBOLS[currency] ?? currency;
}

export function formatAmount(amount: number, currency: string): string {
    const sym = getCurrencySymbol(currency);
    const space = /^[a-zA-Z.]+$/.test(sym) ? ' ' : '';
    return `${sym}${space}${amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}
