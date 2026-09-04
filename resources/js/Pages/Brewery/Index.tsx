import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState, useEffect } from 'react';

interface CostTier { max_litres: number | null; cost_per_litre: number; }
interface Staff { id: number; name: string; role: string; weekly_wage: number; satisfaction: number; }
interface Ingredient { id: number; market_listing_id: number; quantity_kg: number; cost_per_unit: number; market_listing: { name: string }; }
interface Stock { id: number; quantity_litres: number; market_listing: { name: string }; }
interface Product { id: number; name: string; abv: number; required_role: string; recipe: Record<string, number> | null; }
interface Pub { id: number; name: string; }
interface PendingBrew { id: number; brewery_id: number; product_name: string; quantity_litres: number; pub_name: string; }

interface Brewery {
    id: number;
    name: string;
    capacity_litres: number;
    is_active: boolean;
    staff: Staff[];
    ingredients: Ingredient[];
    stocks: Stock[];
}

interface Props {
    breweries: Brewery[];
    pubs: Pub[];
    products: Product[];
    balance: number;
    buildCostTiers: CostTier[];
    pendingBrews: PendingBrew[];
}

const fmt = (n: number, decimals: number = 2) => '£' + Number(n).toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

function buildCost(capacity: number, tiers: CostTier[]): number {
    for (const tier of tiers) {
        if (tier.max_litres === null || capacity <= tier.max_litres) {
            return capacity * tier.cost_per_litre;
        }
    }
    return capacity * 4;
}

export default function BreweryIndex({ breweries, pubs, products, balance, buildCostTiers, pendingBrews }: Props) {
    const [showBuild, setShowBuild] = useState(false);
    const [expanded, setExpanded] = useState<number | null>(breweries.length === 1 ? breweries[0].id : null);

    useEffect(() => {
        if (breweries.length === 1) {
            setExpanded(breweries[0].id);
        }
    }, [breweries.length]);

    const buildForm = useForm({ name: '', capacity_litres: 1000 });
    const brewForm = useForm({ market_listing_id: '', quantity_litres: 100, pub_id: '' });
    const staffForm = useForm({ staffable_type: 'brewery', staffable_id: 0, name: '', role: 'Brewer', weekly_wage: 800 });

    const cost = buildCost(Number(buildForm.data.capacity_litres), buildCostTiers);

    return (
        <AppLayout title="My Breweries">
            <Head title="Breweries — Drinking for Britain" />

            <div className="flex justify-end mb-6">
                <button
                    id="build-brewery-btn"
                    onClick={() => setShowBuild(v => !v)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0d0d12] font-semibold text-sm transition-colors"
                >
                    {showBuild ? 'Cancel' : '+ Build Brewery'}
                </button>
            </div>

            {showBuild && (
                <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-6 mb-6">
                    <h2 className="font-semibold text-stone-200 mb-4">Build a New Brewery</h2>
                    <form
                        onSubmit={e => { e.preventDefault(); buildForm.post(route('breweries.store'), { onSuccess: () => setShowBuild(false) }); }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
                    >
                        <div>
                            <label className="text-xs text-stone-400 block mb-1">Brewery Name</label>
                            <input
                                className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                value={buildForm.data.name}
                                onChange={e => buildForm.setData('name', e.target.value)}
                                placeholder="Hopfield Brewery"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-stone-400 block mb-1">Capacity (litres/week)</label>
                            <input
                                type="number"
                                min="100"
                                max="100000"
                                step="100"
                                className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                value={buildForm.data.capacity_litres}
                                onChange={e => buildForm.setData('capacity_litres', parseInt(e.target.value))}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-stone-400">
                                Cost: <strong className="text-amber-400">{fmt(cost)}</strong>
                                &nbsp;/ Balance: <strong className={cost > balance ? 'text-red-400' : 'text-green-400'}>{fmt(balance)}</strong>
                            </p>
                            <button
                                type="submit"
                                disabled={buildForm.processing || cost > balance}
                                className="w-full px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0d0d12] font-semibold text-sm"
                            >
                                {buildForm.processing ? 'Building…' : 'Build Brewery'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-4 text-xs text-stone-600 space-y-0.5">
                        <strong className="text-stone-500">Cost tiers:</strong>
                        {buildCostTiers.map((tier, i) => (
                            <span key={i} className="ml-2">
                                {tier.max_litres ? `≤${tier.max_litres.toLocaleString()}L @ £${tier.cost_per_litre}/L` : `>${buildCostTiers[i - 1]?.max_litres?.toLocaleString()}L @ £${tier.cost_per_litre}/L`}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {breweries.length === 0 && (
                    <div className="text-center py-16 text-stone-500">
                        <div className="text-4xl mb-3">🏭</div>
                        <p>No breweries yet. Build one to produce your own beer!</p>
                    </div>
                )}

                {breweries.map(brewery => {
                    let cat = 'macro';
                    const cap = Number(brewery.capacity_litres);
                    if (cap <= 2000) cat = 'micro';
                    else if (cap <= 10000) cat = 'craft';
                    else if (cap <= 50000) cat = 'regional';

                    return (
                    <div key={brewery.id} className="rounded-2xl border border-stone-800 bg-stone-900/40 overflow-hidden">
                        <div
                            className="relative px-6 py-8 cursor-pointer transition-colors bg-cover bg-center"
                            style={{ backgroundImage: `url('/images/breweries/${cat}.jpg')` }}
                            onClick={() => setExpanded(expanded === brewery.id ? null : brewery.id)}
                        >
                            {/* Dark gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-900/90 to-stone-900/40 hover:via-stone-900/80 transition-all"></div>
                            
                            {/* Content */}
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-stone-100 text-xl tracking-tight drop-shadow-md">{brewery.name}</h3>
                                    <p className="text-xs text-stone-300 mt-1 font-medium drop-shadow-sm">
                                        Capacity: {brewery.capacity_litres.toLocaleString('en-GB')}L/wk
                                        {!brewery.is_active && ' · ⚠ Inactive'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="text-center bg-stone-900/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-stone-700/50">
                                        <div className="text-stone-300 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Staff</div>
                                        <div className="font-bold text-stone-100 leading-none">{brewery.staff.length}</div>
                                    </div>
                                    <div className="text-center bg-stone-900/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-stone-700/50">
                                        <div className="text-stone-300 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Ingredients</div>
                                        <div className="font-bold text-stone-100 leading-none">{brewery.ingredients.length}</div>
                                    </div>
                                    <span className="text-stone-400 font-bold ml-2">{expanded === brewery.id ? '▲' : '▼'}</span>
                                </div>
                            </div>
                        </div>

                        {expanded === brewery.id && (
                            <div className="border-t border-stone-800 px-6 py-5 space-y-6">
                                {/* Ingredients */}
                                {brewery.ingredients.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-stone-300 mb-2">Ingredient Stock</h4>
                                        <div className="space-y-1">
                                            {brewery.ingredients.map(ing => (
                                                <div key={ing.id} className="flex gap-4 text-sm">
                                                    <span className="text-stone-300 w-36 shrink-0">{ing.market_listing.name}</span>
                                                    <span className="text-stone-400">{Number(ing.quantity_kg).toFixed(2)} kg</span>
                                                    <span className="text-stone-500 text-xs">{fmt(ing.cost_per_unit)}/kg</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Queue brew */}
                                <div>
                                    <h4 className="text-sm font-semibold text-stone-300 mb-3">Queue a Brew</h4>
                                    <form
                                        onSubmit={e => {
                                            e.preventDefault();
                                            brewForm.post(route('breweries.brew', brewery.id));
                                        }}
                                        className="flex flex-wrap gap-2 items-end"
                                    >
                                        <div>
                                            <label className="text-xs text-stone-500 block mb-1">Product</label>
                                            <select
                                                className="px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                value={brewForm.data.market_listing_id}
                                                onChange={e => brewForm.setData('market_listing_id', e.target.value)}
                                                required
                                            >
                                                <option value="">— Select product —</option>
                                                {products
                                                    .filter(p => brewery.staff.some(s => s.role === p.required_role))
                                                    .map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} ({p.abv}% ABV)</option>
                                                    ))
                                                }
                                                {products.filter(p => brewery.staff.some(s => s.role === p.required_role)).length === 0 && (
                                                    <option disabled>No qualified staff to brew any products.</option>
                                                )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-stone-500 block mb-1">Litres</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-24 px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                value={brewForm.data.quantity_litres}
                                                onChange={e => brewForm.setData('quantity_litres', parseInt(e.target.value))}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-stone-500 block mb-1">Deliver to pub (optional)</label>
                                            <select
                                                className="px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                value={brewForm.data.pub_id}
                                                onChange={e => brewForm.setData('pub_id', e.target.value)}
                                            >
                                                <option value="">— Brewery stock —</option>
                                                {pubs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={brewForm.processing}
                                            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0d0d12] font-semibold text-sm"
                                        >
                                            Queue Brew
                                        </button>
                                    </form>

                                    {pendingBrews.filter(b => b.brewery_id === brewery.id).length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-stone-800/50">
                                            <h5 className="text-xs font-semibold text-stone-400 mb-2 uppercase tracking-wider">Already Queued For Next Turn</h5>
                                            <div className="space-y-1.5">
                                                {pendingBrews.filter(b => b.brewery_id === brewery.id).map(brew => (
                                                    <div key={brew.id} className="flex gap-4 text-sm bg-stone-800/20 px-3 py-1.5 rounded border border-stone-800/50 items-center">
                                                        <span className="text-stone-300 w-36 shrink-0">{brew.product_name}</span>
                                                        <span className="text-amber-500 font-medium shrink-0">{brew.quantity_litres.toLocaleString()}L</span>
                                                        <span className="text-stone-500 text-xs">→ {brew.pub_name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Staff */}
                                <div>
                                    <h4 className="text-sm font-semibold text-stone-300 mb-2">Staff</h4>
                                    {brewery.staff.map(s => (
                                        <div key={s.id} className="flex items-center gap-4 text-sm py-1 border-b border-stone-800/40 last:border-0 pb-2">
                                            <span className="text-stone-300 w-32 shrink-0">{s.name}</span>
                                            <span className="text-stone-500 w-24">{s.role}</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-stone-500 text-xs">£</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="1"
                                                    defaultValue={Number(s.weekly_wage).toFixed(2)}
                                                    className="w-20 px-2 py-1 rounded bg-stone-800 border border-stone-700 text-stone-100 text-sm text-right focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                    onBlur={e => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val)) {
                                                            e.target.value = val.toFixed(2);
                                                            if (val !== Number(s.weekly_wage)) {
                                                                router.patch(route('staff.update', s.id), { weekly_wage: val }, { preserveScroll: true, preserveState: true });
                                                            }
                                                        }
                                                    }}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') e.currentTarget.blur();
                                                    }}
                                                />
                                                <span className="text-stone-500 text-xs">/wk</span>
                                            </div>
                                            <span className="text-stone-500 text-xs ml-auto">
                                                Satisfaction: {Number(s.satisfaction).toFixed(0)}%
                                            </span>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Are you sure you want to fire ${s.name}?`)) {
                                                        router.delete(route('staff.destroy', s.id), { preserveScroll: true, preserveState: true });
                                                    }
                                                }}
                                                className="ml-2 px-2 py-1 bg-red-900/40 hover:bg-red-800/60 text-red-300 rounded text-xs transition-colors"
                                            >
                                                Fire
                                            </button>
                                        </div>
                                    ))}
                                    <form
                                        onSubmit={e => {
                                            e.preventDefault();
                                            staffForm.setData('staffable_id', brewery.id);
                                            staffForm.post(route('staff.store'));
                                        }}
                                        className="mt-2 flex flex-wrap gap-2 items-end"
                                    >
                                        <input
                                            placeholder="Name"
                                            className="px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-100 text-sm w-28 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                            value={staffForm.data.name}
                                            onChange={e => staffForm.setData('name', e.target.value)}
                                            required
                                        />
                                        <select
                                            className="px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-100 text-sm w-28 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                            value={staffForm.data.role}
                                            onChange={e => staffForm.setData('role', e.target.value)}
                                            required
                                        >
                                            <option value="Brewer">Brewer</option>
                                            <option value="Distiller">Distiller</option>
                                            <option value="Vintner">Vintner</option>
                                        </select>
                                        <div className="flex items-center gap-1">
                                            <span className="text-stone-500 text-sm">£</span>
                                            <input
                                                type="number"
                                                min="1"
                                                className="px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-100 text-sm w-24 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                value={staffForm.data.weekly_wage}
                                                onChange={e => staffForm.setData('weekly_wage', parseInt(e.target.value))}
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={staffForm.processing}
                                            className="px-3 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 text-sm transition-colors"
                                        >
                                            + Hire {staffForm.data.role}
                                        </button>
                                    </form>
                                </div>

                                {/* Management section */}
                                <div className="mt-4 pt-4 border-t border-stone-800/50">
                                    <h4 className="text-sm font-semibold text-red-400 mb-3">Management</h4>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between py-2">
                                            <div>
                                                <div className="text-stone-200 text-sm font-medium">Sell Brewery</div>
                                                <div className="text-stone-500 text-xs">Liquidate this brewery. You will receive the property value (NBV +/- random modifier), minus a 10% stock disposal fee, minus 4 weeks severance pay for staff. All pending brews will be cancelled.</div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Are you sure you want to sell ${brewery.name}? This action cannot be undone.`)) {
                                                        router.post(route('breweries.sell', brewery.id), {}, { preserveScroll: true });
                                                    }
                                                }}
                                                className="px-4 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-800/60 text-red-300 font-semibold text-sm transition-colors border border-red-900/50"
                                            >
                                                Sell Brewery
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )})}
            </div>
        </AppLayout>
    );
}
