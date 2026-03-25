import mongoose, { Document, Schema } from 'mongoose';

export interface IUserActivity extends Document {
    userId: mongoose.Types.ObjectId;
    action: string;
    details?: string;
    ip?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserActivitySchema = new Schema<IUserActivity>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        action: { type: String, required: true },
        details: { type: String },
        ip: { type: String },
    },
    { timestamps: true }
);

export default mongoose.models.UserActivity || mongoose.model<IUserActivity>('UserActivity', UserActivitySchema);
