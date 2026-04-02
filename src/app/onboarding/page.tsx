'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Check, Zap, Building, Loader2, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
    const { update } = useSession();
    const router = useRouter();

    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSelectPlan = async (plan: string) => {
        setLoadingPlan(plan);
        setError(null);

        if (plan === 'free') {
            try {
                const res = await fetch('/api/user/upgrade', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan })
                });
                if (!res.ok) throw new Error('Failed to set plan');
                await update({ plan });
                router.push('/dashboard');
            } catch (err: any) {
                setError(err.message || 'Error configuring workspace.');
                setLoadingPlan(null);
            }
            return;
        }

        // PayHere Checkout for Pro / Business
        try {
            // Get current base URL for redirecting exactly back to dashboard seamlessly
            const baseUrl = window.location.origin;

            const res = await fetch('/api/payments/payhere/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    type: 'plan', 
                    id: plan,
                    returnUrl: `${baseUrl}/dashboard`
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to initialize PayHere checkout');

            const params = data;

            // Submit hidden form to PayHere
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = params.payhere_url || 'https://sandbox.payhere.lk/pay/checkout';

            Object.entries(params).forEach(([key, value]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value as string;
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
        } catch (err: any) {
            setError(err.message || 'Payment initialization failed');
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
            buttonLabel: 'Continue with Free',
        },
        {
            id: 'pro',
            name: 'Pro',
            priceUSD: 9.99,
            hasMonthly: true,
            description: 'For growing freelancers.',
            features: ['Unlimited clients', 'Advanced tax tracking', 'Custom PDF design', 'Priority support'],
            icon: <Zap className="w-5 h-5 text-purple-400" />,
            buttonLabel: 'Upgrade to Pro',
        },
        {
            id: 'business',
            name: 'Business',
            priceUSD: 29.99,
            hasMonthly: true,
            description: 'For agencies and teams.',
            features: ['Everything in Pro', 'Team accounts', 'API Access', 'White-labeling'],
            icon: <Building className="w-5 h-5 text-indigo-400" />,
            buttonLabel: 'Upgrade to Business',
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-16 flex items-center justify-center">
            <div className="max-w-5xl w-full">
                
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Choose Your Plan</h1>
                    <p className="text-slate-400">Select the plan that best fits your freelance business.</p>
                </div>

                {error && (
                    <div className="max-w-md mx-auto mb-8 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                        const isPopular = plan.id === 'pro';

                        return (
                            <div
                                key={plan.id}
                                className={`relative bg-slate-900 rounded-3xl p-8 border flex flex-col ${isPopular
                                    ? 'border-purple-500 ring-1 ring-purple-500/50 shadow-2xl shadow-purple-500/10 scale-105 z-10'
                                    : 'border-white/10'
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
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                        {plan.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                </div>

                                <p className="text-slate-400 text-sm mb-6 h-10">{plan.description}</p>

                                <div className="mb-6 flex items-end gap-1">
                                    <span className="text-4xl font-black text-white">${plan.priceUSD}</span>
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
                                    onClick={() => handleSelectPlan(plan.id)}
                                    disabled={loadingPlan !== null}
                                    className={`w-full py-3 rounded-xl font-medium text-sm transition-all flex justify-center items-center gap-2 ${isPopular
                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25'
                                        : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                                        }`}
                                >
                                    {loadingPlan === plan.id ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                                        </>
                                    ) : (
                                        <>
                                            {plan.buttonLabel}
                                            <ArrowRight className="w-4 h-4 ml-1" />
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
