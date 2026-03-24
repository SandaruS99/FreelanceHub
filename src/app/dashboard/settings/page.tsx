'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, Lock, Settings, Save, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, ChevronDown, Search } from 'lucide-react';

type Tab = 'profile' | 'security' | 'preferences';

const ALL_CURRENCIES = [
    { code: 'USD', name: 'US Dollar' }, { code: 'EUR', name: 'Euro' }, { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' }, { code: 'AUD', name: 'Australian Dollar' }, { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'CHF', name: 'Swiss Franc' }, { code: 'CNY', name: 'Chinese Yuan' }, { code: 'SEK', name: 'Swedish Krona' },
    { code: 'NZD', name: 'New Zealand Dollar' }, { code: 'MXN', name: 'Mexican Peso' }, { code: 'SGD', name: 'Singapore Dollar' },
    { code: 'HKD', name: 'Hong Kong Dollar' }, { code: 'NOK', name: 'Norwegian Krone' }, { code: 'KRW', name: 'South Korean Won' },
    { code: 'TRY', name: 'Turkish Lira' }, { code: 'RUB', name: 'Russian Ruble' }, { code: 'INR', name: 'Indian Rupee' },
    { code: 'BRL', name: 'Brazilian Real' }, { code: 'ZAR', name: 'South African Rand' }, { code: 'DKK', name: 'Danish Krone' },
    { code: 'PLN', name: 'Polish Zloty' }, { code: 'TWD', name: 'Taiwan Dollar' }, { code: 'THB', name: 'Thai Baht' },
    { code: 'IDR', name: 'Indonesian Rupiah' }, { code: 'HUF', name: 'Hungarian Forint' }, { code: 'CZK', name: 'Czech Koruna' },
    { code: 'ILS', name: 'Israeli Shekel' }, { code: 'CLP', name: 'Chilean Peso' }, { code: 'PHP', name: 'Philippine Peso' },
    { code: 'AED', name: 'UAE Dirham' }, { code: 'COP', name: 'Colombian Peso' }, { code: 'SAR', name: 'Saudi Riyal' },
    { code: 'MYR', name: 'Malaysian Ringgit' }, { code: 'RON', name: 'Romanian Leu' }, { code: 'ARS', name: 'Argentine Peso' },
    { code: 'BGN', name: 'Bulgarian Lev' }, { code: 'HRK', name: 'Croatian Kuna' }, { code: 'UAH', name: 'Ukrainian Hryvnia' },
    { code: 'NGN', name: 'Nigerian Naira' }, { code: 'EGP', name: 'Egyptian Pound' }, { code: 'PKR', name: 'Pakistani Rupee' },
    { code: 'BDT', name: 'Bangladeshi Taka' }, { code: 'VND', name: 'Vietnamese Dong' }, { code: 'KES', name: 'Kenyan Shilling' },
    { code: 'GHS', name: 'Ghanaian Cedi' }, { code: 'TZS', name: 'Tanzanian Shilling' }, { code: 'UGX', name: 'Ugandan Shilling' },
    { code: 'MAD', name: 'Moroccan Dirham' }, { code: 'QAR', name: 'Qatari Riyal' }, { code: 'KWD', name: 'Kuwaiti Dinar' },
    { code: 'BHD', name: 'Bahraini Dinar' }, { code: 'OMR', name: 'Omani Rial' }, { code: 'JOD', name: 'Jordanian Dinar' },
    { code: 'LKR', name: 'Sri Lankan Rupee' }, { code: 'NPR', name: 'Nepalese Rupee' }, { code: 'MMK', name: 'Myanmar Kyat' },
    { code: 'KHR', name: 'Cambodian Riel' }, { code: 'LAK', name: 'Laotian Kip' }, { code: 'PGK', name: 'Papua New Guinean Kina' },
    { code: 'FJD', name: 'Fijian Dollar' }, { code: 'XPF', name: 'CFP Franc' }, { code: 'WST', name: 'Samoan Tala' },
    { code: 'TOP', name: 'Tongan Paʻanga' }, { code: 'VUV', name: 'Vanuatu Vatu' }, { code: 'SBD', name: 'Solomon Islands Dollar' },
    { code: 'PEN', name: 'Peruvian Sol' }, { code: 'BOB', name: 'Bolivian Boliviano' }, { code: 'PYG', name: 'Paraguayan Guarani' },
    { code: 'UYU', name: 'Uruguayan Peso' }, { code: 'GTQ', name: 'Guatemalan Quetzal' }, { code: 'HNL', name: 'Honduran Lempira' },
    { code: 'NIO', name: 'Nicaraguan Córdoba' }, { code: 'CRC', name: 'Costa Rican Colón' }, { code: 'DOP', name: 'Dominican Peso' },
    { code: 'HTG', name: 'Haitian Gourde' }, { code: 'JMD', name: 'Jamaican Dollar' }, { code: 'TTD', name: 'Trinidad & Tobago Dollar' },
    { code: 'BBD', name: 'Barbadian Dollar' }, { code: 'BSD', name: 'Bahamian Dollar' }, { code: 'BZD', name: 'Belize Dollar' },
    { code: 'GYD', name: 'Guyanese Dollar' }, { code: 'SRD', name: 'Surinamese Dollar' }, { code: 'AWG', name: 'Aruban Florin' },
    { code: 'ANG', name: 'Netherlands Antillean Guilder' }, { code: 'KYD', name: 'Cayman Islands Dollar' },
    { code: 'XCD', name: 'East Caribbean Dollar' }, { code: 'MOP', name: 'Macanese Pataca' }, { code: 'BND', name: 'Brunei Dollar' },
    { code: 'MNT', name: 'Mongolian Tögrög' }, { code: 'KZT', name: 'Kazakhstani Tenge' }, { code: 'UZS', name: 'Uzbekistani Som' },
    { code: 'GEL', name: 'Georgian Lari' }, { code: 'AMD', name: 'Armenian Dram' }, { code: 'AZN', name: 'Azerbaijani Manat' },
    { code: 'BYN', name: 'Belarusian Ruble' }, { code: 'MDL', name: 'Moldovan Leu' }, { code: 'MKD', name: 'Macedonian Denar' },
    { code: 'ALL', name: 'Albanian Lek' }, { code: 'BAM', name: 'Bosnia-Herzegovina Mark' }, { code: 'RSD', name: 'Serbian Dinar' },
    { code: 'ISK', name: 'Icelandic Króna' }, { code: 'MVR', name: 'Maldivian Rufiyaa' }, { code: 'BTN', name: 'Bhutanese Ngultrum' },
    { code: 'AFN', name: 'Afghan Afghani' }, { code: 'IQD', name: 'Iraqi Dinar' }, { code: 'IRR', name: 'Iranian Rial' },
    { code: 'LBP', name: 'Lebanese Pound' }, { code: 'SYP', name: 'Syrian Pound' }, { code: 'YER', name: 'Yemeni Rial' },
    { code: 'ETB', name: 'Ethiopian Birr' }, { code: 'TND', name: 'Tunisian Dinar' }, { code: 'DZD', name: 'Algerian Dinar' },
    { code: 'LYD', name: 'Libyan Dinar' }, { code: 'SDG', name: 'Sudanese Pound' }, { code: 'AOA', name: 'Angolan Kwanza' },
    { code: 'ZMW', name: 'Zambian Kwacha' }, { code: 'MWK', name: 'Malawian Kwacha' }, { code: 'MZN', name: 'Mozambican Metical' },
    { code: 'ZWL', name: 'Zimbabwean Dollar' }, { code: 'BIF', name: 'Burundian Franc' }, { code: 'RWF', name: 'Rwandan Franc' },
    { code: 'CDF', name: 'Congolese Franc' }, { code: 'XAF', name: 'Central African CFA Franc' }, { code: 'XOF', name: 'West African CFA Franc' },
    { code: 'GMD', name: 'Gambian Dalasi' }, { code: 'SLL', name: 'Sierra Leonean Leone' }, { code: 'LRD', name: 'Liberian Dollar' },
    { code: 'GNF', name: 'Guinean Franc' }, { code: 'CVE', name: 'Cape Verdean Escudo' }, { code: 'STN', name: 'São Tomé & Príncipe Dobra' },
    { code: 'SCR', name: 'Seychellois Rupee' }, { code: 'MUR', name: 'Mauritian Rupee' }, { code: 'KMF', name: 'Comorian Franc' },
    { code: 'MGA', name: 'Malagasy Ariary' }, { code: 'DJF', name: 'Djiboutian Franc' }, { code: 'ERN', name: 'Eritrean Nakfa' },
    { code: 'SOS', name: 'Somali Shilling' },
];

const TIMEZONES = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'America/Denver',
    'America/Phoenix', 'America/Anchorage', 'America/Honolulu', 'America/Toronto', 'America/Vancouver',
    'America/Mexico_City', 'America/Bogota', 'America/Lima', 'America/Santiago', 'America/Sao_Paulo',
    'America/Buenos_Aires', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid',
    'Europe/Rome', 'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Warsaw', 'Europe/Prague',
    'Europe/Budapest', 'Europe/Bucharest', 'Europe/Istanbul', 'Europe/Moscow', 'Europe/Kiev',
    'Africa/Cairo', 'Africa/Lagos', 'Africa/Nairobi', 'Africa/Johannesburg', 'Africa/Casablanca',
    'Asia/Dubai', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Karachi', 'Asia/Colombo',
    'Asia/Kathmandu', 'Asia/Almaty', 'Asia/Tashkent', 'Asia/Bangkok', 'Asia/Singapore',
    'Asia/Hong_Kong', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Jakarta',
    'Asia/Manila', 'Asia/Ho_Chi_Minh', 'Asia/Kuala_Lumpur', 'Asia/Taipei', 'Asia/Riyadh',
    'Asia/Baghdad', 'Asia/Tehran', 'Asia/Baku', 'Asia/Tbilisi', 'Asia/Yerevan',
    'Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Perth',
    'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Honolulu',
];

function CurrencyCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const selected = ALL_CURRENCIES.find(c => c.code === value);
    const filtered = query === ''
        ? ALL_CURRENCIES
        : ALL_CURRENCIES.filter(c =>
            c.code.toLowerCase().includes(query.toLowerCase()) ||
            c.name.toLowerCase().includes(query.toLowerCase())
        );

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => { setOpen(!open); setQuery(''); }}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition"
            >
                <span>{selected ? `${selected.code} — ${selected.name}` : 'Select currency'}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
            {open && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
                        <Search className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                            autoFocus
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search currency..."
                            className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none"
                        />
                    </div>
                    <div className="overflow-y-auto max-h-52">
                        {filtered.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-4">No currencies found</p>
                        ) : filtered.map(c => (
                            <button
                                key={c.code}
                                type="button"
                                onClick={() => { onChange(c.code); setOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition flex items-center justify-between ${c.code === value ? 'text-purple-300 bg-purple-500/10' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                            >
                                <span>{c.name}</span>
                                <span className="text-xs font-bold text-slate-400">{c.code}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

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
                body: JSON.stringify({ name, businessName, phone, website, businessAddress, avatar }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            await update({ name, businessName, phone, website, businessAddress, avatar });
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
                        {/* Avatar */}
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
