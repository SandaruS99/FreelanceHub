import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET() {
    try {
        await dbConnect();

        // Find any active freelancer and make them an admin
        const updatedUser = await User.findOneAndUpdate(
            {},
            { role: 'admin', status: 'active' },
            { new: true, sort: { createdAt: 1 } } // Gets the first user created
        );

        if (!updatedUser) {
            return NextResponse.json({ message: 'No users found! Please register an account first.' });
        }

        return NextResponse.json({
            message: '🎉 SUCCESS! Your account has been upgraded to an ADMIN.',
            user: {
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role
            },
            nextStep: 'Go to the login page and sign in with this email to access the Admin Dashboard!'
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) });
    }
}
