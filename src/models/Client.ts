import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
    freelancerId: mongoose.Types.ObjectId;
    name: string;
    company?: string;
    email?: string;
    phone?: string;
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
        name: { type: String, required: true, trim: true },
        company: { type: String, trim: true },
        email: { type: String, lowercase: true, trim: true },
        phone: { type: String, trim: true },
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

export default mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);
