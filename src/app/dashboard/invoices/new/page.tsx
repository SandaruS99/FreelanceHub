'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Plus, Trash2, Calendar, FileText, Send, X, MessageCircle } from 'lucide-react';
import { useCurrency } from '@/lib/useCurrency';

interface Client {
    _id: string;
    name: string;
    email?: string;
    company?: string;
}

interface LineItem {
    id: string;
    description: string;
    quantity: number;
    rate: number;
}

function InvoiceForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preSelectedClient = searchParams.get('client');
    const { formatFull, currency: userCurrency, rates } = useCurrency();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [clients, setClients] = useState<Client[]>([]);

    const [showSendModal, setShowSendModal] = useState(false);
    const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

    // Default dates
    const today = new Date().toISOString().split('T')[0];
    const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [form, setForm] = useState({
        clientId: preSelectedClient || '',
        issueDate: today,
        dueDate: twoWeeks,
        status: 'draft',
        taxRate: 0,
        discount: 0,
        notes: 'Thank you for your business!',
    });

    const [items, setItems] = useState<LineItem[]>([
        { id: crypto.randomUUID(), description: '', quantity: 1, rate: 0 }
    ]);

    useEffect(() => {
        fetch('/api/clients')
            .then((res) => res.json())
            .then((data) => setClients(data.clients || []))
            .catch((err) => console.error(err));
    }, []);

    const updateForm = (key: string, value: string | number) => setForm((f) => ({ ...f, [key]: value }));

    const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    };

    const addItem = () => {
        setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 1, rate: 0 }]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter((item) => item.id !== id));
        }
    };

    // Current exchange rate for the user's currency (USD = 1)
    const currentRate = rates[userCurrency] || 1;

    // Calculations (in User's Selected Currency)
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxAmount = subtotal * (form.taxRate / 100);
    const total = subtotal + taxAmount - form.discount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.clientId) {
            setError('Please select a client');
            return;
        }

        const validItems = items.filter(i => i.description.trim() !== '');
        if (validItems.length === 0) {
            setError('Please add at least one line item');
            return;
        }

        setLoading(true);
        setError('');

        // CONVERSION ON SAVE: Convert from User Currency back to USD for DB
        const toUSD = (amount: number) => amount / currentRate;

        const payload = {
            ...form,
            discount: toUSD(form.discount),
            currency: userCurrency,
            discountType: 'fixed',
            lineItems: validItems.map(i => ({
                description: i.description,
                quantity: i.quantity,
                unitPrice: toUSD(i.rate), // Save as USD base
                taxRate: form.taxRate,
            })),
        };

        try {
            const res = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create invoice');
            }

            const data = await res.json();
            setCreatedInvoiceId(data.invoice._id);
            setShowSendModal(true);
        } catch (err: any) {
            setError(err.message || 'Error creating invoice');
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async () => {
        if (!createdInvoiceId) return;
        setSendingEmail(true);
        try {
            const res = await fetch(`/api/invoices/${createdInvoiceId}/send`, { method: 'POST' });
            const data = await res.json();

            // If WhatsApp, open it
            if (data.whatsappUrl) {
                setWhatsappUrl(data.whatsappUrl);
                window.open(data.whatsappUrl, '_blank');
            }

            if (res.ok) {
                // Short delay to let them see it worked
                setTimeout(() => {
                    router.push('/dashboard/invoices');
                    router.refresh();
                }, 1000);
            }
        } catch (error) {
            console.error('Failed to send email:', error);
            router.push('/dashboard/invoices');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleSkipEmail = () => {
        router.push('/dashboard/invoices');
        router.refresh();
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/invoices"
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Create Invoice</h1>
                        <p className="text-slate-400 text-sm mt-1">Draft a new invoice in {userCurrency}.</p>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading || !form.clientId}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl transition shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Invoice
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 transition shrink-0">&times;</button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-6 border-b border-white/5 pb-4">Invoice Details</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Billed To *</label>
                                <select
                                    required
                                    value={form.clientId}
                                    onChange={(e) => updateForm('clientId', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                >
                                    <option value="" disabled className="bg-slate-800 text-slate-500">Select Client</option>
                                    {clients.map(c => <option key={c._id} value={c._id} className="bg-slate-800">{c.name} {c.company ? `(${c.company})` : ''}</option>)}
                                </select>
                            </div>
                            <div className="flex items-end text-sm text-slate-400 pb-2">
                                <p>Invoice currency: <span className="text-purple-400 font-bold">{userCurrency}</span></p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Issue Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="date"
                                        required
                                        value={form.issueDate}
                                        onChange={(e) => updateForm('issueDate', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Due Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="date"
                                        required
                                        value={form.dueDate}
                                        onChange={(e) => updateForm('dueDate', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-6 border-b border-white/5 pb-4">Line Items</h2>

                        <div className="hidden sm:grid grid-cols-12 gap-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
                            <div className="col-span-6">Description</div>
                            <div className="col-span-2 text-right">Qty</div>
                            <div className="col-span-3 text-right">Rate ({userCurrency})</div>
                            <div className="col-span-1"></div>
                        </div>

                        <div className="space-y-3 mb-4">
                            {items.map((item) => (
                                <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center bg-white/[0.02] p-3 sm:p-2 sm:bg-transparent rounded-xl border border-white/5 sm:border-transparent">
                                    <div className="sm:col-span-6">
                                        <label className="sm:hidden block text-xs font-medium text-slate-400 mb-1">Description</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Development Work"
                                            value={item.description}
                                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 sm:col-span-5 gap-3 sm:gap-4">
                                        <div>
                                            <input
                                                type="number"
                                                min="1"
                                                step="0.01"
                                                value={item.quantity || ''}
                                                onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white sm:text-right focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.rate === 0 ? '' : item.rate}
                                                onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                                placeholder="0.00"
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white sm:text-right focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="sm:col-span-1 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            disabled={items.length === 1}
                                            className="p-2 text-slate-500 hover:text-red-400 transition disabled:opacity-20"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={addItem}
                            className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 font-medium px-2 py-1 transition"
                        >
                            <Plus className="w-4 h-4" /> Add Item
                        </button>

                        <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes / Terms</label>
                                <textarea
                                    rows={3}
                                    value={form.notes}
                                    onChange={(e) => updateForm('notes', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                                />
                            </div>

                            <div className="bg-slate-900 rounded-xl p-5 border border-white/5">
                                <div className="flex justify-between items-center mb-3 text-sm">
                                    <span className="text-slate-400">Subtotal</span>
                                    <span className="text-white">{formatFull(subtotal)}</span>
                                </div>

                                <div className="flex justify-between items-center mb-3 text-sm">
                                    <span className="text-slate-400 text-xs">Tax ({form.taxRate}%)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.taxRate}
                                        onChange={(e) => updateForm('taxRate', parseFloat(e.target.value) || 0)}
                                        className="w-16 text-right bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs"
                                    />
                                </div>

                                <div className="flex justify-between items-center mb-4 text-sm">
                                    <span className="text-slate-400 text-xs">Discount ({userCurrency})</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.discount}
                                        onChange={(e) => updateForm('discount', parseFloat(e.target.value) || 0)}
                                        className="w-24 text-right bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs"
                                    />
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                                    <span className="text-base font-semibold text-white">Total</span>
                                    <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                                        {formatFull(Math.max(0, total))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-24">
                        <h2 className="text-lg font-semibold text-white mb-6 border-b border-white/5 pb-4">Settings</h2>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Initial Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => updateForm('status', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                >
                                    <option value="draft" className="bg-slate-800">Draft</option>
                                    <option value="sent" className="bg-slate-800">Sent</option>
                                    <option value="paid" className="bg-slate-800">Paid</option>
                                </select>
                            </div>
                            <div className="pt-4 border-t border-white/5 text-center">
                                <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                                <p className="text-xs text-slate-400">Invoice creation and amounts will be stored in USD background for cross-currency stability, but displayed in <span className="text-white font-bold">{userCurrency}</span>.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Send Invoice Modal */}
            {showSendModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-center">
                        <button onClick={handleSkipEmail} className="absolute right-4 top-4 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>

                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-5 mx-auto">
                            <Send className="w-6 h-6 text-green-400" />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">Invoice Saved!</h3>
                        <p className="text-slate-400 text-sm mb-6">Send this invoice to the client now via Email and WhatsApp?</p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleSendEmail}
                                disabled={sendingEmail}
                                className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium py-2.5 rounded-xl transition disabled:opacity-50"
                            >
                                {sendingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                Send via Email & WA
                            </button>

                            {whatsappUrl && (
                                <Link
                                    href={whatsappUrl}
                                    target="_blank"
                                    className="w-full flex justify-center items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-medium py-2.5 rounded-xl transition"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    Open WhatsApp Again
                                </Link>
                            )}

                            <button
                                onClick={handleSkipEmail}
                                disabled={sendingEmail}
                                className="w-full text-slate-400 hover:text-white text-sm py-2"
                            >
                                Finish Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function NewInvoicePage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>}>
            <InvoiceForm />
        </Suspense>
    );
}
