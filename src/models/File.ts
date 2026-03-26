import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
    name: string;
    mimeType: string;
    size: number;
    data: Buffer;
    projectId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const FileSchema = new Schema<IFile>(
    {
        name: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        data: { type: Buffer, required: true },
        projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    },
    { timestamps: true }
);

export default mongoose.models.File || mongoose.model<IFile>('File', FileSchema);
