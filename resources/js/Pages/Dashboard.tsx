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

interface DrinkSale {
    name: string;
    quantity_litres: number;
    quantity_servings: number;
    end_stock_servings?: number;
    cost: number;
    retail_price: number;
    profit: number;
    margin_per_serving: number;
}

interface PubSale {
    pub_id: number;
    pub_name: string;
    capacity_servings: number;
    sales_servings: number;
    revenue: number;
    cogs: number;
    vat: number;
    alcohol_duty: number;
    litres_sold: number;
    drinks?: DrinkSale[];
}

interface TurnDetails {
    pubs: PubSale[];
    paid_liabilities?: number;
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
    depreciation: number;
    litres_brewed: number;
    litres_sold: number;
    tax_breakdown: TaxBreakdown;
    details?: TurnDetails;
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

interface Liability {
    id: number;
    type: string;
    amount: string;
    due_date: string;
}

interface Props {
    balance: number;
    latestTurn: Turn | null;
    recentTurns: Turn[];
    nextWeek: string;
    pendingActions: number;
    pubs: Pub[];
    breweries: Brewery[];
    liabilities: Liability[];
}

const fmt = (n: number, decimals = 2) =>
    '£' + Number(n).toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export default function Dashboard({ balance, latestTurn, recentTurns, nextWeek, pendingActions, pubs, breweries, liabilities = [] }: Props) {
    const { post, processing } = useForm({});

    const advanceTurn = () => post(route('turn.store'));

    const groupedLiabilities = Object.values(
        liabilities.reduce((acc, l) => {
            const key = `${l.type}-${l.due_date}`;
            if (!acc[key]) {
                acc[key] = { ...l, amount: String(l.amount) };
            } else {
                acc[key].amount = String(Number(acc[key].amount) + Number(l.amount));
            }
            return acc;
        }, {} as Record<string, Liability>)
    );

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
                        
                        <div className="grid md:grid-cols-2 gap-8 mb-6">
                            {/* P&L Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-stone-400 mb-3 uppercase tracking-wider">Profit & Loss (Accrual)</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm"><span className="text-stone-500">Revenue</span><span className="text-green-400">{fmt(latestTurn.revenue)}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-stone-500">COGS</span><span className="text-stone-300">-{fmt(latestTurn.cogs)}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-stone-500">Operating Costs</span><span className="text-stone-300">-{fmt(latestTurn.costs)}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-stone-500">Wages</span><span className="text-stone-300">-{fmt(latestTurn.wages)}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-stone-500">Taxes (Accrued)</span><span className="text-stone-300">-{fmt(latestTurn.taxes)}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-stone-500">Depreciation</span><span className="text-stone-300">-{fmt(latestTurn.depreciation)}</span></div>
                                    <div className="flex justify-between text-sm font-bold border-t border-stone-800 pt-2">
                                        <span className="text-stone-300">Net Profit</span>
                                        <span className={latestTurn.profit >= 0 ? 'text-green-400' : 'text-red-400'}>{fmt(latestTurn.profit)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Cash Flow Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-stone-400 mb-3 uppercase tracking-wider">Cash Flow</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm"><span className="text-stone-500">Cash In (Revenue)</span><span className="text-green-400">{fmt(latestTurn.revenue)}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-stone-500">Cash Out (Op Costs + Wages)</span><span className="text-red-400">-{fmt(Number(latestTurn.costs) + Number(latestTurn.wages))}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-stone-500">Liabilities Paid to HMRC</span><span className="text-red-400">-{fmt(latestTurn.details?.paid_liabilities ?? 0)}</span></div>
                                    <div className="flex justify-between text-sm font-bold border-t border-stone-800 pt-2">
                                        <span className="text-stone-300">Net Cash Change</span>
                                        <span className={(latestTurn.revenue - latestTurn.costs - latestTurn.wages - (latestTurn.details?.paid_liabilities ?? 0)) >= 0 ? 'text-green-400' : 'text-red-400'}>
                                            {fmt(latestTurn.revenue - latestTurn.costs - latestTurn.wages - (latestTurn.details?.paid_liabilities ?? 0))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {latestTurn.tax_breakdown && (
                            <>
                                <h3 className="text-sm font-semibold text-stone-400 mb-3 uppercase tracking-wider">Taxes Incurred This Turn (Accrued to Liabilities)</h3>
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

                        {latestTurn.details?.pubs && latestTurn.details.pubs.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-sm font-semibold text-stone-400 mb-3 uppercase tracking-wider">Drinks Sold Breakdown</h3>
                                {latestTurn.details.pubs.map(pub => (
                                    pub.drinks && pub.drinks.length > 0 && (
                                        <div key={pub.pub_id} className="mb-4 last:mb-0 rounded-xl bg-stone-800/30 border border-stone-800 overflow-hidden">
                                            <div className="px-4 py-2 bg-stone-800/50 border-b border-stone-800/50 flex justify-between items-center">
                                                <h4 className="font-medium text-stone-300">{pub.pub_name}</h4>
                                                <span className="text-xs text-stone-400">
                                                    (Capacity: {pub.capacity_servings ?? 0}, Sales: {pub.sales_servings ?? 0})
                                                </span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="text-stone-500 text-xs uppercase tracking-wider border-b border-stone-800">
                                                            <th className="px-4 py-2 text-left">Drink</th>
                                                            <th className="px-4 py-2 text-right">Quantity (Servings)</th>
                                                            <th className="px-4 py-2 text-right">Cost</th>
                                                            <th className="px-4 py-2 text-right">Retail Price</th>
                                                            <th className="px-4 py-2 text-right">Profit/Loss</th>
                                                            <th className="px-4 py-2 text-right">Margin/Serving</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pub.drinks.map((drink, idx) => (
                                                            <tr key={idx} className="border-b border-stone-800/30 hover:bg-stone-800/20 transition-colors">
                                                                <td className="px-4 py-2 text-stone-300">
                                                                    {drink.name}
                                                                    {drink.end_stock_servings !== undefined && drink.end_stock_servings < drink.quantity_servings && (
                                                                        <span className="text-amber-500 font-medium ml-2 text-xs uppercase tracking-wider">(Low Stock)</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-2 text-right text-stone-400">{Math.round(drink.quantity_servings)}</td>
                                                                <td className="px-4 py-2 text-right text-stone-400">{fmt(drink.cost)}</td>
                                                                <td className="px-4 py-2 text-right text-stone-400">{fmt(drink.retail_price)}</td>
                                                                <td className={`px-4 py-2 text-right font-medium ${drink.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                    {fmt(drink.profit)}
                                                                </td>
                                                                <td className={`px-4 py-2 text-right font-medium ${(drink.margin_per_serving ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                    {fmt(drink.margin_per_serving ?? 0)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {/* Upcoming Liabilities */}
                {liabilities.length > 0 && (
                    <div className="rounded-2xl border border-stone-800 bg-stone-900/40 p-6">
                        <h2 className="text-lg font-semibold text-stone-200 mb-4 flex justify-between items-center">
                            <span>Upcoming Tax Liabilities</span>
                            <span className="text-sm font-normal text-stone-400">Total: <span className="text-red-400 font-semibold">{fmt(liabilities.reduce((sum, l) => sum + Number(l.amount), 0))}</span></span>
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-stone-500 text-xs uppercase tracking-wider border-b border-stone-800">
                                        <th className="px-4 py-2 text-left">Tax Type</th>
                                        <th className="px-4 py-2 text-right">Amount Due</th>
                                        <th className="px-4 py-2 text-right">Due Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedLiabilities.map(l => (
                                        <tr key={`${l.type}-${l.due_date}`} className="border-b border-stone-800/30 hover:bg-stone-800/20 transition-colors">
                                            <td className="px-4 py-2 text-stone-300 capitalize">{l.type.replace('_', ' ')}</td>
                                            <td className="px-4 py-2 text-right font-medium text-red-400">{fmt(Number(l.amount))}</td>
                                            <td className="px-4 py-2 text-right text-stone-400">{l.due_date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-3 text-xs text-stone-500 text-right">
                            * Automatically deducted from cash on or after the due date.
                        </div>
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
