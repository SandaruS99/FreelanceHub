'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Info, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    link?: string;
    createdAt: string;
}

export default function NotificationsDropdown() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications?limit=20');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (n: Notification) => {
        if (!n.read) {
            try {
                const res = await fetch(`/api/notifications/${n._id}/read`, { method: 'PATCH' });
                if (res.ok) {
                    setNotifications(prev => prev.map(item => item._id === n._id ? { ...item, read: true } : item));
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        }
        if (n.link) {
            setOpen(false);
            router.push(n.link);
        }
    };

    const markAllAsRead = async () => {
        try {
            const res = await fetch(`/api/notifications/all/read`, { method: 'PATCH' });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'info':
            default:
                return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
            >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
                        <h3 className="font-semibold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" />
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto flex-1 p-2">
                        {notifications.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                No notifications yet
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer ${notification.read
                                                ? 'hover:bg-white/5 opacity-70'
                                                : 'bg-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="mt-0.5 shrink-0 bg-slate-900/50 p-1.5 rounded-full">
                                            {getTypeIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${notification.read ? 'text-slate-300' : 'text-white'}`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-2">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 shrink-0"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
