import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const fmt = (n: number, decimals: number = 2) => '£' + Number(n).toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

interface Stats {
    total_players: number;
    active_players: number;
    cumulative_revenue: number;
    cumulative_profit: number;
    total_tax_paid: number;
    outstanding_tax: number;
    indirect_tax: number;
    tax_breakdown: Record<string, number>;
}

interface Turn {
    id: number;
    week_commencing: string;
    revenue: number;
    profit: number;
    taxes: number;
    user: { name: string; username: string };
}

export default function AdminDashboard({ stats, recentTurns }: { stats: Stats; recentTurns: Turn[] }) {
    return (
        <AppLayout>
            <Head title="Admin Dashboard — Drinking for Britain" />

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-stone-100">Admin Dashboard</h1>
                <div className="flex gap-3">
                    <Link href={route('admin.players.index')} className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 text-sm transition-colors">
                        Players →
                    </Link>
                    <Link href={route('admin.settings.index')} className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 text-sm transition-colors">
                        Settings →
                    </Link>
                </div>
            </div>

            {/* Overview stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatCard label="Total Players" value={String(stats.total_players)} />
                <StatCard label="Active Players" value={String(stats.active_players)} />
                <StatCard label="Total Revenue" value={fmt(stats.cumulative_revenue)} highlight />
                <StatCard label="Total Tax Paid" value={fmt(stats.total_tax_paid)} highlight />
                <StatCard label="Outstanding Tax" value={fmt(stats.outstanding_tax)} />
                <StatCard label="Indirect Supply Tax" value={fmt(stats.indirect_tax)} />
            </div>

            {/* Tax breakdown */}
            <div className="rounded-2xl border border-stone-800 bg-stone-900/40 p-6 mb-6">
                <h2 className="font-semibold text-stone-200 mb-4">HMRC Breakdown (All Players, All Time)</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {Object.entries(stats.tax_breakdown).map(([type, amount]) => (
                        <div key={type} className="rounded-xl bg-stone-800/50 border border-stone-700/30 p-3 text-center">
                            <div className="text-xs text-stone-500 mb-1 capitalize">{type.replace(/_/g, ' ')}</div>
                            <div className="text-sm font-semibold text-amber-400">{fmt(amount)}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent turns */}
            <div className="rounded-2xl border border-stone-800 bg-stone-900/40 overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-800 font-semibold text-stone-200">Recent Turns (All Players)</div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-stone-500 text-xs uppercase tracking-wider border-b border-stone-800">
                            <th className="px-6 py-3 text-left">Player</th>
                            <th className="px-6 py-3 text-left">Week</th>
                            <th className="px-6 py-3 text-right">Revenue</th>
                            <th className="px-6 py-3 text-right">Tax</th>
                            <th className="px-6 py-3 text-right">Profit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentTurns.map(t => (
                            <tr key={t.id} className="border-b border-stone-800/50 hover:bg-stone-800/20">
                                <td className="px-6 py-3">
                                    <span className="text-stone-200">{t.user.name}</span>
                                    <span className="text-stone-500 text-xs ml-2">@{t.user.username}</span>
                                </td>
                                <td className="px-6 py-3 text-stone-400">{t.week_commencing}</td>
                                <td className="px-6 py-3 text-right text-stone-300">{fmt(t.revenue)}</td>
                                <td className="px-6 py-3 text-right text-red-400">{fmt(t.taxes)}</td>
                                <td className={`px-6 py-3 text-right font-medium ${t.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {fmt(t.profit)}
                                </td>
                            </tr>
                        ))}
                        {recentTurns.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-stone-500">No turns played yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}

function StatCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className={`rounded-xl p-4 border ${highlight ? 'border-amber-500/30 bg-amber-950/10' : 'border-stone-800 bg-stone-900/40'}`}>
            <div className="text-xs text-stone-500 mb-1">{label}</div>
            <div className={`text-xl font-bold ${highlight ? 'text-amber-400' : 'text-stone-100'}`}>{value}</div>
        </div>
    );
}
