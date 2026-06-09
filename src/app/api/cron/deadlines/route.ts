import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
    try {
        // Vercel Cron sends a Bearer token in the Authorization header.
        // We verify it matches our CRON_SECRET to ensure only Vercel can trigger this.
        const authHeader = req.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Calculate the target time window (48 hours from now to 72 hours from now)
        const now = new Date();
        const targetStart = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 2 days
        const targetEnd = new Date(now.getTime() + 72 * 60 * 60 * 1000);   // 3 days

        // Find active projects with deadlines falling within exactly the 2-day window
        const upcomingProjects = await Project.find({
            status: 'active',
            deadline: {
                $gte: targetStart,
                $lt: targetEnd
            }
        });

        let remindersSent = 0;

        for (const project of upcomingProjects) {
            const user = await User.findById(project.freelancerId);
            if (!user) continue;

            // 1. Create In-App Notification
            await Notification.create({
                userId: user._id,
                title: 'Upcoming Project Deadline',
                message: `Your project "${project.name}" is due in 2 days.`,
                type: 'warning',
                link: `/dashboard/projects/${project._id}`
            });

            // 2. Send Email Reminder
            try {
                await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
                    to: user.email,
                    subject: `Reminder: Project "${project.name}" is due soon`,
                    html: `
                        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
                            <h2 style="color: #6366f1;">Project Deadline Reminder</h2>
                            <p>Hi ${user.name},</p>
                            <p>This is a friendly reminder that your project <strong>"${project.name}"</strong> has a deadline approaching in 2 days.</p>
                            <div style="margin: 30px 0;">
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/projects/${project._id}" style="background-color: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Project</a>
                            </div>
                            <p style="font-size: 14px; color: #666;">Make sure to wrap up your tasks and deliver the work before the deadline.</p>
                            <hr style="border: none; border-top: 1px solid #eaeaea; margin-top: 40px; margin-bottom: 20px;" />
                            <p style="font-size: 12px; color: #999;">Powered by FreelanceHub</p>
                        </div>
                    `,
                });
                remindersSent++;
            } catch (err) {
                console.error(`Failed to send deadline email to ${user.email}:`, err);
            }
        }

        return NextResponse.json({ success: true, remindersSent });

    } catch (error) {
        console.error('Cron deadline check error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
