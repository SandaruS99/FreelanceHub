import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'freelancer';
    status: 'pending' | 'active' | 'suspended';
    avatar?: string;
    businessName?: string;
    businessAddress?: string;
    phone?: string;
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
        password: { type: String, required: true, select: false, minlength: 8 },
        role: { type: String, enum: ['admin', 'freelancer'], default: 'freelancer' },
        status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
        avatar: { type: String },
        businessName: { type: String, trim: true },
        businessAddress: { type: String, trim: true },
        phone: { type: String, trim: true },
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
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = async function (candidatePassword: string) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
