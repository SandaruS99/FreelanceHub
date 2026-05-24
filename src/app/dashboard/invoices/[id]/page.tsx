'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Trash2, Send, Download, CheckCircle, Clock, MessageCircle } from 'lucide-react';

import { formatAmount } from '@/lib/useCurrency';

interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
}

interface Invoice {
    _id: string;
    invoiceNumber: string;
    currency: string;
    clientId?: {
        _id: string;
        name: string;
        company?: string;
        email?: string;
        address?: string;
        whatsapp?: string;
    };
    freelancerId?: {
        name: string;
        businessName?: string;
        businessAddress?: string;
        phone?: string;
        email?: string;
        website?: string;
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

    // Format an amount using the invoice's own stored currency (no exchange rate conversion)
    const fmtAmt = (amount: number) => {
        return formatAmount(amount, invoice?.currency || 'USD');
    };

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
        const link = document.createElement('a');
        link.href = `/api/public/invoices/${invoice.publicToken}/download`;
        link.setAttribute('download', '');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleWhatsAppShare = () => {
        if (!invoice?.publicToken) return;
        
        const payUrl = `${window.location.origin}/preview/invoice/${invoice.publicToken}/pay`;
        const pdfUrl = `${window.location.origin}/api/public/invoices/${invoice.publicToken}/download`;
        const message = encodeURIComponent(`*Hello ${invoice.clientId?.name || 'there'}*, 👋\n\nYour invoice is ready! \n\n📄 *Download PDF Invoice:* ${pdfUrl}\n💳 *View & Securely Pay:* ${payUrl}\n\nThank you for your business!`);
        
        let targetUrl = '';
        if (invoice.clientId?.whatsapp) {
            let cleanNumber = invoice.clientId.whatsapp.replace(/\D/g, '');
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
        
        handleDownload(); // Automatically download to the sender's device so they can immediately attach it
        
        window.open(targetUrl, '_blank');
        
        if (invoice.status === 'draft') {
            updateStatus('sent');
        }
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
                        onClick={handleWhatsAppShare}
                        className="flex items-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 text-[#25D366] px-4 py-2 rounded-xl transition text-sm font-medium"
                    >
                        <MessageCircle className="w-4 h-4" /> Share
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

            {/* Invoice Document Preview — matches PDF style */}
            <div className="bg-white text-[#333] rounded-2xl shadow-xl overflow-hidden print:shadow-none" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '11pt' }}>
                <div className="p-10 sm:p-12">

                    {/* Header: INVOICE + number left | Freelancer info right */}
                    <div className="flex flex-col sm:flex-row justify-between items-start pb-6 mb-8" style={{ borderBottom: '2px solid #e5e7eb' }}>
                        <div>
                            <h2 className="font-bold text-[#111827]" style={{ fontSize: '28pt', lineHeight: 1.1 }}>INVOICE</h2>
                            <p className="text-[#6b7280] mt-1" style={{ fontSize: '12pt' }}>#{invoice.invoiceNumber}</p>
                        </div>
                        <div className="text-left sm:text-right mt-4 sm:mt-0 space-y-0.5">
                            {invoice.freelancerId ? (
                                <>
                                    <p className="font-bold text-[#111827]" style={{ fontSize: '18pt' }}>
                                        {invoice.freelancerId.businessName || invoice.freelancerId.name}
                                    </p>
                                    {invoice.freelancerId.businessName && (
                                        <p className="text-[#4b5563]">{invoice.freelancerId.name}</p>
                                    )}
                                    {invoice.freelancerId.businessAddress && (
                                        <p className="text-[#4b5563]">{invoice.freelancerId.businessAddress}</p>
                                    )}
                                    {invoice.freelancerId.phone && (
                                        <p className="text-[#4b5563]">{invoice.freelancerId.phone}</p>
                                    )}
                                    {invoice.freelancerId.email && (
                                        <p className="text-[#4b5563]">{invoice.freelancerId.email}</p>
                                    )}
                                    {invoice.freelancerId.website && (
                                        <p className="text-[#4b5563]">{invoice.freelancerId.website}</p>
                                    )}
                                </>
                            ) : null}
                        </div>
                    </div>

                    {/* Info Grid: Bill To (left) | Dates + Amount Due (right) */}
                    <div className="flex flex-col sm:flex-row justify-between mb-8">
                        {/* Bill To */}
                        <div className="sm:w-1/2">
                            <p className="text-[10pt] text-[#6b7280] uppercase font-bold tracking-wider mb-1">Billed To:</p>
                            {invoice.clientId ? (
                                <>
                                    <p className="font-bold text-[#111827]" style={{ fontSize: '16pt' }}>{invoice.clientId.name}</p>
                                    {invoice.clientId.company && <p className="text-[#4b5563]">{invoice.clientId.company}</p>}
                                    {invoice.clientId.email && <p className="text-[#4b5563]">{invoice.clientId.email}</p>}
                                    {invoice.clientId.address && <p className="text-[#4b5563] whitespace-pre-wrap mt-1">{invoice.clientId.address}</p>}
                                </>
                            ) : (
                                <p className="text-[#4b5563] italic">Unknown Client</p>
                            )}
                        </div>

                        {/* Dates + Amount Due */}
                        <div className="sm:w-1/2 flex flex-col sm:items-end mt-6 sm:mt-0 gap-1">
                            <div className="flex gap-8 justify-end">
                                <span className="text-[#6b7280] font-bold w-24 text-right">Issue Date:</span>
                                <span className="text-[#333] w-24 text-right">{new Date(invoice.issueDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex gap-8 justify-end items-center">
                                <span className="text-[#6b7280] font-bold w-24 text-right">Due Date:</span>
                                <span className="text-[#333] w-24 text-right flex items-center gap-1 justify-end">
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                    {new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' && (
                                        <Clock className="w-3 h-3 text-red-500" />
                                    )}
                                </span>
                            </div>
                            {/* Amount Due box */}
                            <div className="mt-4 text-right">
                                <p className="text-[12pt] text-[#6b7280] font-bold">Amount Due:</p>
                                <p className="font-bold text-[#111827]" style={{ fontSize: '20pt' }}>
                                    {fmtAmt(invoice.total || 0)} {invoice.currency}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="mb-8">
                        <table className="w-full text-left" style={{ fontSize: '11pt' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                                    <th className="py-2 pl-2 text-[#4b5563] font-bold text-[10pt] w-[45%]">Description</th>
                                    <th className="py-2 text-[#4b5563] font-bold text-[10pt] text-right w-[20%]">Rate</th>
                                    <th className="py-2 text-[#4b5563] font-bold text-[10pt] text-right w-[15%]">Qty</th>
                                    <th className="py-2 pr-2 text-[#4b5563] font-bold text-[10pt] text-right w-[20%]">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.lineItems.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td className="py-3 pl-2 text-[#333]">{item.description}</td>
                                        <td className="py-3 text-[#4b5563] text-right">{fmtAmt(item.unitPrice)}</td>
                                        <td className="py-3 text-[#4b5563] text-right">{item.quantity}</td>
                                        <td className="py-3 pr-2 text-[#333] font-bold text-right">
                                            {fmtAmt(item.quantity * item.unitPrice)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Section: Notes left | Totals box right */}
                    <div className="flex flex-col sm:flex-row justify-between gap-8 mb-10">
                        {/* Notes */}
                        <div className="sm:w-1/2 pr-4">
                            {invoice.notes && (
                                <>
                                    <p className="text-[10pt] text-[#6b7280] uppercase font-bold tracking-wider mb-1">Notes</p>
                                    <p className="text-[#4b5563] text-[11pt] whitespace-pre-wrap">{invoice.notes}</p>
                                </>
                            )}
                        </div>

                        {/* Totals */}
                        <div className="sm:w-[40%] space-y-2">
                            <div className="flex justify-between text-[11pt]">
                                <span className="text-[#6b7280]">Subtotal:</span>
                                <span className="font-bold text-[#333]">{fmtAmt(invoice.subtotal)}</span>
                            </div>
                            {invoice.taxTotal > 0 && (
                                <div className="flex justify-between text-[11pt]">
                                    <span className="text-[#6b7280]">Tax:</span>
                                    <span className="font-bold text-[#333]">{fmtAmt(invoice.taxTotal)}</span>
                                </div>
                            )}
                            {invoice.discount > 0 && (
                                <div className="flex justify-between text-[11pt]">
                                    <span className="text-[#6b7280]">Discount:</span>
                                    <span className="font-bold text-[#333]">-{fmtAmt(invoice.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-3 mt-1" style={{ borderTop: '2px solid #e5e7eb' }}>
                                <span className="font-bold text-[14pt] text-[#111827]">Total Due:</span>
                                <span className="font-bold text-[16pt] text-[#8b5cf6]">
                                    {fmtAmt(invoice.total || 0)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-[#9ca3af] text-[10pt] pt-3" style={{ borderTop: '1px solid #e5e7eb' }}>
                        Thank you for your business. Generated by promoU Software.
                    </div>

                    {/* Paid ribbon */}
                    {invoice.status === 'paid' && (
                        <div className="mt-6 flex items-center justify-center gap-2 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200">
                            <CheckCircle className="w-5 h-5" />
                            <p className="font-semibold text-sm">This invoice has been marked as PAID in full.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
