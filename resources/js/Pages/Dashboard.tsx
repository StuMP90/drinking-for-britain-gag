import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

interface TaxBreakdown {
    income_tax: number;
    employee_ni: number;
    employer_ni: number;
    vat: number;
    alcohol_duty: number;
    corporation_tax: number;
    total: number;
}

interface Turn {
    id: number;
    week_commencing: string;
    financial_year: string;
    revenue: number;
    cogs: number;
    costs: number;
    wages: number;
    taxes: number;
    profit: number;
    litres_sold: number;
    tax_breakdown: TaxBreakdown;
}

interface Pub {
    id: number;
    name: string;
    category: string;
    tenure: string;
    customer_capacity: number;
    has_sports_tv: boolean;
    is_active: boolean;
    staff: any[];
    stocks: any[];
}

interface Brewery {
    id: number;
    name: string;
    capacity_litres: number;
    is_active: boolean;
    staff: any[];
    ingredients: any[];
}

interface Props {
    balance: number;
    latestTurn: Turn | null;
    recentTurns: Turn[];
    nextWeek: string;
    pendingActions: number;
    pubs: Pub[];
    breweries: Brewery[];
}

const fmt = (n: number, decimals = 2) =>
    '£' + Number(n).toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export default function Dashboard({ balance, latestTurn, recentTurns, nextWeek, pendingActions, pubs, breweries }: Props) {
    const { post, processing } = useForm({});

    const advanceTurn = () => post(route('turn.store'));

    return (
        <AppLayout>
            <Head title="Dashboard — Drinking for Britain" />

            <div className="space-y-6">
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-100">Dashboard</h1>
                        <p className="text-stone-500 text-sm mt-0.5">Next turn: week of {nextWeek}</p>
                    </div>
                    <button
                        id="advance-turn-btn"
                        onClick={advanceTurn}
                        disabled={processing}
                        className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0d0d12] font-bold text-sm transition-colors shadow-lg shadow-amber-900/30"
                    >
                        {processing ? 'Processing…' : '⏩ Advance Turn'}
                    </button>
                </div>

                {/* Pending actions banner */}
                {pendingActions > 0 && (
                    <div className="px-4 py-3 rounded-xl bg-blue-950/40 border border-blue-700/30 text-blue-300 text-sm">
                        📋 {pendingActions} action{pendingActions !== 1 ? 's' : ''} queued for next turn
                    </div>
                )}

                {/* Key metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard label="Balance" value={fmt(balance)} highlight />
                    <MetricCard label="Pubs" value={`${pubs.filter(p => p.is_active).length}`} />
                    <MetricCard label="Breweries" value={`${breweries.filter(b => b.is_active).length}`} />
                    <MetricCard label="Total Staff" value={`${pubs.reduce((a, p) => a + p.staff.length, 0) + breweries.reduce((a, b) => a + b.staff.length, 0)}`} />
                </div>

                {/* Latest turn results */}
                {latestTurn && (
                    <div className="rounded-2xl border border-stone-800 bg-stone-900/40 p-6">
                        <h2 className="text-lg font-semibold text-stone-200 mb-4">
                            Last Turn — w/c {latestTurn.week_commencing} ({latestTurn.financial_year})
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <FinRow label="Revenue" value={fmt(latestTurn.revenue)} positive />
                            <FinRow label="COGS" value={fmt(latestTurn.cogs)} />
                            <FinRow label="Operating Costs" value={fmt(latestTurn.costs)} />
                            <FinRow label="Wages" value={fmt(latestTurn.wages)} />
                            <FinRow label="Total Tax" value={fmt(latestTurn.taxes)} negative />
                            <FinRow label="Net Profit" value={fmt(latestTurn.profit)} positive={latestTurn.profit > 0} negative={latestTurn.profit < 0} />
                            <FinRow label="Litres Sold" value={`${Number(latestTurn.litres_sold).toFixed(1)}L`} />
                        </div>

                        {latestTurn.tax_breakdown && (
                            <>
                                <h3 className="text-sm font-semibold text-stone-400 mb-3 uppercase tracking-wider">Tax Breakdown (paid to HMRC)</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                    {[
                                        { label: 'Income Tax', key: 'income_tax' },
                                        { label: 'Employee NI', key: 'employee_ni' },
                                        { label: 'Employer NI', key: 'employer_ni' },
                                        { label: 'VAT', key: 'vat' },
                                        { label: 'Alcohol Duty', key: 'alcohol_duty' },
                                        { label: 'Corp Tax', key: 'corporation_tax' },
                                    ].map(({ label, key }) => (
                                        <div key={key} className="rounded-xl bg-stone-800/50 border border-stone-700/40 p-3 text-center">
                                            <div className="text-xs text-stone-500 mb-1">{label}</div>
                                            <div className="text-sm font-semibold text-amber-400">
                                                {fmt(latestTurn.tax_breakdown[key as keyof TaxBreakdown] ?? 0)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {!latestTurn && (
                    <div className="rounded-2xl border border-stone-800 bg-stone-900/30 p-10 text-center text-stone-500">
                        <div className="text-4xl mb-3">🍺</div>
                        <p className="font-medium text-stone-400">No turns played yet.</p>
                        <p className="text-sm mt-1">Build a pub, hire staff, buy stock, then advance your first turn.</p>
                    </div>
                )}

                {/* Recent turns table */}
                {recentTurns.length > 1 && (
                    <div className="rounded-2xl border border-stone-800 bg-stone-900/40 overflow-hidden">
                        <div className="px-6 py-4 border-b border-stone-800">
                            <h2 className="font-semibold text-stone-200">Turn History</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-stone-500 text-xs uppercase tracking-wider border-b border-stone-800">
                                        <th className="px-6 py-3 text-left">Week</th>
                                        <th className="px-6 py-3 text-right">Revenue</th>
                                        <th className="px-6 py-3 text-right">Tax</th>
                                        <th className="px-6 py-3 text-right">Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTurns.map(t => (
                                        <tr key={t.id} className="border-b border-stone-800/50 hover:bg-stone-800/30 transition-colors">
                                            <td className="px-6 py-3 text-stone-300">{t.week_commencing}</td>
                                            <td className="px-6 py-3 text-right text-stone-300">{fmt(t.revenue)}</td>
                                            <td className="px-6 py-3 text-right text-red-400">{fmt(t.taxes)}</td>
                                            <td className={`px-6 py-3 text-right font-medium ${t.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {fmt(t.profit)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function MetricCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className={`rounded-xl p-4 border ${highlight ? 'border-amber-500/30 bg-amber-950/10' : 'border-stone-800 bg-stone-900/40'}`}>
            <div className="text-xs text-stone-500 mb-1">{label}</div>
            <div className={`text-xl font-bold ${highlight ? 'text-amber-400' : 'text-stone-100'}`}>{value}</div>
        </div>
    );
}

function FinRow({ label, value, positive = false, negative = false }: {
    label: string; value: string; positive?: boolean; negative?: boolean;
}) {
    return (
        <div className="rounded-xl bg-stone-800/50 border border-stone-700/30 p-3">
            <div className="text-xs text-stone-500 mb-1">{label}</div>
            <div className={`text-sm font-semibold ${positive ? 'text-green-400' : negative ? 'text-red-400' : 'text-stone-200'}`}>
                {value}
            </div>
        </div>
    );
}
