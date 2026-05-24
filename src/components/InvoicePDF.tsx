import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

import { formatAmount } from '@/lib/useCurrency';

// Register a basic font (optional, react-pdf has default helvetica)
// We'll stick to the built-in fonts to ensure it works smoothly in edge/serverless environments without loading external assets unless needed.

const styles = StyleSheet.create({
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

export const InvoicePDF = ({ invoice }: { invoice: any }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>INVOICE</Text>
                    <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
                        {invoice.freelancerId.businessName || invoice.freelancerId.name}
                    </Text>
                    {invoice.freelancerId.businessName && (
                        <Text style={styles.text}>{invoice.freelancerId.name}</Text>
                    )}
                    {invoice.freelancerId.businessAddress && (
                        <Text style={styles.text}>{invoice.freelancerId.businessAddress}</Text>
                    )}
                    {invoice.freelancerId.phone && (
                        <Text style={styles.text}>{invoice.freelancerId.phone}</Text>
                    )}
                    {invoice.freelancerId.email && (
                        <Text style={styles.text}>{invoice.freelancerId.email}</Text>
                    )}
                    {invoice.freelancerId.website && (
                        <Text style={styles.text}>{invoice.freelancerId.website}</Text>
                    )}
                </View>
            </View>

            <View style={styles.infoGrid}>
                <View style={styles.billTo}>
                    <Text style={styles.label}>Billed To:</Text>
                    <Text style={styles.companyName}>{invoice.clientId.name}</Text>
                    {invoice.clientId.company && <Text style={styles.text}>{invoice.clientId.company}</Text>}
                    <Text style={styles.text}>{invoice.clientId.email}</Text>
                </View>
                <View style={styles.meta}>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Issue Date:</Text>
                        <Text style={styles.metaValue}>{new Date(invoice.issueDate).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Due Date:</Text>
                        <Text style={styles.metaValue}>{new Date(invoice.dueDate).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.amountDueBox}>
                        <Text style={styles.amountDueLabel}>Amount Due:</Text>
                        <Text style={styles.amountDueValue}>{formatAmount(invoice.total || 0, invoice.currency)} {invoice.currency}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.colDesc, styles.tableHeaderCell]}>Description</Text>
                    <Text style={[styles.colRate, styles.tableHeaderCell]}>Rate</Text>
                    <Text style={[styles.colQty, styles.tableHeaderCell]}>Qty</Text>
                    <Text style={[styles.colTotal, styles.tableHeaderCell]}>Amount</Text>
                </View>
                {invoice.lineItems.map((item: any, i: number) => (
                    <View key={i} style={styles.tableRow}>
                        <Text style={styles.colDesc}>{item.description}</Text>
                        <Text style={styles.colRate}>{formatAmount(item.unitPrice || 0, invoice.currency)}</Text>
                        <Text style={styles.colQty}>{item.quantity}</Text>
                        <Text style={[styles.colTotal, { fontWeight: 'bold' }]}>{formatAmount(item.quantity * item.unitPrice, invoice.currency)}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.totalsSection}>
                <View style={styles.notesSection}>
                    {invoice.notes ? (
                        <>
                            <Text style={styles.label}>Notes</Text>
                            <Text style={styles.text}>{invoice.notes}</Text>
                        </>
                    ) : null}
                </View>
                <View style={styles.totalsBox}>
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabel}>Subtotal:</Text>
                        <Text style={styles.totalsValue}>{formatAmount(invoice.subtotal || 0, invoice.currency)}</Text>
                    </View>
                    {invoice.taxTotal > 0 && (
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>Tax:</Text>
                            <Text style={styles.totalsValue}>{formatAmount(invoice.taxTotal, invoice.currency)}</Text>
                        </View>
                    )}
                    {invoice.discount > 0 && (
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>Discount:</Text>
                            <Text style={styles.totalsValue}>-{formatAmount(invoice.discount, invoice.currency)}</Text>
                        </View>
                    )}
                    <View style={styles.grandTotalRow}>
                        <Text style={styles.grandTotalLabel}>Total Due:</Text>
                        <Text style={styles.grandTotalValue}>{formatAmount(invoice.total || 0, invoice.currency)}</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.footer}>
                Thank you for your business. Generated by promoU Software.
            </Text>
        </Page>
    </Document>
);
