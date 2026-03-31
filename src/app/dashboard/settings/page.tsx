'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import {
    User, Lock, Settings, Save, Loader2, CheckCircle2, AlertCircle,
    Eye, EyeOff, Link2, Unlink, Video, RefreshCw
} from 'lucide-react';
import { CurrencyCombobox, TIMEZONES } from '@/components/CurrencyCombobox';

type Tab = 'profile' | 'security' | 'preferences' | 'integrations';

function StatusMessage({ msg }: { msg: { text: string; type: 'success' | 'error' } | null }) {
    if (!msg) return null;
    return (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {msg.text}
        </div>
    );
}

function InputField({ label, type = 'text', value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition text-sm"
            />
        </div>
    );
}

function SettingsPageInner() {
    const { data: session, update } = useSession();
    const u = session?.user as any;
    const searchParams = useSearchParams();

    // Determine initial tab from URL (e.g. ?tab=integrations after Google OAuth)
    const urlTab = searchParams.get('tab') as Tab | null;
    const [tab, setTab] = useState<Tab>(urlTab && ['profile', 'security', 'preferences', 'integrations'].includes(urlTab) ? urlTab : 'profile');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Profile tab
    const [name, setName] = useState(u?.name || '');
    const [businessName, setBusinessName] = useState(u?.businessName || '');
    const [phone, setPhone] = useState(u?.phone || '');
    const [whatsapp, setWhatsapp] = useState(u?.whatsapp || '');
    const [website, setWebsite] = useState(u?.website || '');
    const [businessAddress, setBusinessAddress] = useState(u?.businessAddress || '');
    const [avatar, setAvatar] = useState(u?.avatar || '');

    // Security tab
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    // Preferences tab
    const [currency, setCurrency] = useState(u?.currency || 'USD');
    const [timezone, setTimezone] = useState(u?.timezone || 'UTC');

    // Integrations tab
    const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Handle query params from OAuth redirect
    useEffect(() => {
        const successParam = searchParams.get('success');
        const errorParam = searchParams.get('error');
        const msg = searchParams.get('msg');

        if (successParam === 'google_connected') {
            setStatus({ text: 'Google account connected successfully!', type: 'success' });
            setGoogleConnected(true);
        } else if (errorParam) {
            const errorMessages: Record<string, string> = {
                google_no_code: 'Google did not return an authorization code.',
                google_no_state: 'OAuth state parameter missing. Please try again.',
                google_user_not_found: 'User not found. Please log in again.',
                google_failed: msg ? decodeURIComponent(msg) : 'Failed to connect Google account.',
            };
            setStatus({ text: errorMessages[errorParam] || 'An error occurred.', type: 'error' });
        }
    }, [searchParams]);

    // Fetch Google connection status when Integrations tab is active
    useEffect(() => {
        if (tab === 'integrations' && googleConnected === null) {
            fetch('/api/user/google-status')
                .then(res => res.json())
                .then(data => setGoogleConnected(data.connected ?? false))
                .catch(() => setGoogleConnected(false));
        }
    }, [tab, googleConnected]);

    const saveProfile = async () => {
        setLoading(true); setStatus(null);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, businessName, phone, whatsapp, website, businessAddress, avatar }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            await update({ name, businessName, phone, whatsapp, website, businessAddress, avatar });
            setStatus({ text: 'Profile updated successfully!', type: 'success' });
        } catch (e: any) {
            setStatus({ text: e.message || 'Error saving profile', type: 'error' });
        } finally { setLoading(false); }
    };

    const savePassword = async () => {
        if (newPassword !== confirmPassword) {
            setStatus({ text: 'New passwords do not match', type: 'error' }); return;
        }
        setLoading(true); setStatus(null);
        try {
            const res = await fetch('/api/user/password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            setStatus({ text: 'Password changed successfully!', type: 'success' });
        } catch (e: any) {
            setStatus({ text: e.message || 'Error changing password', type: 'error' });
        } finally { setLoading(false); }
    };

    const savePreferences = async () => {
        setLoading(true); setStatus(null);
        try {
            const res = await fetch('/api/user/preferences', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currency, timezone }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            await update({ currency, timezone });
            setStatus({ text: 'Preferences saved!', type: 'success' });
        } catch (e: any) {
            setStatus({ text: e.message || 'Error saving preferences', type: 'error' });
        } finally { setLoading(false); }
    };

    const disconnectGoogle = async () => {
        if (!confirm('Disconnect your Google account? You will no longer be able to schedule Google Meet sessions.')) return;
        setGoogleLoading(true); setStatus(null);
        try {
            const res = await fetch('/api/google/disconnect', { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setGoogleConnected(false);
            setStatus({ text: 'Google account disconnected.', type: 'success' });
        } catch (e: any) {
            setStatus({ text: e.message || 'Error disconnecting Google', type: 'error' });
        } finally { setGoogleLoading(false); }
    };

    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'preferences', label: 'Preferences', icon: Settings },
        { id: 'integrations', label: 'Integrations', icon: Link2 },
    ];

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Account Settings</h1>
                <p className="text-slate-400 text-sm mt-1">Manage your profile, security, preferences, and integrations.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => { setTab(id); setStatus(null); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Icon className="w-4 h-4" /> {label}
                    </button>
                ))}
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-5">
                <StatusMessage msg={status} />

                {/* Profile Tab */}
                {tab === 'profile' && (
                    <>
                        <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                                {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : u?.name?.[0]?.toUpperCase() ?? 'F'}
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-medium text-slate-300">Avatar URL</label>
                                <input
                                    type="url"
                                    value={avatar}
                                    onChange={e => setAvatar(e.target.value)}
                                    placeholder="https://example.com/avatar.png"
                                    className="w-full mt-1.5 bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition text-sm"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField label="Full Name" value={name} onChange={setName} placeholder="Jane Doe" />
                            <InputField label="Business Name" value={businessName} onChange={setBusinessName} placeholder="Acme Inc." />
                            <InputField label="Phone" value={phone} onChange={setPhone} placeholder="+1 555 000 0000" />
                            <InputField label="WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder="+1 555 000 0000" />
                            <InputField label="Website" type="url" value={website} onChange={setWebsite} placeholder="https://yoursite.com" />
                        </div>
                        <InputField label="Business Address" value={businessAddress} onChange={setBusinessAddress} placeholder="123 Main St, City, Country" />
                        <div className="pt-2 flex justify-end">
                            <button onClick={saveProfile} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium text-sm transition disabled:opacity-50">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Profile
                            </button>
                        </div>
                    </>
                )}

                {/* Security Tab */}
                {tab === 'security' && (
                    <>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-300">Current Password</label>
                                <div className="relative">
                                    <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition text-sm" placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-300">New Password</label>
                                <div className="relative">
                                    <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition text-sm" placeholder="Min. 8 characters" />
                                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-300">Confirm New Password</label>
                                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition text-sm" placeholder="Re-enter new password" />
                            </div>
                        </div>
                        <div className="pt-2 flex justify-end">
                            <button onClick={savePassword} disabled={loading || !currentPassword || !newPassword} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium text-sm transition disabled:opacity-50">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                Update Password
                            </button>
                        </div>
                    </>
                )}

                {/* Preferences Tab */}
                {tab === 'preferences' && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-300">Currency</label>
                                <CurrencyCombobox value={currency} onChange={setCurrency} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-300">Timezone</label>
                                <select value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition text-sm">
                                    {TIMEZONES.map(tz => <option key={tz} value={tz} className="bg-slate-800">{tz}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="pt-2 flex justify-end">
                            <button onClick={savePreferences} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium text-sm transition disabled:opacity-50">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Preferences
                            </button>
                        </div>
                    </>
                )}

                {/* Integrations Tab */}
                {tab === 'integrations' && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-base font-semibold text-white">Third-Party Integrations</h3>
                            <p className="text-sm text-slate-400 mt-1">Connect external services to enhance your workflow.</p>
                        </div>

                        {/* Google Calendar / Meet Card */}
                        <div className="p-5 bg-white/[0.03] border border-white/8 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {/* Google icon */}
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">Google Calendar & Meet</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Schedule Google Meet sessions directly from projects</p>
                                    </div>
                                </div>

                                {/* Status badge */}
                                {googleConnected === null ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                        <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                                        <span className="text-xs text-slate-400">Checking...</span>
                                    </div>
                                ) : googleConnected ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-xs font-medium text-emerald-400">Connected</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-white/10">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                        <span className="text-xs font-medium text-slate-400">Not Connected</span>
                                    </div>
                                )}
                            </div>

                            {/* What it does */}
                            <div className="flex items-start gap-2.5 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                <Video className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Once connected, you can schedule a Google Meet directly from any project page. A calendar event with a Meet link will be created and your client will receive an invitation automatically.
                                </p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-3 pt-1">
                                {googleConnected ? (
                                    <>
                                        <a
                                            href="/api/google/auth"
                                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium text-sm rounded-xl transition"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Reconnect
                                        </a>
                                        <button
                                            onClick={disconnectGoogle}
                                            disabled={googleLoading}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 font-medium text-sm rounded-xl transition disabled:opacity-50"
                                        >
                                            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                                            Disconnect
                                        </button>
                                    </>
                                ) : (
                                    <a
                                        href="/api/google/auth"
                                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-blue-500/20"
                                    >
                                        <Link2 className="w-4 h-4" />
                                        Connect Google Account
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Placeholder for future integrations */}
                        <div className="p-5 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl flex items-center justify-between opacity-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                    <span className="text-slate-500 text-lg">+</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-500">More integrations coming soon</p>
                                    <p className="text-xs text-slate-600 mt-0.5">Slack, Zoom, Notion & more</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        }>
            <SettingsPageInner />
        </Suspense>
    );
}
