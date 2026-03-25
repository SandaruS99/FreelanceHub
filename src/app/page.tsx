import Link from 'next/link';
// Project Delivery & WhatsApp Integration Live - v1.0.1
import {
  Briefcase, CheckCircle, Users, FolderKanban, FileText, BarChart2, MessageSquare, ArrowRight, Star
} from 'lucide-react';

const features = [
  { icon: Users, title: 'Client Management', desc: 'Organize all your clients with tags, notes, and contact history. Import from CSV.' },
  { icon: FolderKanban, title: 'Project Tracking', desc: 'Kanban boards, milestones, deadlines, and file attachments — all in one place.' },
  { icon: CheckCircle, title: 'Task Management', desc: 'Never miss a deadline. Manage tasks with priorities across all your projects.' },
  { icon: FileText, title: 'Invoice Builder', desc: 'Create professional PDF invoices in seconds. Share via link or email.' },
  { icon: MessageSquare, title: 'CRM Log', desc: 'Replace endless WhatsApp scroll with a clean communication history per client.' },
  { icon: BarChart2, title: 'Reports & Analytics', desc: 'Track revenue, top clients, and business growth with beautiful charts.' },
];

const plans = [
  { name: 'Free', price: '$0', period: 'forever', features: ['5 Clients', '10 Projects', '5 Invoices/month', 'Basic analytics'], highlighted: false, cta: 'Get Started Free' },
  { name: 'Pro', price: '$12', period: 'per month', features: ['Unlimited Clients', 'Unlimited Projects', 'Unlimited Invoices', 'Custom branding', 'Client portal', 'Priority support'], highlighted: true, cta: 'Start Pro Trial' },
  { name: 'Business', price: '$29', period: 'per month', features: ['Everything in Pro', 'Team members', 'Expense tracking', 'Contract templates', 'API access', 'Dedicated support'], highlighted: false, cta: 'Start Business Trial' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">FreelanceHub</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-slate-400 hover:text-white text-sm font-medium transition px-3 py-1.5">
              Sign in
            </Link>
            <Link href="/auth/register" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold px-5 py-2 rounded-xl transition shadow-lg shadow-purple-500/30">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 text-sm text-purple-300 mb-8">
          <Star className="w-3.5 h-3.5 fill-current" />
          Built for independent freelancers
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight mb-6">
          Stop managing clients<br />
          <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            in WhatsApp & Excel
          </span>
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          FreelanceHub gives you one powerful workspace to manage clients, projects, tasks, and invoices — so you can focus on what you do best.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/register" className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-purple-500/30 text-lg">
            Start for Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-medium px-6 py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition text-sm">
            Already have an account?
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything you need to run your freelance business</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">All the tools in one place, designed specifically for solo freelancers.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all duration-200 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg group-hover:shadow-purple-500/30 transition">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple, transparent pricing</h2>
          <p className="text-slate-400 text-lg">Start free, upgrade when you&apos;re ready.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(({ name, price, period, features: planFeatures, highlighted, cta }) => (
            <div key={name} className={`rounded-2xl p-6 border ${highlighted ? 'bg-gradient-to-b from-purple-600/20 to-indigo-600/10 border-purple-500/40 relative' : 'bg-white/5 border-white/10'}`}>
              {highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-white font-bold text-lg mb-1">{name}</h3>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-black text-white">{price}</span>
                  <span className="text-slate-400 text-sm mb-1">/{period}</span>
                </div>
              </div>
              <ul className="space-y-2.5 mb-6">
                {planFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register" className={`block text-center py-3 rounded-xl font-semibold text-sm transition ${highlighted ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/30' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'}`}>
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-slate-400 text-sm font-medium">FreelanceHub</span>
          </div>
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} FreelanceHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
