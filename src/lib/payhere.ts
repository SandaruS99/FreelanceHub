import crypto from 'crypto';

export interface PayHereParams {
    merchant_id: string;
    return_url: string;
    cancel_url: string;
    notify_url: string;
    order_id: string;
    items: string;
    currency: string;
    amount: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    hash?: string;
}

const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || '';
const MERCHANT_SECRET = process.env.PAYHERE_SECRET || '';
const PAYHERE_MODE = process.env.PAYHERE_MODE || (process.env.NODE_ENV === 'production' ? 'live' : 'sandbox');
const IS_SANDBOX = PAYHERE_MODE !== 'live';

const USD_TO_LKR_RATE = parseFloat(process.env.USD_TO_LKR_RATE || '300');

export const PAYHERE_URL = IS_SANDBOX
    ? 'https://sandbox.payhere.lk/pay/checkout'
    : 'https://www.payhere.lk/pay/checkout';

/**
 * Converts any currency amount to LKR for PayHere
 */
export function convertToLKR(amount: number, fromCurrencyCode: string) {
    if (fromCurrencyCode === 'LKR') return amount;
    // For now, we only handle USD conversion or assume other currencies are USD-equivalent for simpler logic
    // You can add more complex conversion logic here if needed
    return amount * USD_TO_LKR_RATE;
}

/**
 * Generates MD5 hash for PayHere checkout
 * Formula: UpperCase(MD5(merchant_id + order_id + amount + currency + UpperCase(MD5(merchant_secret))))
 */
export function generatePayHereHash(orderId: string, amount: number, currency: string) {
    const formattedAmount = amount.toFixed(2);

    // Clean and prepare the secret. 
    // If it looks like Base64 (starts with Mj for sandbox or similar), we decode it.
    let cleanSecret = MERCHANT_SECRET.trim();
    try {
        if (cleanSecret.endsWith('=') || /^[A-Za-z0-9+/]+={0,2}$/.test(cleanSecret)) {
            // Check if it's actually Base64 by trying to decode it
            const decoded = Buffer.from(cleanSecret, 'base64').toString('utf8');
            // If the decoded version is a valid numeric/alphanumeric string, use it
            if (/^[a-zA-Z0-9]+$/.test(decoded)) {
                cleanSecret = decoded;
            }
        }
    } catch (e) {
        // Fallback to original secret if decoding fails
    }

    const secretHash = crypto.createHash('md5').update(cleanSecret).digest('hex').toUpperCase();

    const mainString = MERCHANT_ID.trim() + orderId + formattedAmount + currency + secretHash;
    console.log('Generating PayHere Hash for:', orderId, 'Amount:', formattedAmount);

    return crypto.createHash('md5').update(mainString).digest('hex').toUpperCase();
}

/**
 * Verifies PayHere IPN Signature
 */
export function verifyPayHereSignature(params: any) {
    const { merchant_id, order_id, payment_id, payhere_amount, payhere_currency, status_code, md5sig } = params;

    const secretHash = crypto.createHash('md5').update(MERCHANT_SECRET).digest('hex').toUpperCase();
    const mainString = merchant_id + order_id + payhere_amount + payhere_currency + status_code + secretHash;
    const expectedSig = crypto.createHash('md5').update(mainString).digest('hex').toUpperCase();

    return expectedSig === md5sig;
}
