'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Trash2, Send, Download, CheckCircle, Clock, FileText } from 'lucide-react';
import { useCurrency } from '@/lib/useCurrency';

interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
}

interface Invoice {
    _id: string;
    invoiceNumber: string;
    clientId?: {
        _id: string;
        name: string;
        company?: string;
        email?: string;
        address?: string;
    };
    issueDate: string;
    dueDate: string;
    lineItems: LineItem[];
    subtotal: number;
    taxRate: number;
    taxTotal: number;
    discount: number;
    total: number;
    status: string;
    notes?: string;
    publicToken: string;
}

export default function InvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const { formatFull } = useCurrency();

    useEffect(() => {
        fetch(`/api/invoices/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.invoice) setInvoice(data.invoice);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const handleDownload = () => {
        if (!invoice?.publicToken) return;
        window.open(`/api/public/invoices/${invoice.publicToken}/download`, '_blank');
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this invoice? This cannot be undone.')) return;
        setDeleting(true);
        await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
        router.push('/dashboard/invoices');
        router.refresh();
    };

    const updateStatus = async (newStatus: string) => {
        if (!invoice) return;
        setUpdating(true);
        try {
            const res = await fetch(`/api/invoices/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.invoice) setInvoice(data.invoice);
        } finally {
            setUpdating(false);
        }
    };

    const statusColors: Record<string, string> = {
        draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        paid: 'bg-green-500/20 text-green-400 border-green-500/30',
        overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
        cancelled: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-white mb-2">Invoice Not Found</h2>
                <Link href="/dashboard/invoices" className="text-purple-400 hover:text-purple-300">
                    Back to Invoices
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-12">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/invoices"
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white">Invoice {invoice.invoiceNumber}</h1>
                        <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${statusColors[invoice.status]}`}>
                            {invoice.status}
                        </span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {invoice.status === 'draft' && (
                        <button
                            onClick={() => updateStatus('sent')}
                            disabled={updating}
                            className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-xl transition text-sm font-medium"
                        >
                            {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Mark as Sent
                        </button>
                    )}
                    {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                        <button
                            onClick={() => updateStatus('paid')}
                            disabled={updating}
                            className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 px-4 py-2 rounded-xl transition text-sm font-medium"
                        >
                            {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Mark as Paid
                        </button>
                    )}
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-xl transition text-sm font-medium"
                    >
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 px-4 py-2 rounded-xl transition text-sm font-medium"
                    >
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Delete
                    </button>
                </div>
            </div>

            {/* Invoice Document Preview */}
            <div className="bg-white text-slate-900 rounded-2xl shadow-xl overflow-hidden print:shadow-none">
                <div className="p-8 sm:p-12">

                    {/* Document Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-black tracking-tight text-slate-900">FreelanceHub</span>
                            </div>
                            <h2 className="text-3xl font-light text-slate-400 uppercase tracking-widest mb-2">Invoice</h2>
                            <p className="font-semibold text-slate-800 text-lg">{invoice.invoiceNumber}</p>
                        </div>

                        <div className="text-left sm:text-right space-y-1">
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Invoice Summary</p>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                <p className="text-slate-500 text-sm">Issue Date:</p>
                                <p className="text-slate-900 font-medium text-sm text-right">{new Date(invoice.issueDate).toLocaleDateString()}</p>

                                <p className="text-slate-500 text-sm">Due Date:</p>
                                <p className="text-slate-900 font-medium text-sm text-right flex items-center gap-1 justify-end">
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                    {new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' && (
                                        <Clock className="w-3.5 h-3.5 text-red-500" />
                                    )}
                                </p>

                                <p className="text-slate-500 text-sm">Amount Due:</p>
                                <p className="text-slate-900 font-bold text-sm text-right">
                                    {formatFull(invoice.total || 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Addresses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</p>
                            {invoice.clientId ? (
                                <>
                                    <p className="font-semibold text-slate-800 text-lg">{invoice.clientId.name}</p>
                                    {invoice.clientId.company && <p className="text-slate-600">{invoice.clientId.company}</p>}
                                    {invoice.clientId.email && <p className="text-slate-600">{invoice.clientId.email}</p>}
                                    {invoice.clientId.address && <p className="text-slate-600 whitespace-pre-wrap mt-1">{invoice.clientId.address}</p>}
                                </>
                            ) : (
                                <p className="text-slate-500 italic">Unknown Client</p>
                            )}
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="mb-12">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-y-2 border-slate-200">
                                    <th className="py-3 font-semibold text-slate-600">Description</th>
                                    <th className="py-3 font-semibold text-slate-600 text-right w-24">Rate</th>
                                    <th className="py-3 font-semibold text-slate-600 text-right w-20">Qty</th>
                                    <th className="py-3 font-semibold text-slate-600 text-right w-32">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 border-b border-slate-200">
                                {invoice.lineItems.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-4 text-slate-800">{item.description}</td>
                                        <td className="py-4 text-slate-600 text-right">{formatFull(item.unitPrice)}</td>
                                        <td className="py-4 text-slate-600 text-right">{item.quantity}</td>
                                        <td className="py-4 text-slate-800 font-medium text-right">
                                            {formatFull(item.quantity * item.unitPrice)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex flex-col sm:flex-row justify-between items-end gap-8 mb-12">
                        <div className="w-full sm:w-1/2">
                            {invoice.notes && (
                                <>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes & Terms</p>
                                    <p className="text-slate-600 text-sm whitespace-pre-wrap">{invoice.notes}</p>
                                </>
                            )}
                        </div>

                        <div className="w-full sm:w-1/3 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Subtotal</span>
                                <span className="text-slate-800 font-medium">{formatFull(invoice.subtotal)}</span>
                            </div>
                            {invoice.taxTotal > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Tax</span>
                                    <span className="text-slate-800 font-medium">{formatFull(invoice.taxTotal)}</span>
                                </div>
                            )}
                            {invoice.discount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Discount</span>
                                    <span className="text-slate-800 font-medium">-{formatFull(invoice.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200">
                                <span className="font-bold text-slate-800">Total Due</span>
                                <span className="text-xl font-black text-slate-900">
                                    {formatFull(invoice.total || 0)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Ribbon */}
                    {invoice.status === 'paid' && (
                        <div className="mt-8 flex items-center justify-center gap-2 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200">
                            <CheckCircle className="w-5 h-5" />
                            <p className="font-semibold text-sm">This invoice has been marked as PAID in full.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
