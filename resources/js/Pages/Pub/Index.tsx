import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState } from 'react';

interface Stock {
    id: number;
    market_listing_id: number;
    quantity_litres: number;
    cost_per_unit: number;
    retail_price: number;
    market_listing: { name: string; abv: number; type: string };
}

// Serving size helpers — must match MarketListing::servingSizeLitres() in PHP
function servingSizeLitres(abv: number): number {
    if (abv > 22) return 0.025;
    if (abv > 8)  return 0.175;
    return 0.568;
}
function servingLabel(abv: number): string {
    if (abv > 22) return '25ml';
    if (abv > 8)  return '175ml';
    return 'pint';
}

interface Staff {
    id: number;
    name: string;
    role: string;
    weekly_wage: number;
    satisfaction: number;
}

interface Pub {
    id: number;
    name: string;
    category: string;
    tenure: string;
    customer_capacity: number;
    has_sports_tv: boolean;
    is_active: boolean;
    staff: Staff[];
    stocks: Stock[];
}

interface Settings {
    community_capacity: number;
    town_capacity: number;
    city_capacity: number;
    leasehold_cost: number;
    freehold_cost: number;
    tv_licence_cost: number;
}

interface Props {
    pubs: Pub[];
    balance: number;
    settings: Settings;
}

const fmt = (n: number, decimals: number = 2) => '£' + Number(n).toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export default function PubIndex({ pubs, balance, settings }: Props) {
    const [showBuild, setShowBuild] = useState(false);
    const [expandedPub, setExpandedPub] = useState<number | null>(null);

    const buildForm = useForm({ name: '', category: 'community', tenure: 'leasehold', has_sports_tv: false });
    const staffForm = useForm({ staffable_type: 'pub', staffable_id: 0, name: '', role: 'Bar Staff', weekly_wage: 400 });
    const priceForm = useForm({ stock_id: 0, retail_price: 0 });

    const capacity = (cat: string) => ({
        community: settings.community_capacity,
        town: settings.town_capacity,
        city: settings.city_capacity,
    }[cat] ?? 70);

    const buildCost = () => {
        const cap = capacity(buildForm.data.category);
        const rate = buildForm.data.tenure === 'freehold' ? settings.freehold_cost : settings.leasehold_cost;
        let cost = cap * rate;
        if (buildForm.data.has_sports_tv) {
            cost += settings.tv_licence_cost * cap * 4;
        }
        return cost;
    };

    return (
        <AppLayout title="My Pubs">
            <Head title="Pubs — Drinking for Britain" />

            {/* Build pub button */}
            <div className="flex justify-end mb-6">
                <button
                    id="open-pub-btn"
                    onClick={() => setShowBuild(v => !v)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0d0d12] font-semibold text-sm transition-colors"
                >
                    {showBuild ? 'Cancel' : '+ Open New Pub'}
                </button>
            </div>

            {/* Build form */}
            {showBuild && (
                <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-6 mb-6">
                    <h2 className="font-semibold text-stone-200 mb-4">Open a New Pub</h2>
                    <form
                        onSubmit={e => { e.preventDefault(); buildForm.post(route('pubs.store'), { onSuccess: () => setShowBuild(false) }); }}
                        className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
                    >
                        <div className="md:col-span-2">
                            <label className="text-xs text-stone-400 block mb-1">Pub Name</label>
                            <input
                                className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                value={buildForm.data.name}
                                onChange={e => buildForm.setData('name', e.target.value)}
                                placeholder="The Crown"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-stone-400 block mb-1">Category</label>
                            <select
                                className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                value={buildForm.data.category}
                                onChange={e => buildForm.setData('category', e.target.value)}
                            >
                                <option value="community">Community ({settings.community_capacity} cap)</option>
                                <option value="town">Town ({settings.town_capacity} cap)</option>
                                <option value="city">City ({settings.city_capacity} cap)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-stone-400 block mb-1">Tenure</label>
                            <select
                                className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                value={buildForm.data.tenure}
                                onChange={e => buildForm.setData('tenure', e.target.value)}
                            >
                                <option value="leasehold">Leasehold (£{settings.leasehold_cost}/cap)</option>
                                <option value="freehold">Freehold (£{settings.freehold_cost}/cap)</option>
                            </select>
                        </div>
                        <div className="flex items-center h-10">
                            <label className="flex items-center gap-2 text-stone-200 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded border-stone-700 bg-stone-800 text-amber-500 focus:ring-amber-500"
                                    checked={buildForm.data.has_sports_tv}
                                    onChange={e => buildForm.setData('has_sports_tv', e.target.checked)}
                                />
                                Include Sports TV
                            </label>
                        </div>
                        <div className="md:col-span-4 flex items-center justify-between">
                            <span className="text-sm text-stone-400">
                                Cost: <strong className="text-amber-400">{fmt(buildCost())}</strong>
                                &nbsp;/ Capacity: <strong className="text-stone-200">{capacity(buildForm.data.category)}</strong>
                                &nbsp;/ Balance: <strong className={buildCost() > balance ? 'text-red-400' : 'text-green-400'}>{fmt(balance)}</strong>
                            </span>
                            <button
                                type="submit"
                                disabled={buildForm.processing || buildCost() > balance}
                                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0d0d12] font-semibold text-sm transition-colors"
                            >
                                {buildForm.processing ? 'Opening…' : 'Open Pub'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Pub cards */}
            <div className="space-y-4">
                {pubs.length === 0 && (
                    <div className="text-center py-16 text-stone-500">
                        <div className="text-4xl mb-3">🏘️</div>
                        <p>You don't own any pubs yet. Open one above!</p>
                    </div>
                )}

                {pubs.map(pub => (
                    <div key={pub.id} className="rounded-2xl border border-stone-800 bg-stone-900/40 overflow-hidden">
                        {/* Pub header */}
                        <div
                            className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-stone-800/30 transition-colors"
                            onClick={() => setExpandedPub(expandedPub === pub.id ? null : pub.id)}
                        >
                            <div>
                                <h3 className="font-semibold text-stone-100">{pub.name}</h3>
                                <p className="text-xs text-stone-500 mt-0.5 capitalize">
                                    {pub.category} · {pub.tenure} · {pub.customer_capacity} cap
                                    {pub.has_sports_tv && ' · 📺 Sports TV'}
                                    {!pub.is_active && ' · ⚠ Inactive'}
                                </p>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                                <div className="text-center">
                                    <div className="text-stone-400 text-xs">Staff</div>
                                    <div className="font-semibold text-stone-200">{pub.staff.length}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-stone-400 text-xs">Products</div>
                                    <div className="font-semibold text-stone-200">{pub.stocks.length}</div>
                                </div>
                                <span className="text-stone-500">{expandedPub === pub.id ? '▲' : '▼'}</span>
                            </div>
                        </div>

                        {expandedPub === pub.id && (
                            <div className="border-t border-stone-800 px-6 py-5 space-y-6">
                                {/* Stock section */}
                                {pub.stocks.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-stone-300 mb-3">Stock — set retail prices</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-xs text-stone-500 border-b border-stone-800">
                                                        <th className="text-left pb-2 pr-4">Product</th>
                                                        <th className="text-right pb-2 pr-4">Stock</th>
                                                        <th className="text-right pb-2 pr-4">Cost/L</th>
                                                        <th className="text-right pb-2 pr-4">Cost/Serving</th>
                                                        <th className="text-right pb-2 pr-4">Servings left</th>
                                                        <th className="text-right pb-2">Retail price</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pub.stocks.map(s => {
                                                        const abv      = Number(s.market_listing.abv);
                                                        const serv     = servingSizeLitres(abv);
                                                        const label    = servingLabel(abv);
                                                        const servings = Math.floor(Number(s.quantity_litres) / serv);
                                                        return (
                                                            <tr key={s.id} className="border-b border-stone-800/40">
                                                                <td className="py-2 pr-4 text-stone-200">
                                                                    {s.market_listing.name}
                                                                    <span className="ml-2 text-xs text-stone-500">{abv.toFixed(1)}%</span>
                                                                </td>
                                                                <td className="py-2 pr-4 text-right text-stone-400">
                                                                    {Number(s.quantity_litres).toFixed(1)}L
                                                                </td>
                                                                <td className="py-2 pr-4 text-right text-stone-500">
                                                                    {fmt(s.cost_per_unit, 3)}
                                                                </td>
                                                                <td className="py-2 pr-4 text-right text-stone-500">
                                                                    {fmt(Number(s.cost_per_unit) * serv, 3)}
                                                                </td>
                                                                <td className="py-2 pr-4 text-right text-stone-400">
                                                                    {servings.toLocaleString('en-GB')} {label}s
                                                                </td>
                                                                <td className="py-2 text-right">
                                                                    <div className="flex items-center justify-end gap-1.5">
                                                                        <span className="text-stone-500 text-xs">£</span>
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            min="0.01"
                                                                            defaultValue={Number(s.retail_price).toFixed(2)}
                                                                            className="w-20 px-2 py-1 rounded bg-stone-800 border border-stone-700 text-stone-100 text-sm text-right focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                                            onBlur={e => {
                                                                                const val = parseFloat(e.target.value);
                                                                                if (!isNaN(val)) {
                                                                                    e.target.value = val.toFixed(2);
                                                                                    router.post(route('pubs.stock-price', pub.id), {
                                                                                        stock_id: s.id,
                                                                                        retail_price: val
                                                                                    }, {
                                                                                        preserveScroll: true,
                                                                                        preserveState: true,
                                                                                    });
                                                                                }
                                                                            }}
                                                                            onKeyDown={e => {
                                                                                if (e.key === 'Enter') e.currentTarget.blur();
                                                                            }}
                                                                        />
                                                                        <span className="text-stone-500 text-xs w-10">/{label}</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Staff section */}
                                <div>
                                    <h4 className="text-sm font-semibold text-stone-300 mb-3">Staff</h4>
                                    {pub.staff.length === 0 && (
                                        <p className="text-stone-600 text-sm">No staff — pub cannot serve customers.</p>
                                    )}
                                    {pub.staff.map(s => (
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
                                                Sat: {Number(s.satisfaction).toFixed(0)}%
                                            </span>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Are you sure you want to fire ${s.name}?`)) {
                                                        router.delete(route('staff.destroy', s.id), { preserveScroll: true });
                                                    }
                                                }}
                                                className="ml-2 px-2 py-1 bg-red-900/40 hover:bg-red-800/60 text-red-300 rounded text-xs transition-colors"
                                            >
                                                Fire
                                            </button>
                                        </div>
                                    ))}

                                    {/* Hire staff */}
                                    <form
                                        onSubmit={e => {
                                            e.preventDefault();
                                            staffForm.setData('staffable_id', pub.id);
                                            staffForm.post(route('staff.store'));
                                        }}
                                        className="mt-3 flex flex-wrap gap-2 items-end"
                                    >
                                        <input type="hidden" value="pub" onChange={() => {}} />
                                        <input
                                            placeholder="Name"
                                            className="px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-100 text-sm w-32 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                            value={staffForm.data.name}
                                            onChange={e => staffForm.setData('name', e.target.value)}
                                            required
                                        />
                                        <input
                                            placeholder="Role"
                                            className="px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-100 text-sm w-28 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                            value={staffForm.data.role}
                                            onChange={e => staffForm.setData('role', e.target.value)}
                                            required
                                        />
                                        <div className="flex items-center gap-1">
                                            <span className="text-stone-500 text-sm">£</span>
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="Wage/wk"
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
                                            + Hire
                                        </button>
                                    </form>
                                </div>

                                {/* Upgrades section */}
                                <div>
                                    <h4 className="text-sm font-semibold text-stone-300 mb-3">Upgrades</h4>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between py-2 border-b border-stone-800/40">
                                            <div>
                                                <div className="text-stone-200 text-sm font-medium">Sports TV</div>
                                                <div className="text-stone-500 text-xs">Boosts capacity by 50%. Cost: {fmt(settings.tv_licence_cost * pub.customer_capacity)}/wk.</div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const isInstalling = !pub.has_sports_tv;
                                                    if (isInstalling) {
                                                        const upfront = settings.tv_licence_cost * pub.customer_capacity * 4;
                                                        if (!confirm(`Installing Sports TV requires a 4-week upfront payment of ${fmt(upfront)}. Continue?`)) return;
                                                    }
                                                    router.patch(route('pubs.update', pub.id), { has_sports_tv: isInstalling }, { preserveScroll: true });
                                                }}
                                                className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${pub.has_sports_tv ? 'bg-red-900/40 hover:bg-red-800/60 text-red-300' : 'bg-amber-500 hover:bg-amber-400 text-[#0d0d12] font-semibold'}`}
                                            >
                                                {pub.has_sports_tv ? 'Cancel Subscription' : 'Install TV'}
                                            </button>
                                        </div>
                                        {pub.tenure === 'leasehold' && (
                                            <div className="flex items-center justify-between py-2 border-b border-stone-800/40">
                                                <div>
                                                    <div className="text-stone-200 text-sm font-medium">Buy Freehold</div>
                                                    <div className="text-stone-500 text-xs">Eliminates weekly lease costs.</div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const cost = (settings.freehold_cost - settings.leasehold_cost) * pub.customer_capacity;
                                                        if (confirm(`Buying the freehold will cost ${fmt(cost)}. Continue?`)) {
                                                            router.patch(route('pubs.update', pub.id), { tenure: 'freehold' }, { preserveScroll: true });
                                                        }
                                                    }}
                                                    className="px-4 py-1.5 rounded-lg bg-stone-200 hover:bg-white text-stone-900 font-semibold text-sm transition-colors"
                                                >
                                                    Buy for {fmt((settings.freehold_cost - settings.leasehold_cost) * pub.customer_capacity)}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}
