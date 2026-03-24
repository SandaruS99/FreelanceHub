'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

export const ALL_CURRENCIES = [
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

export const TIMEZONES = [
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

export function CurrencyCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
