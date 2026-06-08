import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatAmount } from '@/lib/formatCurrency';

// --- Shared Helper ---
const renderInvoiceNumber = (invoice: any) => `#${invoice.invoiceNumber || 'DRAFT'}`;

// ==========================================
// 1. MODERN TEMPLATE (The original layout)
// ==========================================
const modernStyles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11, color: '#333' },
    header: { flexDirection: 'row', justifyContent: 'space-between', borderBottom: '2 solid #e5e7eb', paddingBottom: 20, marginBottom: 30 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
    invoiceNumber: { fontSize: 12, color: '#6b7280', marginTop: 4 },
    infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    billTo: { width: '50%' },
    label: { fontSize: 10, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4, fontWeight: 'bold' },
    companyName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
    text: { color: '#4b5563', marginBottom: 2 },
    meta: { width: '50%', alignItems: 'flex-end' },
    metaRow: { flexDirection: 'row', marginBottom: 4 },
    metaLabel: { color: '#6b7280', fontWeight: 'bold', marginRight: 8, width: 80, textAlign: 'right' },
    metaValue: { width: 80, textAlign: 'right' },
    amountDueBox: { marginTop: 15, alignItems: 'flex-end' },
    amountDueLabel: { fontSize: 12, color: '#6b7280', fontWeight: 'bold' },
    amountDueValue: { fontSize: 20, fontWeight: 'bold', marginTop: 2 },

    table: { width: '100%', marginBottom: 30 },
    tableHeader: { flexDirection: 'row', borderBottom: '2 solid #e5e7eb', backgroundColor: '#f9fafb', padding: '8 0' },
    tableHeaderCell: { color: '#4b5563', fontWeight: 'bold', fontSize: 10 },
    tableRow: { flexDirection: 'row', borderBottom: '1 solid #e5e7eb', padding: '10 0' },
    colDesc: { width: '45%', paddingLeft: 8 },
    colRate: { width: '20%', textAlign: 'right' },
    colQty: { width: '15%', textAlign: 'right' },
    colTotal: { width: '20%', textAlign: 'right', paddingRight: 8 },

    totalsSection: { flexDirection: 'row', justifyContent: 'space-between' },
    notesSection: { width: '50%', paddingRight: 20 },
    totalsBox: { width: '40%' },
    totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    totalsLabel: { color: '#6b7280' },
    totalsValue: { fontWeight: 'bold' },
    grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, marginTop: 4, borderTop: '2 solid #e5e7eb' },
    grandTotalLabel: { fontSize: 14, fontWeight: 'bold' },
    grandTotalValue: { fontSize: 16, fontWeight: 'bold', color: '#8b5cf6' },

    footer: { position: 'absolute', bottom: 40, left: 40, right: 40, textAlign: 'center', color: '#9ca3af', fontSize: 10, borderTop: '1 solid #e5e7eb', paddingTop: 10 }
});

const ModernTemplate = ({ invoice }: { invoice: any }) => (
    <Page size="A4" style={modernStyles.page}>
        <View style={modernStyles.header}>
            <View>
                <Text style={modernStyles.title}>INVOICE</Text>
                <Text style={modernStyles.invoiceNumber}>{renderInvoiceNumber(invoice)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
                    {invoice.freelancerId?.businessName || invoice.freelancerId?.name || 'Freelancer'}
                </Text>
                {invoice.freelancerId?.businessName && invoice.freelancerId?.name && (
                    <Text style={modernStyles.text}>{invoice.freelancerId.name}</Text>
                )}
                {invoice.freelancerId?.businessAddress && (
                    <Text style={modernStyles.text}>{invoice.freelancerId.businessAddress}</Text>
                )}
                {invoice.freelancerId?.email && (
                    <Text style={modernStyles.text}>{invoice.freelancerId.email}</Text>
                )}
            </View>
        </View>

        <View style={modernStyles.infoGrid}>
            <View style={modernStyles.billTo}>
                <Text style={modernStyles.label}>Billed To:</Text>
                <Text style={modernStyles.companyName}>{invoice.clientId?.name || 'Client Name'}</Text>
                {invoice.clientId?.company && <Text style={modernStyles.text}>{invoice.clientId.company}</Text>}
                {invoice.clientId?.email && <Text style={modernStyles.text}>{invoice.clientId.email}</Text>}
            </View>
            <View style={modernStyles.meta}>
                <View style={modernStyles.metaRow}>
                    <Text style={modernStyles.metaLabel}>Issue Date:</Text>
                    <Text style={modernStyles.metaValue}>{new Date(invoice.issueDate).toLocaleDateString()}</Text>
                </View>
                <View style={modernStyles.metaRow}>
                    <Text style={modernStyles.metaLabel}>Due Date:</Text>
                    <Text style={modernStyles.metaValue}>{new Date(invoice.dueDate).toLocaleDateString()}</Text>
                </View>
                <View style={modernStyles.amountDueBox}>
                    <Text style={modernStyles.amountDueLabel}>Amount Due:</Text>
                    <Text style={modernStyles.amountDueValue}>{formatAmount(invoice.total || 0, invoice.currency)}</Text>
                </View>
            </View>
        </View>

        <View style={modernStyles.table}>
            <View style={modernStyles.tableHeader}>
                <Text style={[modernStyles.colDesc, modernStyles.tableHeaderCell]}>Description</Text>
                <Text style={[modernStyles.colRate, modernStyles.tableHeaderCell]}>Rate</Text>
                <Text style={[modernStyles.colQty, modernStyles.tableHeaderCell]}>Qty</Text>
                <Text style={[modernStyles.colTotal, modernStyles.tableHeaderCell]}>Amount</Text>
            </View>
            {invoice.lineItems?.map((item: any, i: number) => (
                <View key={i} style={modernStyles.tableRow}>
                    <Text style={modernStyles.colDesc}>{item.description}</Text>
                    <Text style={modernStyles.colRate}>{formatAmount(item.unitPrice || 0, invoice.currency)}</Text>
                    <Text style={modernStyles.colQty}>{item.quantity}</Text>
                    <Text style={[modernStyles.colTotal, { fontWeight: 'bold' }]}>{formatAmount(item.quantity * item.unitPrice, invoice.currency)}</Text>
                </View>
            ))}
        </View>

        <View style={modernStyles.totalsSection}>
            <View style={modernStyles.notesSection}>
                {invoice.notes ? (
                    <>
                        <Text style={modernStyles.label}>Notes</Text>
                        <Text style={modernStyles.text}>{invoice.notes}</Text>
                    </>
                ) : null}
            </View>
            <View style={modernStyles.totalsBox}>
                <View style={modernStyles.totalsRow}>
                    <Text style={modernStyles.totalsLabel}>Subtotal:</Text>
                    <Text style={modernStyles.totalsValue}>{formatAmount(invoice.subtotal || 0, invoice.currency)}</Text>
                </View>
                {invoice.taxTotal > 0 && (
                    <View style={modernStyles.totalsRow}>
                        <Text style={modernStyles.totalsLabel}>Tax:</Text>
                        <Text style={modernStyles.totalsValue}>{formatAmount(invoice.taxTotal, invoice.currency)}</Text>
                    </View>
                )}
                {invoice.discount > 0 && (
                    <View style={modernStyles.totalsRow}>
                        <Text style={modernStyles.totalsLabel}>Discount:</Text>
                        <Text style={modernStyles.totalsValue}>-{formatAmount(invoice.discount, invoice.currency)}</Text>
                    </View>
                )}
                <View style={modernStyles.grandTotalRow}>
                    <Text style={modernStyles.grandTotalLabel}>Total Due:</Text>
                    <Text style={modernStyles.grandTotalValue}>{formatAmount(invoice.total || 0, invoice.currency)}</Text>
                </View>
            </View>
        </View>

        <Text style={modernStyles.footer}>
            Thank you for your business. Generated by FreelanceHub.
        </Text>
    </Page>
);

// ==========================================
// 2. CLASSIC TEMPLATE (B&W, Traditional)
// ==========================================
const classicStyles = StyleSheet.create({
    page: { padding: 50, fontFamily: 'Helvetica', fontSize: 11, color: '#000' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
    title: { fontSize: 32, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
    boldText: { fontWeight: 'bold', fontSize: 12, marginBottom: 4 },
    text: { color: '#333', marginBottom: 3 },
    infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    billTo: { width: '45%' },
    metaBox: { width: '40%', borderWidth: 1, borderColor: '#000', padding: 10 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    table: { width: '100%', marginBottom: 30, borderWidth: 1, borderColor: '#000' },
    tableHeader: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderBottomWidth: 1, borderColor: '#000' },
    tableHeaderCell: { fontWeight: 'bold', padding: 8, fontSize: 10, textAlign: 'center', borderRightWidth: 1, borderColor: '#000' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
    tableCell: { padding: 8, textAlign: 'center', borderRightWidth: 1, borderColor: '#000' },
    colDesc: { width: '50%', textAlign: 'left' },
    colQty: { width: '15%' },
    colRate: { width: '15%' },
    colTotal: { width: '20%', borderRightWidth: 0 },
    totalsSection: { flexDirection: 'row', justifyContent: 'space-between' },
    notes: { width: '50%' },
    totalsBox: { width: '40%' },
    totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderColor: '#eee' },
    grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 2, borderColor: '#000', marginTop: 4 },
    grandTotalLabel: { fontSize: 14, fontWeight: 'bold' },
    grandTotalValue: { fontSize: 14, fontWeight: 'bold' },
    footer: { position: 'absolute', bottom: 40, left: 50, right: 50, textAlign: 'center', fontSize: 9, color: '#666', borderTopWidth: 1, borderColor: '#000', paddingTop: 10 }
});

const ClassicTemplate = ({ invoice }: { invoice: any }) => (
    <Page size="A4" style={classicStyles.page}>
        <View style={classicStyles.header}>
            <View style={{ width: '50%' }}>
                <Text style={classicStyles.title}>INVOICE</Text>
                <Text style={classicStyles.boldText}>
                    {invoice.freelancerId?.businessName || invoice.freelancerId?.name || 'Freelancer'}
                </Text>
                {invoice.freelancerId?.businessAddress && <Text style={classicStyles.text}>{invoice.freelancerId.businessAddress}</Text>}
                {invoice.freelancerId?.email && <Text style={classicStyles.text}>{invoice.freelancerId.email}</Text>}
            </View>
        </View>

        <View style={classicStyles.infoGrid}>
            <View style={classicStyles.billTo}>
                <Text style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 12 }}>BILL TO:</Text>
                <Text style={classicStyles.boldText}>{invoice.clientId?.name || 'Client Name'}</Text>
                {invoice.clientId?.company && <Text style={classicStyles.text}>{invoice.clientId.company}</Text>}
                {invoice.clientId?.email && <Text style={classicStyles.text}>{invoice.clientId.email}</Text>}
            </View>
            <View style={classicStyles.metaBox}>
                <View style={classicStyles.metaRow}>
                    <Text style={{ fontWeight: 'bold' }}>Invoice No:</Text>
                    <Text>{renderInvoiceNumber(invoice)}</Text>
                </View>
                <View style={classicStyles.metaRow}>
                    <Text style={{ fontWeight: 'bold' }}>Date:</Text>
                    <Text>{new Date(invoice.issueDate).toLocaleDateString()}</Text>
                </View>
                <View style={classicStyles.metaRow}>
                    <Text style={{ fontWeight: 'bold' }}>Due Date:</Text>
                    <Text>{new Date(invoice.dueDate).toLocaleDateString()}</Text>
                </View>
                <View style={[classicStyles.metaRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: '#ccc' }]}>
                    <Text style={{ fontWeight: 'bold' }}>Amount Due:</Text>
                    <Text style={{ fontWeight: 'bold' }}>{formatAmount(invoice.total || 0, invoice.currency)}</Text>
                </View>
            </View>
        </View>

        <View style={classicStyles.table}>
            <View style={classicStyles.tableHeader}>
                <Text style={[classicStyles.tableHeaderCell, classicStyles.colDesc]}>DESCRIPTION</Text>
                <Text style={[classicStyles.tableHeaderCell, classicStyles.colQty]}>QTY</Text>
                <Text style={[classicStyles.tableHeaderCell, classicStyles.colRate]}>RATE</Text>
                <Text style={[classicStyles.tableHeaderCell, classicStyles.colTotal]}>AMOUNT</Text>
            </View>
            {invoice.lineItems?.map((item: any, i: number) => (
                <View key={i} style={classicStyles.tableRow}>
                    <Text style={[classicStyles.tableCell, classicStyles.colDesc]}>{item.description}</Text>
                    <Text style={[classicStyles.tableCell, classicStyles.colQty]}>{item.quantity}</Text>
                    <Text style={[classicStyles.tableCell, classicStyles.colRate]}>{formatAmount(item.unitPrice || 0, invoice.currency)}</Text>
                    <Text style={[classicStyles.tableCell, classicStyles.colTotal]}>{formatAmount(item.quantity * item.unitPrice, invoice.currency)}</Text>
                </View>
            ))}
        </View>

        <View style={classicStyles.totalsSection}>
            <View style={classicStyles.notes}>
                {invoice.notes && (
                    <>
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Terms & Notes:</Text>
                        <Text style={{ color: '#555', lineHeight: 1.4 }}>{invoice.notes}</Text>
                    </>
                )}
            </View>
            <View style={classicStyles.totalsBox}>
                <View style={classicStyles.totalsRow}>
                    <Text>Subtotal</Text>
                    <Text>{formatAmount(invoice.subtotal || 0, invoice.currency)}</Text>
                </View>
                {invoice.taxTotal > 0 && (
                    <View style={classicStyles.totalsRow}>
                        <Text>Tax</Text>
                        <Text>{formatAmount(invoice.taxTotal, invoice.currency)}</Text>
                    </View>
                )}
                {invoice.discount > 0 && (
                    <View style={classicStyles.totalsRow}>
                        <Text>Discount</Text>
                        <Text>-{formatAmount(invoice.discount, invoice.currency)}</Text>
                    </View>
                )}
                <View style={classicStyles.grandTotalRow}>
                    <Text style={classicStyles.grandTotalLabel}>TOTAL</Text>
                    <Text style={classicStyles.grandTotalValue}>{formatAmount(invoice.total || 0, invoice.currency)}</Text>
                </View>
            </View>
        </View>

        <Text style={classicStyles.footer}>Generated by FreelanceHub</Text>
    </Page>
);

// ==========================================
// 3. MINIMAL TEMPLATE (Clean, Air)
// ==========================================
const minimalStyles = StyleSheet.create({
    page: { padding: 60, fontFamily: 'Helvetica', fontSize: 10, color: '#3f3f46' },
    header: { marginBottom: 60 },
    title: { fontSize: 40, fontWeight: 'bold', color: '#18181b', letterSpacing: -1, marginBottom: 20 },
    text: { color: '#71717a', marginBottom: 3 },
    infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
    sectionLabel: { fontSize: 8, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    companyName: { fontSize: 14, fontWeight: 'bold', color: '#27272a', marginBottom: 4 },
    table: { width: '100%', marginBottom: 40 },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e4e4e7', paddingBottom: 10, marginBottom: 10 },
    tableHeaderCell: { fontSize: 9, color: '#a1a1aa', textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', paddingVertical: 8 },
    colDesc: { width: '60%' },
    colTotal: { width: '40%', textAlign: 'right' },
    totalsSection: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderColor: '#e4e4e7', paddingTop: 20 },
    totalsBox: { width: '50%' },
    totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10 },
    grandTotalLabel: { fontSize: 16, color: '#18181b' },
    grandTotalValue: { fontSize: 24, fontWeight: 'bold', color: '#18181b' },
    footer: { position: 'absolute', bottom: 40, left: 60, right: 60, textAlign: 'center', fontSize: 9, color: '#a1a1aa' }
});

const MinimalTemplate = ({ invoice }: { invoice: any }) => (
    <Page size="A4" style={minimalStyles.page}>
        <View style={minimalStyles.header}>
            <Text style={minimalStyles.title}>Invoice.</Text>
            <Text style={minimalStyles.companyName}>
                {invoice.freelancerId?.businessName || invoice.freelancerId?.name || 'Freelancer'}
            </Text>
            {invoice.freelancerId?.email && <Text style={minimalStyles.text}>{invoice.freelancerId.email}</Text>}
        </View>

        <View style={minimalStyles.infoGrid}>
            <View style={{ width: '30%' }}>
                <Text style={minimalStyles.sectionLabel}>Client</Text>
                <Text style={minimalStyles.companyName}>{invoice.clientId?.name || 'Client Name'}</Text>
                {invoice.clientId?.email && <Text style={minimalStyles.text}>{invoice.clientId.email}</Text>}
            </View>
            <View style={{ width: '30%' }}>
                <Text style={minimalStyles.sectionLabel}>Invoice #</Text>
                <Text style={minimalStyles.text}>{renderInvoiceNumber(invoice)}</Text>
            </View>
            <View style={{ width: '30%' }}>
                <Text style={minimalStyles.sectionLabel}>Date</Text>
                <Text style={minimalStyles.text}>{new Date(invoice.issueDate).toLocaleDateString()}</Text>
                <Text style={[minimalStyles.sectionLabel, { marginTop: 10 }]}>Due Date</Text>
                <Text style={minimalStyles.text}>{new Date(invoice.dueDate).toLocaleDateString()}</Text>
            </View>
        </View>

        <View style={minimalStyles.table}>
            <View style={minimalStyles.tableHeader}>
                <Text style={[minimalStyles.tableHeaderCell, minimalStyles.colDesc]}>Description</Text>
                <Text style={[minimalStyles.tableHeaderCell, minimalStyles.colTotal]}>Amount</Text>
            </View>
            {invoice.lineItems?.map((item: any, i: number) => (
                <View key={i} style={minimalStyles.tableRow}>
                    <Text style={[minimalStyles.colDesc, { color: '#27272a' }]}>
                        {item.description}
                        {item.quantity !== 1 && ` (x${item.quantity})`}
                    </Text>
                    <Text style={[minimalStyles.colTotal, { color: '#27272a' }]}>{formatAmount(item.quantity * item.unitPrice, invoice.currency)}</Text>
                </View>
            ))}
        </View>

        <View style={minimalStyles.totalsSection}>
            <View style={minimalStyles.totalsBox}>
                <View style={minimalStyles.totalsRow}>
                    <Text style={{ color: '#71717a' }}>Subtotal</Text>
                    <Text>{formatAmount(invoice.subtotal || 0, invoice.currency)}</Text>
                </View>
                {invoice.taxTotal > 0 && (
                    <View style={minimalStyles.totalsRow}>
                        <Text style={{ color: '#71717a' }}>Tax</Text>
                        <Text>{formatAmount(invoice.taxTotal, invoice.currency)}</Text>
                    </View>
                )}
                {invoice.discount > 0 && (
                    <View style={minimalStyles.totalsRow}>
                        <Text style={{ color: '#71717a' }}>Discount</Text>
                        <Text>-{formatAmount(invoice.discount, invoice.currency)}</Text>
                    </View>
                )}
                <View style={minimalStyles.grandTotalRow}>
                    <Text style={minimalStyles.grandTotalLabel}>Total</Text>
                    <Text style={minimalStyles.grandTotalValue}>{formatAmount(invoice.total || 0, invoice.currency)}</Text>
                </View>
            </View>
        </View>

        {invoice.notes && (
            <View style={{ marginTop: 40 }}>
                <Text style={minimalStyles.sectionLabel}>Notes</Text>
                <Text style={minimalStyles.text}>{invoice.notes}</Text>
            </View>
        )}

        <Text style={minimalStyles.footer}>FreelanceHub</Text>
    </Page>
);

// ==========================================
// MAIN COMPONENT
// ==========================================
export const InvoicePDF = ({ invoice }: { invoice: any }) => {
    return (
        <Document>
            {invoice.template === 'classic' ? (
                <ClassicTemplate invoice={invoice} />
            ) : invoice.template === 'minimal' ? (
                <MinimalTemplate invoice={invoice} />
            ) : (
                <ModernTemplate invoice={invoice} />
            )}
        </Document>
    );
};
