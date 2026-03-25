'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { User, Lock, Settings, Save, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { CurrencyCombobox, TIMEZONES } from '@/components/CurrencyCombobox';

type Tab = 'profile' | 'security' | 'preferences';

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

export default function SettingsPage() {
    const { data: session, update } = useSession();
    const u = session?.user as any;

    const [tab, setTab] = useState<Tab>('profile');
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

    const tabs = [
        { id: 'profile' as Tab, label: 'Profile', icon: User },
        { id: 'security' as Tab, label: 'Security', icon: Lock },
        { id: 'preferences' as Tab, label: 'Preferences', icon: Settings },
    ];

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Account Settings</h1>
                <p className="text-slate-400 text-sm mt-1">Manage your profile, security, and preferences.</p>
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
            </div>
        </div>
    );
}
