/**
 * Run this script ONCE to create the first admin account in MongoDB.
 * Usage: node scripts/seed-admin.mjs
 *
 * Make sure your MONGODB_URI is set in .env.local before running.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set in .env.local');
    process.exit(1);
}

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'admin' },
    status: { type: String, default: 'active' },
    plan: { type: String, default: 'business' },
    emailVerified: { type: Boolean, default: true },
    currency: { type: String, default: 'USD' },
    timezone: { type: String, default: 'UTC' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seed() {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = process.env.ADMIN_EMAIL || 'admin@freelancehub.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123456';

    const existing = await User.findOne({ email });
    if (existing) {
        console.log(`⚠️  Admin already exists: ${email}`);
        await mongoose.disconnect();
        return;
    }

    const hashed = await bcrypt.hash(password, 12);
    await User.create({
        name: 'Super Admin',
        email,
        password: hashed,
        role: 'admin',
        status: 'active',
        plan: 'business',
        emailVerified: true,
    });

    console.log(`✅ Admin created!`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`\n🚀 You can now log in at http://localhost:3000/auth/login`);
    await mongoose.disconnect();
}

seed().catch(console.error);
