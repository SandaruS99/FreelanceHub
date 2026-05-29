'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Save, Loader2, Plus, Trash2, Calendar, Send, X, MessageCircle, Palette, FileText } from 'lucide-react';
import { InvoicePDF } from '@/components/InvoicePDF';

const PDFViewer = dynamic(() => import('@react-pdf/renderer').then(mod => mod.PDFViewer), {
    ssr: false,
    loading: () => <div className="h-full w-full min-h-[600px] animate-pulse bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-500">Loading Preview...</div>
});

// Map ISO currency codes to their display symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', LKR: 'Rs', INR: '₹',
    AUD: 'A$', CAD: 'C$', SGD: 'S$', JPY: '¥', CNY: '¥',
    AED: 'AED', PKR: 'Rs', BDT: '৳', MYR: 'RM', THB: '฿',
};
function getCurrencySymbol(code: string): string {
    return CURRENCY_SYMBOLS[code] ?? code;
}

interface Client {
    _id: string;
    name: string;
    email?: string;
    company?: string;
    whatsapp?: string;
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
    const { data: session } = useSession();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [clients, setClients] = useState<Client[]>([]);

    const [showSendModal, setShowSendModal] = useState(false);
    const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);
    const [createdInvoicePublicToken, setCreatedInvoicePublicToken] = useState<string | null>(null);
    const [sendingEmail, setSendingEmail] = useState(false);

    // Default dates: issue today, due in 14 days
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
        currency: 'USD',
        template: 'modern',
    });

    useEffect(() => {
        if (session?.user?.currency) {
            setForm(f => ({ ...f, currency: session.user.currency! }));
        }
    }, [session]);

    const [items, setItems] = useState<LineItem[]>([
        { id: crypto.randomUUID(), description: '', quantity: 1, rate: 0 }
    ]);

    useEffect(() => {
        fetch('/api/clients')
            .then((res) => res.json())
            .then((data) => setClients(data.clients || []))
            .catch((err) => console.error(err));
    }, []);

    const currencySymbol = getCurrencySymbol(form.currency);
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

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxAmount = subtotal * (form.taxRate / 100);
    const total = subtotal + taxAmount - form.discount;

    // Create a mock invoice object for the live preview
    const selectedClient = clients.find(c => c._id === form.clientId);
    const previewInvoice = {
        freelancerId: session?.user ? {
            name: session.user.name,
            email: session.user.email,
            businessName: (session.user as any).businessName || '',
            businessAddress: (session.user as any).businessAddress || '',
            phone: (session.user as any).phone || '',
            website: (session.user as any).website || '',
        } : {},
        clientId: selectedClient || { name: 'Client Name', company: 'Company LLC', email: 'client@example.com' },
        invoiceNumber: 'INV-XXXX',
        issueDate: form.issueDate,
        dueDate: form.dueDate,
        currency: form.currency,
        lineItems: items.map(i => ({
            description: i.description || 'Item Description',
            quantity: i.quantity || 1,
            unitPrice: i.rate || 0
        })),
        subtotal: subtotal,
        taxTotal: taxAmount,
        discount: form.discount,
        total: Math.max(0, total),
        notes: form.notes,
        template: form.template,
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.clientId) {
            setError('Please select a client');
            return;
        }

        const validItems = items.filter(i => i.description.trim() !== '');
        if (validItems.length === 0) {
            setError('Please add at least one line item with a description');
            return;
        }

        setLoading(true);
        setError('');

        const payload = {
            ...form,
            discountType: 'fixed',
            lineItems: validItems.map(i => ({
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.rate,
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
            setCreatedInvoicePublicToken(data.invoice.publicToken);
            setShowSendModal(true);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async () => {
        if (!createdInvoiceId) return;
        setSendingEmail(true);
        try {
            await fetch(`/api/invoices/${createdInvoiceId}/send`, { method: 'POST' });
        } catch (error) {
            console.error('Failed to send email:', error);
        } finally {
            router.push('/dashboard/invoices');
            router.refresh();
        }
    };

    const handleSendWhatsApp = () => {
        if (!createdInvoicePublicToken || !form.clientId) return;
        
        const client = clients.find(c => c._id === form.clientId);
        const payUrl = `${window.location.origin}/preview/invoice/${createdInvoicePublicToken}/pay`;
        const pdfUrl = `${window.location.origin}/api/public/invoices/${createdInvoicePublicToken}/download`;
        
        const message = encodeURIComponent(
            `*Hello ${client?.name || 'there'}*, 👋\n\n` +
            `Your invoice is ready! You can view and securely pay it here:\n\n` +
            `💳 *Payment Link:* ${payUrl}\n` +
            `📄 *Download PDF:* ${pdfUrl}\n\n` +
            `Thank you for your business!`
        );
        
        let targetUrl = '';
        if (client?.whatsapp) {
            let cleanNumber = client.whatsapp.replace(/\D/g, '');
            if (cleanNumber.startsWith('0') && cleanNumber.length === 10) {
                cleanNumber = '94' + cleanNumber.substring(1);
            }
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            targetUrl = isMobile
                ? `https://wa.me/${cleanNumber}?text=${message}`
                : `https://web.whatsapp.com/send?phone=${cleanNumber}&text=${message}`;
        } else {
            targetUrl = `https://wa.me/?text=${message}`;
        }
        
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.setAttribute('download', `Invoice-${createdInvoicePublicToken}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.open(targetUrl, '_blank');
        
        router.push('/dashboard/invoices');
        router.refresh();
    };

    const handleSkipEmail = () => {
        router.push('/dashboard/invoices');
        router.refresh();
    };

    return (
        <div className="w-full pb-12 max-w-[1600px] mx-auto">
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
                        <p className="text-slate-400 text-sm mt-1">Draft a new invoice to send to your client.</p>
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                {/* Main Builder Area */}
                <div className="space-y-6">
                    {/* Template Selection */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-6 border-b border-white/5 pb-4 flex items-center gap-2">
                            <Palette className="w-5 h-5 text-purple-400" /> Choose a Template
                        </h2>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: 'modern', label: 'Modern', desc: 'Sleek with accents' },
                                { id: 'classic', label: 'Classic', desc: 'Traditional B&W' },
                                { id: 'minimal', label: 'Minimal', desc: 'Clean & airy' }
                            ].map(tpl => (
                                <button
                                    key={tpl.id}
                                    onClick={() => updateForm('template', tpl.id)}
                                    className={`p-4 rounded-xl border text-left transition-all ${form.template === tpl.id 
                                        ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                >
                                    <h3 className={`font-bold ${form.template === tpl.id ? 'text-purple-300' : 'text-white'}`}>{tpl.label}</h3>
                                    <p className="text-xs text-slate-400 mt-1">{tpl.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

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
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Initial Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => updateForm('status', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                >
                                    <option value="draft" className="bg-slate-800">Draft (Not Sent)</option>
                                    <option value="sent" className="bg-slate-800">Sent to Client</option>
                                    <option value="paid" className="bg-slate-800">Already Paid</option>
                                </select>
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
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                            <h2 className="text-lg font-semibold text-white">Line Items</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">Currency:</span>
                                <span className="px-2 py-1 bg-white/10 rounded text-xs font-bold text-white">{form.currency} ({currencySymbol})</span>
                            </div>
                        </div>

                        {/* Table Header */}
                        <div className="hidden sm:grid grid-cols-12 gap-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
                            <div className="col-span-6">Description</div>
                            <div className="col-span-2 text-right">Qty</div>
                            <div className="col-span-3 text-right">Rate</div>
                            <div className="col-span-1"></div>
                        </div>

                        <div className="space-y-3 mb-4">
                            {items.map((item) => (
                                <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center bg-white/[0.02] p-3 sm:p-2 sm:bg-transparent rounded-xl border border-white/5 sm:border-transparent">
                                    <div className="sm:col-span-6">
                                        <label className="sm:hidden block text-xs font-medium text-slate-400 mb-1">Description</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., UI/UX Design"
                                            value={item.description}
                                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 sm:col-span-5 gap-3 sm:gap-4">
                                        <div>
                                            <label className="sm:hidden block text-xs font-medium text-slate-400 mb-1">Quantity</label>
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
                                            <label className="sm:hidden block text-xs font-medium text-slate-400 mb-1">Rate ({currencySymbol})</label>
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
                                    <div className="sm:col-span-1 flex justify-end sm:justify-center">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            disabled={items.length === 1}
                                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    placeholder="Payment instructions or thank you note..."
                                />
                            </div>

                            {/* Totals Box */}
                            <div className="bg-slate-900 rounded-xl p-5 border border-white/5">
                                <div className="flex justify-between items-center mb-3 text-sm">
                                    <span className="text-slate-400">Subtotal</span>
                                    <span className="text-white">{currencySymbol}{subtotal.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between items-center mb-3 text-sm group">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        Tax (%)
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={form.taxRate}
                                        onChange={(e) => updateForm('taxRate', parseFloat(e.target.value) || 0)}
                                        className="w-20 text-right bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>

                                <div className="flex justify-between items-center mb-4 text-sm">
                                    <span className="text-slate-400">Discount ({currencySymbol})</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.discount}
                                        onChange={(e) => updateForm('discount', parseFloat(e.target.value) || 0)}
                                        className="w-24 text-right bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                                    <span className="text-base font-semibold text-white">Total Amount</span>
                                    <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                                        {currencySymbol}{Math.max(0, total).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live PDF Preview */}
                <div className="sticky top-24 h-[calc(100vh-140px)] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-white flex flex-col">
                    <div className="bg-slate-900 px-4 py-3 border-b border-white/10 flex items-center gap-2 shrink-0">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <h3 className="text-sm font-semibold text-white">Live PDF Preview</h3>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded ml-2">Beta</span>
                    </div>
                    <div className="flex-1 w-full relative bg-[#525659]">
                        <PDFViewer width="100%" height="100%" className="border-0">
                            <InvoicePDF invoice={previewInvoice} />
                        </PDFViewer>
                    </div>
                </div>
            </div>

            {/* Send Invoice Modal */}
            {showSendModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={handleSkipEmail}
                            className="absolute right-4 top-4 text-slate-500 hover:text-white transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-5 mx-auto">
                            <Send className="w-6 h-6 text-green-400" />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 text-center">Invoice Saved!</h3>
                        <p className="text-slate-400 text-sm text-center mb-6">
                            Would you like to email this invoice to the client immediately?
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleSendEmail}
                                disabled={sendingEmail}
                                className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium py-2.5 rounded-xl transition disabled:opacity-50"
                            >
                                {sendingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                Send via Email
                            </button>
                            <button
                                onClick={handleSendWhatsApp}
                                disabled={sendingEmail}
                                className="w-full flex justify-center items-center gap-2 bg-[#25D366] hover:bg-[#1ebd5c] text-white font-medium py-2.5 rounded-xl transition shadow-lg shadow-green-500/20"
                            >
                                <MessageCircle className="w-5 h-5" />
                                Send via WhatsApp
                            </button>
                            <button
                                onClick={handleSkipEmail}
                                disabled={sendingEmail}
                                className="w-full flex justify-center items-center bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-2.5 rounded-xl transition"
                            >
                                No, I'll send it later
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
