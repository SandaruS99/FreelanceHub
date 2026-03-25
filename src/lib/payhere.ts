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

export const PAYHERE_URL = IS_SANDBOX
    ? 'https://sandbox.payhere.lk/pay/checkout'
    : 'https://www.payhere.lk/pay/checkout';

/**
 * Generates MD5 hash for PayHere checkout
 * Formula: UpperCase(MD5(merchant_id + order_id + amount + currency + UpperCase(MD5(merchant_secret))))
 */
export function generatePayHereHash(orderId: string, amount: number, currency: string) {
    const formattedAmount = amount.toFixed(2);
    const secretHash = crypto.createHash('md5').update(MERCHANT_SECRET).digest('hex').toUpperCase();

    const mainString = MERCHANT_ID + orderId + formattedAmount + currency + secretHash;
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
