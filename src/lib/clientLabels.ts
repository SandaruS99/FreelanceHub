export interface ClientLabel {
    id: string;
    label: string;
    category: 'Lifecycle' | 'Financial' | 'Management';
    colorClass: string;
}

export const CLIENT_LABELS: ClientLabel[] = [
    // Category 1: Relationship Lifecycle
    {
        id: 'new-lead',
        label: 'First-Time',
        category: 'Lifecycle',
        colorClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    {
        id: 'repeat',
        label: 'Repeat Client',
        category: 'Lifecycle',
        colorClass: 'bg-teal-500/20 text-teal-400 border-teal-500/30'
    },
    {
        id: 'long-term',
        label: 'Long-Term',
        category: 'Lifecycle',
        colorClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    },
    {
        id: 'former',
        label: 'Former Client',
        category: 'Lifecycle',
        colorClass: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    },

    // Category 2: Financial & Value
    {
        id: 'vip',
        label: 'VIP',
        category: 'Financial',
        colorClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    },
    {
        id: 'fast-payer',
        label: 'Fast Payer',
        category: 'Financial',
        colorClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
        id: 'late-payer',
        label: 'Late Payer',
        category: 'Financial',
        colorClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    },

    // Category 3: Management
    {
        id: 'dream-client',
        label: 'Dream Client',
        category: 'Management',
        colorClass: 'bg-sky-500/20 text-sky-400 border-sky-500/30'
    },
    {
        id: 'high-maintenance',
        label: 'High Maintenance',
        category: 'Management',
        colorClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    }
];

export function getLabelColorClass(labelName: string): string {
    const found = CLIENT_LABELS.find(l => l.label === labelName);
    return found ? found.colorClass : 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}
