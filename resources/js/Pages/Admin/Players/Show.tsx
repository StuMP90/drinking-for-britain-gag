import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

interface Pub { id: number; name: string; category: string; tenure: string; is_active: boolean; staff: any[]; }
interface Brewery { id: number; name: string; capacity_litres: number; is_active: boolean; staff: any[]; }
interface Turn { id: number; week_commencing: string; revenue: number; taxes: number; profit: number; }
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

const fmt = (n: number) => '£' + Number(n).toLocaleString('en-GB', { minimumFractionDigits: 2 });

export default function AdminPlayerShow({
    player,
    taxTotals,
}: {
    player: Player;
    taxTotals: Record<string, number>;
}) {
    const totalTax = Object.values(taxTotals).reduce((a, b) => a + b, 0);

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

            {/* Turn history */}
            {player.turns.length > 0 && (
                <div className="rounded-2xl border border-stone-800 bg-stone-900/40 overflow-hidden mb-6">
                    <div className="px-6 py-4 border-b border-stone-800 font-semibold text-stone-200">Turn History</div>
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
                            {player.turns.map(t => (
                                <tr key={t.id} className="border-b border-stone-800/50">
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
            )}
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
