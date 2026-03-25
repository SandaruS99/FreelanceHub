import mongoose, { Document, Schema } from 'mongoose';

export interface IMilestone {
    title: string;
    dueDate?: Date;
    completed: boolean;
}

export interface IProject extends Document {
    freelancerId: mongoose.Types.ObjectId;
    clientId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    status: 'draft' | 'active' | 'on-hold' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high';
    startDate?: Date;
    deadline?: Date;
    budget?: number;
    currency: string;
    progress: number;
    milestones: IMilestone[];
    tags: string[];
    deliveryFile?: string;
    deliveryToken?: string;
    isDelivered: boolean;
    deliveredAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestone>({
    title: { type: String, required: true },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false },
});

const ProjectSchema = new Schema<IProject>(
    {
        freelancerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
        name: { type: String, required: true, trim: true },
        description: { type: String },
        status: {
            type: String,
            enum: ['draft', 'active', 'on-hold', 'completed', 'cancelled'],
            default: 'draft',
        },
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        startDate: { type: Date },
        deadline: { type: Date },
        budget: { type: Number, min: 0 },
        currency: { type: String, default: 'USD' },
        progress: { type: Number, default: 0, min: 0, max: 100 },
        milestones: [MilestoneSchema],
        tags: [{ type: String, trim: true }],
        deliveryFile: { type: String },
        deliveryToken: { type: String, unique: true, sparse: true },
        isDelivered: { type: Boolean, default: false },
        deliveredAt: { type: Date },
    },
    { timestamps: true }
);

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
