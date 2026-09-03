import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState } from 'react';

interface Pub { id: number; name: string; category: string; tenure: string; is_active: boolean; staff: any[]; }
interface Brewery { id: number; name: string; capacity_litres: number; is_active: boolean; staff: any[]; }
interface Turn {
    id: number;
    week_commencing: string;
    financial_year: string;
    revenue: number;
    cogs: number;
    costs: number;
    wages: number;
    taxes: number;
    depreciation: number;
    profit: number;
}
interface TaxPayment { type: string; amount: number; }

interface Player {
    id: number;
    name: string;
    username: string;
    email: string | null;
    balance: number;
    is_paused: boolean;
    started_at: string | null;
    pubs: Pub[];
    breweries: Brewery[];
    turns: Turn[];
    tax_payments: TaxPayment[];
}

const fmt = (n: number, decimals: number = 2) => '£' + Number(n).toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export default function AdminPlayerShow({
    player,
    taxTotals,
}: {
    player: Player;
    taxTotals: Record<string, number>;
}) {
    const totalTax = Object.values(taxTotals).reduce((a, b) => a + b, 0);
    const { post, processing } = useForm();

    const handleReset = () => {
        if (confirm("Are you sure you want to reset this player? This will wipe ALL their progress and reset their cash to £100,000.")) {
            post(route('admin.players.reset', player.id));
        }
    };

    const groupedTurns = player.turns.reduce((acc, turn) => {
        const year = turn.financial_year || 'Unknown';
        if (!acc[year]) {
            acc[year] = {
                year,
                revenue: 0,
                cogs: 0,
                costs: 0,
                wages: 0,
                taxes: 0,
                depreciation: 0,
                profit: 0,
                turns: []
            };
        }
        const y = acc[year];
        y.revenue += Number(turn.revenue || 0);
        y.cogs += Number(turn.cogs || 0);
        y.costs += Number(turn.costs || 0);
        y.wages += Number(turn.wages || 0);
        y.taxes += Number(turn.taxes || 0);
        y.depreciation += Number(turn.depreciation || 0);
        y.profit += Number(turn.profit || 0);
        y.turns.push(turn);
        return acc;
    }, {} as Record<string, any>);

    const years = Object.values(groupedTurns).sort((a, b) => b.year.localeCompare(a.year));

    return (
        <AppLayout>
            <Head title={`${player.name} — Admin`} />

            <div className="flex items-center gap-4 mb-6">
                <Link href={route('admin.players.index')} className="text-stone-500 hover:text-stone-300 text-sm">
                    ← Players
                </Link>
                <h1 className="text-2xl font-bold text-stone-100">{player.name}</h1>
                <span className="text-stone-500">@{player.username}</span>
                {player.is_paused && (
                    <span className="px-2 py-0.5 rounded bg-red-900/40 text-red-400 text-xs font-medium">Paused</span>
                )}
                
                <div className="ml-auto">
                    <button
                        onClick={handleReset}
                        disabled={processing}
                        className="px-4 py-2 bg-red-900/80 hover:bg-red-800 text-red-100 rounded-lg text-sm font-medium transition"
                    >
                        Reset Player
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Balance" value={fmt(player.balance)} highlight />
                <StatCard label="Pubs" value={String(player.pubs.length)} />
                <StatCard label="Breweries" value={String(player.breweries.length)} />
                <StatCard label="Turns Played" value={String(player.turns.length)} />
            </div>

            {/* Tax totals */}
            <div className="rounded-2xl border border-stone-800 bg-stone-900/40 p-6 mb-6">
                <h2 className="font-semibold text-stone-200 mb-4">Total Tax Contributions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(taxTotals).map(([type, amount]) => (
                        <div key={type} className="rounded-xl bg-stone-800/50 p-3 text-center">
                            <div className="text-xs text-stone-500 mb-1 capitalize">{type.replace(/_/g, ' ')}</div>
                            <div className="text-sm font-semibold text-amber-400">{fmt(amount)}</div>
                        </div>
                    ))}
                </div>
                <div className="mt-3 text-sm text-stone-400">
                    <strong className="text-amber-400">{fmt(totalTax)}</strong> total paid to HMRC
                </div>
            </div>

            {/* Financial Statements */}
            <div className="mb-6">
                <h2 className="font-semibold text-stone-200 text-xl mb-4">Financial Statements</h2>
                
                {years.length === 0 ? (
                    <div className="text-stone-500 text-sm">No turns played yet.</div>
                ) : (
                    <div className="space-y-6">
                        {years.map((y) => (
                            <div key={y.year} className="rounded-2xl border border-stone-800 bg-stone-900/40 overflow-hidden">
                                <div className="px-6 py-4 border-b border-stone-800 flex justify-between items-center bg-stone-950/30">
                                    <h3 className="font-bold text-stone-200">Year {y.year}</h3>
                                    <div className="text-sm text-stone-400">{y.turns.length} turns</div>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-stone-800/50">
                                            <span className="text-stone-400">Revenue</span>
                                            <span className="font-medium text-stone-200">{fmt(y.revenue)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-stone-800/50">
                                            <span className="text-stone-400">Cost of Goods Sold (COGS)</span>
                                            <span className="text-stone-300">({fmt(y.cogs)})</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-stone-800/50">
                                            <span className="text-stone-400">Operating Costs</span>
                                            <span className="text-stone-300">({fmt(y.costs)})</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-stone-800/50">
                                            <span className="text-stone-400">Wages</span>
                                            <span className="text-stone-300">({fmt(y.wages)})</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-stone-800/50">
                                            <span className="text-stone-400">Depreciation</span>
                                            <span className="text-stone-300">({fmt(y.depreciation)})</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-stone-800/50">
                                            <span className="text-stone-400">Tax</span>
                                            <span className="text-stone-300 text-red-400">({fmt(y.taxes)})</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-stone-200 font-semibold">Net Profit</span>
                                            <span className={`font-bold text-lg ${y.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {fmt(y.profit)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
