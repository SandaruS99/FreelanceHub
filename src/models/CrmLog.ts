import mongoose, { Document, Schema } from 'mongoose';

export interface ICrmLog extends Document {
    freelancerId: mongoose.Types.ObjectId;
    clientId: mongoose.Types.ObjectId;
    type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'note';
    title: string;
    content: string;
    followUpDate?: Date;
    followUpDone: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CrmLogSchema = new Schema<ICrmLog>(
    {
        freelancerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
        type: {
            type: String,
            enum: ['call', 'email', 'whatsapp', 'meeting', 'note'],
            default: 'note',
        },
        title: { type: String, required: true, trim: true },
        content: { type: String, required: true },
        followUpDate: { type: Date },
        followUpDone: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.models.CrmLog || mongoose.model<ICrmLog>('CrmLog', CrmLogSchema);
