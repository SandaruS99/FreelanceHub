import mongoose, { Document, Schema } from 'mongoose';
import Counter from './Counter';

export interface IClient extends Document {
    freelancerId: mongoose.Types.ObjectId;
    clientNumber?: string;
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    country?: string;
    address?: string;
    website?: string;
    notes?: string;
    tags: string[];
    status: 'active' | 'inactive' | 'archived';
    avatar?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
    {
        freelancerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        clientNumber: { type: String, unique: true, sparse: true },
        name: { type: String, required: true, trim: true },
        company: { type: String, trim: true },
        email: { type: String, lowercase: true, trim: true },
        phone: { type: String, trim: true },
        whatsapp: { type: String, trim: true },
        country: { type: String, trim: true },
        address: { type: String, trim: true },
        website: { type: String, trim: true },
        notes: { type: String },
        tags: [{ type: String, trim: true }],
        status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
        avatar: { type: String },
    },
    { timestamps: true }
);

ClientSchema.pre('save', async function () {
    if (this.isNew && !this.clientNumber) {
        const counter = await Counter.findOneAndUpdate(
            { id: 'clientNumber' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        const seq = (counter?.seq || 0) + 1000;
        this.clientNumber = `CLI-${seq}`;
    }
});

export default mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);
