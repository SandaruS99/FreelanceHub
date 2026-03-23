import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { Users, UserCheck, UserX, Clock, TrendingUp } from 'lucide-react';

async function getStats() {
    await dbConnect();
    const [total, active, pending, suspended] = await Promise.all([
        User.countDocuments({ role: 'freelancer' }),
        User.countDocuments({ role: 'freelancer', status: 'active' }),
        User.countDocuments({ role: 'freelancer', status: 'pending' }),
        User.countDocuments({ role: 'freelancer', status: 'suspended' }),
    ]);
    const recent = await User.find({ role: 'freelancer' })
        .select('name email status createdAt businessName')
        .sort({ createdAt: -1 })
        .limit(5);
    return { total, active, pending, suspended, recent };
}

export default async function AdminPage() {
    await auth();
    const stats = await getStats();

    const cards = [
        { label: 'Total Freelancers', value: stats.total, icon: Users, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { label: 'Active Accounts', value: stats.active, icon: UserCheck, color: 'from-green-500 to-emerald-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
        { label: 'Pending Approval', value: stats.pending, icon: Clock, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        { label: 'Suspended', value: stats.suspended, icon: UserX, color: 'from-red-500 to-rose-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    ];

    const statusColors: Record<string, string> = {
        active: 'bg-green-500/20 text-green-400 border-green-500/30',
        pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-slate-400 mt-1">Overview of the FreelanceHub platform.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {cards.map(({ label, value, icon: Icon, color, bg, border }) => (
                    <div key={label} className={`${bg} ${border} border rounded-2xl p-5`}>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-slate-400 text-sm font-medium">{label}</span>
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                                <Icon className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white">{value}</p>
                    </div>
                ))}
            </div>

            {/* Recent Registrations */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        <h2 className="font-semibold text-white text-sm">Recent Registrations</h2>
                    </div>
                    <a href="/admin/freelancers" className="text-xs text-purple-400 hover:text-purple-300 transition">View all →</a>
                </div>
                <div className="divide-y divide-white/5">
                    {stats.recent.length === 0 ? (
                        <div className="px-6 py-10 text-center text-slate-500">No freelancers yet.</div>
                    ) : (
                        stats.recent.map((u) => (
                            <div key={u._id.toString()} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                                        {u.name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">{u.name}</p>
                                        <p className="text-slate-400 text-xs">{u.email}</p>
                                    </div>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColors[u.status]}`}>
                                    {u.status}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
