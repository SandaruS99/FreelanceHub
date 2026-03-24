'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Check, Zap, Building, Loader2 } from 'lucide-react';
import { useCurrency } from '@/lib/useCurrency';

export default function BillingPage() {
    const { data: session, update } = useSession();
    const { format } = useCurrency();
    const currentPlan = (session?.user as any)?.plan || 'free';

    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const handleUpgrade = async (plan: string) => {
        setLoadingPlan(plan);
        setMessage(null);

        try {
            const res = await fetch('/api/user/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to upgrade plan');

            // Force session update to reflect the new plan globally
            await update({ plan });
            setMessage({ text: `Successfully upgraded to ${plan.toUpperCase()}!`, type: 'success' });

            // Reload page gently to refresh session UI fully
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error: any) {
            setMessage({ text: error.message || 'Error processing upgrade', type: 'error' });
        } finally {
            setLoadingPlan(null);
        }
    };

    const plans = [
        {
            id: 'free',
            name: 'Free',
            priceUSD: 0,
            hasMonthly: false,
            description: 'Perfect for getting started.',
            features: ['Up to 5 clients', 'Basic invoicing', 'Standard reporting'],
            icon: <Check className="w-5 h-5 text-slate-400" />,
            color: 'slate',
        },
        {
            id: 'pro',
            name: 'Pro',
            priceUSD: 9.99,
            hasMonthly: true,
            description: 'For growing freelancers.',
            features: ['Unlimited clients', 'Advanced tax tracking', 'Custom PDF design', 'Priority support'],
            icon: <Zap className="w-5 h-5 text-purple-400" />,
            color: 'purple',
        },
        {
            id: 'business',
            name: 'Business',
            priceUSD: 29.99,
            hasMonthly: true,
            description: 'For agencies and teams.',
            features: ['Everything in Pro', 'Team accounts', 'API Access', 'White-labeling'],
            icon: <Building className="w-5 h-5 text-indigo-400" />,
            color: 'indigo',
        }
    ];

    if (!session) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Billing & Subscriptions</h1>
                <p className="text-slate-400 text-sm mt-1">Manage your plan and billing details.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${message.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {plans.map((plan) => {
                    const isCurrentPlan = currentPlan === plan.id;
                    const isPopular = plan.id === 'pro';

                    return (
                        <div
                            key={plan.id}
                            className={`relative bg-slate-900 rounded-3xl p-8 border flex flex-col ${isPopular
                                ? 'border-purple-500 ring-1 ring-purple-500/50 shadow-2xl shadow-purple-500/10 scale-105 z-10'
                                : 'border-white/10 hover:border-white/20 transition-colors'
                                }`}
                        >
                            {isPopular && (
                                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                                    <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-purple-500/30">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10`}>
                                    {plan.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                            </div>

                            <p className="text-slate-400 text-sm mb-6 h-10">{plan.description}</p>

                            <div className="mb-6 flex items-end gap-1">
                                <span className="text-4xl font-black text-white">{format(plan.priceUSD, { decimals: plan.priceUSD % 1 === 0 ? 0 : 2 })}</span>
                                {plan.hasMonthly && (
                                    <span className="text-slate-500 mb-1 font-medium">/mo</span>
                                )}
                            </div>

                            <div className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="mt-1 shrink-0 w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
                                            <Check className="w-2.5 h-2.5 text-slate-300" />
                                        </div>
                                        <span className="text-sm text-slate-300">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => handleUpgrade(plan.id)}
                                disabled={isCurrentPlan || loadingPlan !== null}
                                className={`w-full py-3 rounded-xl font-medium text-sm transition-all flex justify-center items-center gap-2 ${isCurrentPlan
                                    ? 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                                    : isPopular
                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25'
                                        : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                                    }`}
                            >
                                {loadingPlan === plan.id ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                                    </>
                                ) : isCurrentPlan ? (
                                    'Current Plan'
                                ) : (
                                    `Upgrade to ${plan.name}`
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
