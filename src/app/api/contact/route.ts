import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
    try {
        const { name, email, message } = await req.json();

        if (!name || !email || !message) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@freelancehub.com';
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        await resend.emails.send({
            from: fromEmail,
            to: adminEmail,
            replyTo: email,
            subject: `FreelanceHub - Account Appeal from ${name}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #6366f1;">Account Appeal / Contact Request</h2>
                    <p>A user has sent a contact request through the FreelanceHub portal.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; width: 120px;">Name</td>
                            <td style="padding: 8px 12px; border-left: 3px solid #6366f1;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold;">Email</td>
                            <td style="padding: 8px 12px; border-left: 3px solid #6366f1;"><a href="mailto:${email}">${email}</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; vertical-align: top;">Message</td>
                            <td style="padding: 8px 12px; border-left: 3px solid #6366f1; white-space: pre-wrap;">${message}</td>
                        </tr>
                    </table>
                    <p style="font-size: 13px; color: #888;">You can reply directly to this email to respond to the user.</p>
                </div>
            `,
        });

        return NextResponse.json({ message: 'Message sent successfully' }, { status: 200 });

    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
    }
}
