import mongoose, { Document, Schema } from 'mongoose';

export interface ILineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
}

export interface IInvoice extends Document {
    freelancerId: mongoose.Types.ObjectId;
    clientId: mongoose.Types.ObjectId;
    projectId?: mongoose.Types.ObjectId;
    invoiceNumber: string;
    status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
    lineItems: ILineItem[];
    subtotal: number;
    taxTotal: number;
    discount: number;
    discountType: 'fixed' | 'percentage';
    total: number;
    currency: string;
    issueDate: Date;
    dueDate: Date;
    notes?: string;
    terms?: string;
    publicToken: string;
    paidAt?: Date;
    paidAmount?: number;
    paymentMethod?: string;
    sentAt?: Date;
    viewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const LineItemSchema = new Schema<ILineItem>({
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true },
});

const InvoiceSchema = new Schema<IInvoice>(
    {
        freelancerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
        projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
        invoiceNumber: { type: String, required: true },
        status: {
            type: String,
            enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'],
            default: 'draft',
        },
        lineItems: [LineItemSchema],
        subtotal: { type: Number, required: true, default: 0 },
        taxTotal: { type: Number, default: 0 },
        discount: { type: Number, default: 0, min: 0 },
        discountType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
        total: { type: Number, required: true, default: 0 },
        currency: { type: String, default: 'USD' },
        issueDate: { type: Date, required: true, default: Date.now },
        dueDate: { type: Date, required: true },
        notes: { type: String },
        terms: { type: String },
        publicToken: { type: String, required: true, unique: true },
        paidAt: { type: Date },
        paidAmount: { type: Number },
        paymentMethod: { type: String },
        sentAt: { type: Date },
        viewedAt: { type: Date },
    },
    { timestamps: true }
);

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
