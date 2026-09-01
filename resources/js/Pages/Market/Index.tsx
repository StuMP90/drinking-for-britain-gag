import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState } from 'react';

interface Listing {
    id: number;
    name: string;
    abv: number;
    price: number;
    retail_price: number;
    supply: number;
}

interface Pub { id: number; name: string; }

interface Props {
    products: Listing[];
    pubs: Pub[];
    balance: number;
}

const fmt = (n: number | string) =>
    '£' + Number(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function servingLabel(abv: number): string {
    if (abv > 22) return '25ml';
    if (abv > 8)  return '175ml';
    return 'pint';
}

export default function MarketIndex({ products, pubs, balance }: Props) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flash = (usePage().props as any).flash as { success?: string } | undefined;

    const [selected, setSelected] = useState<Listing | null>(null);

    const form = useForm({
        market_listing_id: '',
        pub_id: pubs[0]?.id ? String(pubs[0].id) : '',
        quantity_litres: 50,
    });

    const totalCost = selected ? Number(selected.price) * form.data.quantity_litres : 0;
    const canAfford = totalCost <= balance;
    const inStock   = selected ? form.data.quantity_litres <= Number(selected.supply) : true;

    function select(listing: Listing) {
        setSelected(listing);
        form.setData('market_listing_id', String(listing.id));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(route('market.buy-product'), {
            onSuccess: () => {
                // keep selection so player can buy more
            },
        });
    }

    return (
        <AppLayout title="Market">
            <Head title="Market — Drinking for Britain" />

            <div className="max-w-5xl mx-auto space-y-6">

                {/* Balance banner */}
                <div className="flex items-center justify-between px-5 py-3 rounded-xl bg-stone-900/60 border border-stone-800">
                    <span className="text-stone-400 text-sm">Your balance</span>
                    <span className="text-xl font-bold text-amber-400">{fmt(balance)}</span>
                </div>

                {/* Flash success */}
                {flash?.success && (
                    <div className="px-5 py-3 rounded-xl bg-green-900/30 border border-green-700/40 text-green-300 text-sm">
                        ✓ {flash.success}
                    </div>
                )}

                <p className="text-stone-500 text-sm">
                    Purchasing finished products delivers stock to your pub immediately and deducts your balance.
                    Brewing ingredients are handled automatically when you queue a brew at your brewery.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* Product list — 3 cols */}
                    <div className="lg:col-span-3 rounded-2xl border border-stone-800 bg-stone-900/40 overflow-hidden">
                        <div className="px-5 py-4 border-b border-stone-800">
                            <h2 className="font-semibold text-stone-200">Available Products</h2>
                            <p className="text-xs text-stone-500 mt-0.5">Click a row to select it</p>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-stone-500 text-xs uppercase tracking-wider border-b border-stone-800">
                                    <th className="px-5 py-3 text-left">Product</th>
                                    <th className="px-5 py-3 text-right">ABV</th>
                                    <th className="px-5 py-3 text-right">Wholesale/L</th>
                                    <th className="px-5 py-3 text-right">RRP/serving</th>
                                    <th className="px-5 py-3 text-right">Supply</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <tr
                                        key={p.id}
                                        id={`product-row-${p.id}`}
                                        onClick={() => select(p)}
                                        className={`border-b border-stone-800/50 cursor-pointer transition-colors select-none ${
                                            selected?.id === p.id
                                                ? 'bg-amber-900/25 ring-1 ring-inset ring-amber-500/40'
                                                : 'hover:bg-stone-800/40'
                                        }`}
                                    >
                                        <td className="px-5 py-3 text-stone-200 font-medium">
                                            {selected?.id === p.id && <span className="mr-2 text-amber-400">›</span>}
                                            {p.name}
                                        </td>
                                        <td className="px-5 py-3 text-right text-stone-400">{Number(p.abv).toFixed(1)}%</td>
                                        <td className="px-5 py-3 text-right font-mono text-amber-400">{fmt(p.price)}</td>
                                        <td className="px-5 py-3 text-right font-mono text-green-400">
                                            {fmt(p.retail_price)}
                                            <span className="text-xs text-stone-500 ml-1">/{servingLabel(Number(p.abv))}</span>
                                        </td>
                                        <td className="px-5 py-3 text-right text-stone-400">
                                            {Number(p.supply).toLocaleString('en-GB', { maximumFractionDigits: 0 })}L
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-center text-stone-500">
                                            No products available this week.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Purchase form — 2 cols */}
                    <div className="lg:col-span-2">
                        <form
                            id="market-buy-form"
                            onSubmit={submit}
                            className="rounded-2xl border border-stone-800 bg-stone-900/40 p-5 space-y-4 sticky top-20"
                        >
                            <h2 className="font-semibold text-stone-200">Buy Stock</h2>

                            {!selected && (
                                <p className="text-stone-500 text-sm py-4 text-center">
                                    ← Select a product from the table
                                </p>
                            )}

                            {selected && (
                                <>
                                    {/* Selected product summary */}
                                    <div className="rounded-lg bg-stone-800/60 border border-stone-700/40 p-3">
                                        <div className="font-medium text-stone-200">{selected.name}</div>
                                        <div className="flex gap-4 mt-1 text-xs text-stone-500">
                                            <span>{Number(selected.abv).toFixed(1)}% ABV</span>
                                            <span>{fmt(selected.price)}/L wholesale</span>
                                            <span>{fmt(selected.retail_price)}/L RRP</span>
                                        </div>
                                    </div>

                                    {/* Pub */}
                                    <div>
                                        <label className="text-xs text-stone-400 block mb-1.5" htmlFor="market-pub-select">
                                            Deliver to pub
                                        </label>
                                        {pubs.length === 0 ? (
                                            <p className="text-sm text-red-400">You have no pubs yet.</p>
                                        ) : (
                                            <select
                                                id="market-pub-select"
                                                className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                value={form.data.pub_id}
                                                onChange={e => form.setData('pub_id', e.target.value)}
                                                required
                                            >
                                                <option value="">— Select pub —</option>
                                                {pubs.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        )}
                                        {form.errors.pub_id && (
                                            <p className="text-xs text-red-400 mt-1">{form.errors.pub_id}</p>
                                        )}
                                    </div>

                                    {/* Quantity */}
                                    <div>
                                        <label className="text-xs text-stone-400 block mb-1.5" htmlFor="market-qty">
                                            Quantity (litres)
                                        </label>
                                        <input
                                            id="market-qty"
                                            type="number"
                                            min="0.1"
                                            step="0.1"
                                            max={Number(selected.supply)}
                                            className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            value={form.data.quantity_litres}
                                            onChange={e => form.setData('quantity_litres', parseFloat(e.target.value) || 0)}
                                            required
                                        />
                                        {form.errors.quantity_litres && (
                                            <p className="text-xs text-red-400 mt-1">{form.errors.quantity_litres}</p>
                                        )}
                                    </div>

                                    {/* Cost summary */}
                                    <div className={`rounded-lg p-3 border text-sm space-y-1 ${canAfford && inStock ? 'bg-stone-800/40 border-stone-700/40' : 'bg-red-900/20 border-red-700/30'}`}>
                                        <div className="flex justify-between">
                                            <span className="text-stone-400">Total cost</span>
                                            <span className={`font-semibold font-mono ${canAfford ? 'text-amber-400' : 'text-red-400'}`}>
                                                {fmt(totalCost)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-stone-500">Balance after</span>
                                            <span className={canAfford ? 'text-stone-400' : 'text-red-400'}>
                                                {fmt(balance - totalCost)}
                                            </span>
                                        </div>
                                        {!canAfford && (
                                            <p className="text-xs text-red-400 pt-1">Insufficient funds</p>
                                        )}
                                        {!inStock && (
                                            <p className="text-xs text-red-400 pt-1">
                                                Only {Number(selected.supply).toFixed(0)}L available
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        id="market-buy-btn"
                                        disabled={form.processing || !canAfford || !inStock || pubs.length === 0}
                                        className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-[#0d0d12] font-semibold text-sm transition-colors"
                                    >
                                        {form.processing ? 'Purchasing…' : `Buy ${form.data.quantity_litres}L now`}
                                    </button>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
