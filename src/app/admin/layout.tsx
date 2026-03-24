'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
    LayoutDashboard, Users, Settings, LogOut, Briefcase, Menu, X, ChevronDown, Bell
} from 'lucide-react';
import NotificationsDropdown from '@/components/NotificationsDropdown';

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/freelancers', label: 'Freelancers', icon: Users },
    { href: '/admin/notifications', label: 'Notifications', icon: Bell },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const user = session?.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const initials = user?.name?.[0]?.toUpperCase() ?? 'A';

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-white/5 transform transition-transform duration-300 flex flex-col lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30">
                        <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="font-bold text-white text-sm">FreelanceHub</span>
                        <span className="block text-xs text-purple-400 font-medium">Admin Panel</span>
                    </div>
                </div>

                {/* Profile mini */}
                <div className="px-4 py-3 border-b border-white/5">
                    <div className="relative flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-white text-sm font-medium truncate pr-12">{user?.name ?? 'Admin'}</p>
                            <p className="text-slate-400 text-xs truncate">{user?.email ?? ''}</p>
                        </div>
                        <div className="absolute top-2 right-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                            Admin
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active
                                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div className="border-t border-white/5 p-4 space-y-0.5">
                    <Link href="/admin/settings" onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${pathname === '/admin/settings' ? 'bg-purple-600/20 text-purple-300' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                        <Settings className="w-4 h-4" />
                        Settings
                    </Link>
                </div>

            </aside>

            {/* Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Main */}
            <div className="flex-1 lg:ml-64 flex flex-col min-w-0 overflow-x-hidden">
                {/* Topbar */}
                <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 lg:px-8 h-16">
                    <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-3">
                        <NotificationsDropdown />
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition"
                            >
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
                                <span className="text-sm text-slate-300 hidden sm:block">Admin</span>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            {userMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-white/10 rounded-xl shadow-xl py-1 z-50">
                                    <div className="px-4 py-3 border-b border-white/10 mb-1">
                                        <p className="text-sm font-medium text-white">{user?.name}</p>
                                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                                        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                            Admin
                                        </div>
                                    </div>
                                    <Link href="/admin/settings" className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2 transition">
                                        <Settings className="w-3.5 h-3.5" /> Settings
                                    </Link>
                                    <hr className="border-white/10 my-1" />
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/auth/login' })}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition"
                                    >
                                        <LogOut className="w-3.5 h-3.5" /> Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-8">{children}</main>
            </div>
        </div>
    );
}

