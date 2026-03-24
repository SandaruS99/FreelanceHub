'use client';

import { useState, useEffect } from 'react';
import { 
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
    Briefcase, CheckSquare, FileText, Loader2, Clock, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Event {
    id: string;
    title: string;
    date: string;
    type: 'project' | 'task' | 'invoice';
    status: string;
    priority?: string;
    url: string;
    amount?: number;
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/calendar')
            .then(res => res.json())
            .then(data => setEvents(data.events || []))
            .finally(() => setLoading(false));
    }, []);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const days = daysInMonth(year, month);
    const startOffset = firstDayOfMonth(year, month);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToToday = () => setCurrentDate(new Date());

    const getEventsForDay = (day: number) => {
        return events.filter(e => {
            const d = new Date(e.date);
            return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
        });
    };

    const typeColors = {
        project: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        task: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        invoice: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    };

    const typeIcons = {
        project: <Briefcase className="w-3 h-3" />,
        task: <CheckSquare className="w-3 h-3" />,
        invoice: <FileText className="w-3 h-3" />
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                <p className="text-slate-400 animate-pulse">Syncing your schedule...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Schedule Calendar</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Track your deadlines, tasks, and payments in one view.</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-white/5 shadow-xl">
                    <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-xl transition text-slate-400 hover:text-white">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="px-4 font-bold text-sm text-white min-w-[140px] text-center">
                        {monthName} {year}
                    </div>
                    <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-xl transition text-slate-400 hover:text-white">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="w-px h-5 bg-white/10 mx-1" />
                    <button onClick={goToToday} className="px-4 py-2 hover:bg-white/5 rounded-xl transition text-xs font-bold text-purple-400 uppercase tracking-wider">
                        Today
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-white/5 bg-white/5">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 auto-rows-[140px]">
                    {/* Empty offsets */}
                    {Array.from({ length: startOffset }).map((_, i) => (
                        <div key={`offset-${i}`} className="border-r border-b border-white/5 bg-slate-950/20" />
                    ))}

                    {/* Actual days */}
                    {Array.from({ length: days }).map((_, i) => {
                        const day = i + 1;
                        const dayEvents = getEventsForDay(day);
                        const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

                        return (
                            <div 
                                key={day} 
                                className={`group p-3 border-r border-b border-white/5 hover:bg-white/[0.02] transition-all relative overflow-hidden ${isToday ? 'bg-purple-500/[0.03]' : ''}`}
                            >
                                <span className={`text-sm font-bold inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${isToday ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 group-hover:text-white'}`}>
                                    {day}
                                </span>
                                
                                <div className="mt-2 space-y-1 overflow-y-auto max-h-[85px] scrollbar-none">
                                    {dayEvents.map((event) => (
                                        <Link
                                            key={event.id}
                                            href={event.url}
                                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98] truncate ${typeColors[event.type]}`}
                                        >
                                            <span className="shrink-0">{typeIcons[event.type]}</span>
                                            <span className="truncate">{event.title}</span>
                                        </Link>
                                    ))}
                                </div>

                                {dayEvents.length > 0 && (
                                    <div className="absolute bottom-1 right-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <div className="flex gap-1">
                                            {Array.from(new Set(dayEvents.map(e => e.type))).map(type => (
                                                <div key={type} className={`w-1 h-1 rounded-full ${type === 'project' ? 'bg-blue-400' : type === 'task' ? 'bg-purple-400' : 'bg-emerald-400'}`} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Fill remaining space */}
                    {Array.from({ length: (7 - (startOffset + days) % 7) % 7 }).map((_, i) => (
                        <div key={`fill-${i}`} className="border-r border-b border-white/5 bg-slate-950/20" />
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-6 px-4 py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-blue-500/20 text-blue-400"><Briefcase className="w-3 h-3" /></div>
                    Projects
                </div>
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-purple-500/20 text-purple-400"><CheckSquare className="w-3 h-3" /></div>
                    Tasks
                </div>
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-emerald-500/20 text-emerald-400"><FileText className="w-3 h-3" /></div>
                    Invoices
                </div>
                <div className="ml-auto flex items-center gap-2 text-slate-600">
                    <Clock className="w-3.5 h-3.5" />
                    All times in your local timezone
                </div>
            </div>
        </div>
    );
}
