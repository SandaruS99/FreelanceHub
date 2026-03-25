import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import Counter from './Counter';

export interface IUser extends Document {
    name: string;
    email: string;
    userId?: string; // e.g., FH-1001
    password: string;
    role: 'admin' | 'freelancer';
    status: 'pending' | 'active' | 'suspended';
    avatar?: string;
    businessName?: string;
    businessAddress?: string;
    phone?: string;
    whatsapp?: string;
    website?: string;
    currency: string;
    timezone: string;
    plan: 'free' | 'pro' | 'business';
    emailVerified: boolean;
    verificationToken?: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        userId: { type: String, unique: true, sparse: true },
        password: { type: String, required: true, select: false, minlength: 8 },
        role: { type: String, enum: ['admin', 'freelancer'], default: 'freelancer' },
        status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
        avatar: { type: String },
        businessName: { type: String, trim: true },
        businessAddress: { type: String, trim: true },
        phone: { type: String, trim: true },
        whatsapp: { type: String, trim: true },
        website: { type: String, trim: true },
        currency: { type: String, default: 'USD' },
        timezone: { type: String, default: 'UTC' },
        plan: { type: String, enum: ['free', 'pro', 'business'], default: 'free' },
        emailVerified: { type: Boolean, default: false },
        verificationToken: { type: String },
        resetPasswordToken: { type: String },
        resetPasswordExpires: { type: Date },
    },
    { timestamps: true }
);

UserSchema.pre('save', async function () {
    // Hash password
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
    }

    // Auto-generate User ID for freelancers
    if (this.isNew && this.role === 'freelancer' && !this.userId) {
        const counter = await Counter.findOneAndUpdate(
            { id: 'userId' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        // FH-1001, FH-1002, etc.
        const seq = (counter?.seq || 0) + 1000;
        this.userId = `FH-${seq}`;
    }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
