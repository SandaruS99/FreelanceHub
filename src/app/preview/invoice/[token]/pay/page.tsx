'use client';

import { useState, useEffect, use } from 'react';
import { Loader2, CreditCard, Building2, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

interface InvoiceData {
    _id: string;
    invoiceNumber: string;
    total: number;
    status: string;
    currency: string;
    freelancer: { name: string; email: string };
    client: { name: string; email: string };
}

export default function PublicPaymentPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const [invoice, setInvoice] = useState<InvoiceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        // We'll create a simple GET route to fetch the invoice securely via its public token
        fetch(`/api/public/invoices/${token}`)
            .then(res => {
                if (!res.ok) throw new Error('Invoice not found or invalid link');
                return res.json();
            })
            .then(data => {
                setInvoice(data.invoice);
                if (data.invoice.status === 'paid') {
                    setIsSuccess(true);
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [token]);

    const handleDownloadPDF = async () => {
        try {
            const res = await fetch(`/api/public/invoices/${token}/download`);
            if (!res.ok) throw new Error('Failed to generate PDF');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Invoice_${invoice?.invoiceNumber || 'Receipt'}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download PDF receipt. Please try again later.');
        }
    };

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('status') === 'success') {
            setIsSuccess(true);
        }
    }, []);

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (paymentMethod === 'bank') {
            // Manual bank transfer mark as "processing" or "paid" manually (existing logic)
            setIsProcessing(true);
            try {
                const res = await fetch(`/api/public/invoices/${token}/pay`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ method: 'Bank Transfer', amount: invoice?.total }),
                });
                if (!res.ok) throw new Error('Failed to mark as paid');
                setIsSuccess(true);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsProcessing(false);
            }
            return;
        }

        // PayHere Flow for Card
        setIsProcessing(true);
        setError('');

        try {
            const res = await fetch('/api/payments/payhere/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'invoice', id: token }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to initialize PayHere checkout');

            const params = data;

            // Create and submit a hidden form to PayHere
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = params.payhere_url || 'https://sandbox.payhere.lk/pay/checkout';

            Object.entries(params).forEach(([key, value]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value as string;
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
        } catch (err: any) {
            setError(err.message || 'Payment initialization failed');
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-slate-400 mb-6">{error || 'This invoice link is invalid or has expired.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-purple-500/30">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                {/* Invoice Summary Side */}
                <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {invoice.freelancer.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Paying</p>
                            <h2 className="text-white font-medium">{invoice.freelancer.name}</h2>
                        </div>
                    </div>

                    <div className="mb-8">
                        <p className="text-slate-400 text-sm mb-1">Invoice #{invoice.invoiceNumber}</p>
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                            ${invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xl text-slate-500 font-normal uppercase">{invoice.currency}</span>
                        </h1>
                    </div>

                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                            <span className="text-slate-400">Billed To</span>
                            <span className="text-white font-medium">{invoice.client.name}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                            <span className="text-slate-400">Status</span>
                            {invoice.status === 'paid' ? (
                                <span className="text-green-400 bg-green-400/10 px-3 py-1 rounded-full font-medium">Paid</span>
                            ) : (
                                <span className="text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full font-medium">Awaiting Payment</span>
                            )}
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-8 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> SSL Secured End-to-End Encryption
                    </p>
                </div>

                {/* Payment Form Side */}
                <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center text-center py-12 animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-500/10">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
                            <p className="text-slate-400 mb-8">
                                A receipt has been sent to {invoice.client.email}. Thank you for your business.
                            </p>
                            <button
                                onClick={handleDownloadPDF}
                                className="text-purple-400 hover:text-purple-300 transition font-medium text-sm flex items-center gap-2"
                            >
                                Download PDF Receipt <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold text-white mb-6">Complete your payment</h2>

                            {/* Payment Methods */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <button
                                    onClick={() => setPaymentMethod('card')}
                                    className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition ${paymentMethod === 'card' ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                                >
                                    <CreditCard className="w-6 h-6" />
                                    <span className="text-sm font-medium">Card</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('bank')}
                                    className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition ${paymentMethod === 'bank' ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                                >
                                    <Building2 className="w-6 h-6" />
                                    <span className="text-sm font-medium">Bank Transfer</span>
                                </button>
                            </div>

                            <form onSubmit={handlePayment} className="space-y-6">
                                {paymentMethod === 'card' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Card Information</label>
                                            <div className="bg-slate-950 border border-white/10 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 transition">
                                                <input
                                                    type="text"
                                                    placeholder="Card number"
                                                    required
                                                    className="w-full bg-transparent px-4 py-3 text-white placeholder-slate-600 focus:outline-none border-b border-white/10 text-sm"
                                                />
                                                <div className="grid grid-cols-2">
                                                    <input
                                                        type="text"
                                                        placeholder="MM / YY"
                                                        required
                                                        className="w-full bg-transparent px-4 py-3 text-white placeholder-slate-600 focus:outline-none border-r border-white/10 text-sm"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="CVC"
                                                        required
                                                        className="w-full bg-transparent px-4 py-3 text-white placeholder-slate-600 focus:outline-none text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Name on card</label>
                                            <input
                                                type="text"
                                                defaultValue={invoice.client.name}
                                                required
                                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'bank' && (
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <h3 className="text-blue-400 font-medium mb-3 text-sm flex items-center gap-2">
                                            <Building2 className="w-4 h-4" /> Bank Account Details
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Bank Name</span>
                                                <span className="text-white font-medium">Chase Bank</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Account Name</span>
                                                <span className="text-white font-medium">{invoice.freelancer.name}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400">Account Number</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-bold font-mono">**** 5678</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400">Routing Number</span>
                                                <span className="text-white font-bold font-mono">121000248</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-blue-500/20">
                                            <p className="text-xs text-blue-300 leading-relaxed">
                                                By clicking below, you confirm that you have transferred the funds to the account detailed above.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl transition shadow-lg shadow-purple-500/25 disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" /> Processing Payment...
                                        </>
                                    ) : (
                                        <>
                                            Pay ${(invoice.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>

            <div className="mt-12 text-center text-sm text-slate-500">
                <p>Powered by <span className="text-white font-medium tracking-tight">FreelanceHub</span></p>
            </div>
        </div>
    );
}
