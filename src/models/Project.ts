import mongoose, { Document, Schema } from 'mongoose';
import Counter from './Counter';

export interface IMilestone {
    title: string;
    dueDate?: Date;
    completed: boolean;
}

export interface IRevision {
    message: string;
    clientName: string;
    status: 'pending' | 'in-progress' | 'resolved';
    submittedAt: Date;
}

export interface IProject extends Document {
    freelancerId: mongoose.Types.ObjectId;
    clientId: mongoose.Types.ObjectId;
    projectNumber?: string;
    name: string;
    category?: string;
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
    deliveryFileName?: string;
    deliveryFileId?: mongoose.Types.ObjectId;
    deliveryToken?: string;
    isDelivered: boolean;
    isPaid: boolean;
    deliveredAt?: Date;
    revisions: IRevision[];
    googleMeetLink?: string;
    createdAt: Date;
    updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestone>({
    title: { type: String, required: true },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false },
});

const RevisionSchema = new Schema<IRevision>({
    message: { type: String, required: true },
    clientName: { type: String, default: 'Client' },
    status: { type: String, enum: ['pending', 'in-progress', 'resolved'], default: 'pending' },
    submittedAt: { type: Date, default: Date.now },
});

const ProjectSchema = new Schema<IProject>(
    {
        freelancerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
        projectNumber: { type: String, unique: true, sparse: true },
        name: { type: String, required: true, trim: true },
        category: { type: String, trim: true },
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
        deliveryFileName: { type: String },
        deliveryFileId: { type: Schema.Types.ObjectId, ref: 'File' },
        deliveryToken: { type: String, unique: true, sparse: true },
        isDelivered: { type: Boolean, default: false },
        isPaid: { type: Boolean, default: false },
        deliveredAt: { type: Date },
        revisions: { type: [RevisionSchema], default: [] },
        googleMeetLink: { type: String },
    },
    { timestamps: true }
);

ProjectSchema.pre('save', async function () {
    if (this.isNew && !this.projectNumber) {
        const counter = await Counter.findOneAndUpdate(
            { id: 'projectNumber' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        const seq = (counter?.seq || 0) + 1000;
        this.projectNumber = `PRJ-${seq}`;
    }
});

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
