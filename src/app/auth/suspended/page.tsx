import Link from 'next/link';
import { ShieldX, ArrowLeft } from 'lucide-react';

export default function SuspendedPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/20 border border-red-500/30 mb-6 shadow-xl shadow-red-500/10">
                    <ShieldX className="w-12 h-12 text-red-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">Account Suspended</h1>
                <p className="text-slate-400 mb-8 leading-relaxed">
                    Your account has been suspended. If you believe this is a mistake, please contact our support team.
                </p>
                <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                </Link>
            </div>
        </div>
    );
}
