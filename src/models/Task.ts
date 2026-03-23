import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
    freelancerId: mongoose.Types.ObjectId;
    projectId?: mongoose.Types.ObjectId;
    clientId?: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    status: 'todo' | 'in-progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: Date;
    completedAt?: Date;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
    {
        freelancerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
        clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
        title: { type: String, required: true, trim: true },
        description: { type: String },
        status: {
            type: String,
            enum: ['todo', 'in-progress', 'review', 'done'],
            default: 'todo',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },
        dueDate: { type: Date },
        completedAt: { type: Date },
        tags: [{ type: String, trim: true }],
    },
    { timestamps: true }
);

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
