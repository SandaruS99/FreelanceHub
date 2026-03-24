'use client';

import { useEffect, useState, useRef } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { 
    TrendingUp, DollarSign, Briefcase, CheckCircle, Download, 
    Calendar, Filter, FileText, ChevronRight, Loader2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

interface ReportData {
    monthly: any[];
    projects: any[];
    clients: any[];
    summary: {
        totalRevenue: number;
        totalPending: number;
        activeProjects: number;
        completedProjects: number;
    };
}

export default function ReportsPage() {
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/api/reports')
            .then(res => res.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#0f172a',
                logging: false,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`FreelanceHub_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                <p className="text-slate-400 animate-pulse">Gathering business insights...</p>
            </div>
        );
    }

    if (!data) return null;

    // Transform monthly data for charts
    const chartData = data.monthly.map(m => ({
        name: `${MONTHS[m._id.month - 1]} ${m._id.year}`,
        revenue: m.revenue,
        pending: m.pending,
        total: m.revenue + m.pending
    }));

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Business Reports</h1>
                    <p className="text-slate-400 mt-1">Deep insights into your freelance performance and growth.</p>
                </div>
                <button
                    onClick={handleDownloadPDF}
                    disabled={isExporting}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-2xl transition shadow-lg shadow-purple-500/20 font-medium"
                >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Download Report
                </button>
            </div>

            <div ref={reportRef} className="space-y-8 p-1 rounded-3xl">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="Total Revenue" 
                        value={`$${data.summary.totalRevenue.toLocaleString()}`} 
                        sub="All time earnings" 
                        icon={<DollarSign className="w-5 h-5" />}
                        color="text-emerald-400"
                        bg="bg-emerald-500/10"
                    />
                    <StatCard 
                        title="Pending" 
                        value={`$${data.summary.totalPending.toLocaleString()}`} 
                        sub="Outstanding invoices" 
                        icon={<TrendingUp className="w-5 h-5" />}
                        color="text-blue-400"
                        bg="bg-blue-500/10"
                    />
                    <StatCard 
                        title="Active Projects" 
                        value={data.summary.activeProjects} 
                        sub="Currently in progress" 
                        icon={<Briefcase className="w-5 h-5" />}
                        color="text-purple-400"
                        bg="bg-purple-500/10"
                    />
                    <StatCard 
                        title="Success Rate" 
                        value={`${Math.round((data.summary.completedProjects / (data.summary.activeProjects + data.summary.completedProjects || 1)) * 100)}%`} 
                        sub="Project completion" 
                        icon={<CheckCircle className="w-5 h-5" />}
                        color="text-orange-400"
                        bg="bg-orange-500/10"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Revenue Chart */}
                    <div className="lg:col-span-2 bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold text-white">Revenue Trends</h3>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-purple-500" /> Paid</div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500" /> Pending</div>
                            </div>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorPen" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                                        itemStyle={{ fontSize: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} stackId="1" />
                                    <Area type="monotone" dataKey="pending" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPen)" strokeWidth={3} stackId="1" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Client Distribution */}
                    <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                        <h3 className="text-lg font-bold text-white mb-8">Client Distribution</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.clients}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="revenue"
                                    >
                                        {data.clients.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                                    />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Detailed Monthly Summary Table */}
                <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl">
                    <div className="p-8 border-b border-white/5">
                        <h3 className="text-lg font-bold text-white">Detailed Monthly Summary</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-white/5">
                                    <th className="px-8 py-4 font-semibold text-slate-300">Period</th>
                                    <th className="px-8 py-4 font-semibold text-slate-300">Invoices</th>
                                    <th className="px-8 py-4 font-semibold text-slate-300 text-right">Revenue</th>
                                    <th className="px-8 py-4 font-semibold text-slate-300 text-right">Pending</th>
                                    <th className="px-8 py-4 font-semibold text-slate-300 text-right">Potential Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.monthly.slice().reverse().map((m, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition border-white/5">
                                        <td className="px-8 py-6 font-medium text-white">
                                            {MONTHS[m._id.month - 1]} {m._id.year}
                                        </td>
                                        <td className="px-8 py-6 text-slate-400">
                                            {m.count} Invoices
                                        </td>
                                        <td className="px-8 py-6 text-emerald-400 font-bold text-right">
                                            ${m.revenue.toLocaleString()}
                                        </td>
                                        <td className="px-8 py-6 text-blue-400 font-bold text-right">
                                            ${m.pending.toLocaleString()}
                                        </td>
                                        <td className="px-8 py-6 text-white font-black text-right">
                                            ${(m.revenue + m.pending).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, sub, icon, color, bg }: any) {
    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 backdrop-blur-xl group hover:border-purple-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${bg} ${color}`}>
                    {icon}
                </div>
                <div className="px-2 py-1 bg-white/5 rounded-lg border border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Monthly
                </div>
            </div>
            <h4 className="text-slate-500 text-xs font-bold uppercase tracking-widest">{title}</h4>
            <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-black text-white tracking-tight">{value}</p>
            </div>
            <p className="text-slate-400 text-[11px] mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                {sub}
            </p>
        </div>
    );
}
