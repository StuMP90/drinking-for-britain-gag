import { Head, Link } from '@inertiajs/react';

interface Stats {
    total_players: number;
    cumulative_revenue: number;
    total_tax_paid: number;
}

export default function Welcome({ stats }: { stats: Stats }) {
    const fmt = (n: number) =>
        '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    return (
        <>
            <Head title="Drinking for Britain — UK Pub & Brewery Simulation" />
            <div className="min-h-screen bg-[#0d0d12] text-stone-100">

                {/* Nav */}
                <nav className="fixed top-0 inset-x-0 z-50 border-b border-stone-800/60 bg-[#0d0d12]/80 backdrop-blur-md">
                    <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xl font-bold text-amber-400">
                            <img src="/logo.png" alt="Drinking for Britain" className="h-9 w-9 rounded-xl object-cover" />
                            Drinking for Britain
                        </span>
                        <Link
                            href={route('login')}
                            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#0d0d12] font-semibold text-sm transition-colors"
                        >
                            Sign In
                        </Link>
                    </div>
                </nav>

                {/* Hero */}
                <section className="pt-40 pb-24 px-6 text-center">
                    <div className="flex justify-center mb-8">
                        <img
                            src="/logo.png"
                            alt="Drinking for Britain"
                            className="w-32 h-32 rounded-3xl object-cover shadow-2xl shadow-amber-900/40 ring-2 ring-amber-500/30"
                        />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
                        <span className="text-amber-400">Run your pubs.</span>
                        <br />
                        <span className="text-stone-100">Build your empire.</span>
                    </h1>
                    <p className="text-xl text-stone-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        A turn-based UK pub &amp; brewery management simulation. Buy pubs,
                        brew your own beer, hire staff, pay your taxes, and outperform rival publicans.
                    </p>
                    <Link
                        href={route('login')}
                        className="inline-block px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0d0d12] font-bold text-lg transition-all duration-200 shadow-lg shadow-amber-900/40"
                    >
                        Play Now →
                    </Link>
                </section>

                {/* Live stats */}
                <section className="py-16 px-6 border-t border-stone-800">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-center text-2xl font-bold text-stone-300 mb-10">Live Game Stats</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard icon="👥" label="Players" value={stats.total_players.toLocaleString('en-GB')} />
                            <StatCard icon="💷" label="Total Revenue Generated" value={fmt(stats.cumulative_revenue)} />
                            <StatCard icon="🏛️" label="Paid to HMRC" value={fmt(stats.total_tax_paid)} highlight />
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="py-16 px-6 border-t border-stone-800">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-center text-2xl font-bold text-stone-300 mb-10">What's in the game?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {FEATURES.map(f => (
                                <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
                            ))}
                        </div>
                    </div>
                </section>

                <footer className="py-8 border-t border-stone-800 text-center text-stone-600 text-sm px-6">
                    Drinking for Britain &copy; {new Date().getFullYear()}. A UK pub simulation game.
                </footer>
            </div>
        </>
    );
}

function StatCard({ icon, label, value, highlight = false }: {
    icon: string; label: string; value: string; highlight?: boolean;
}) {
    return (
        <div className={`rounded-2xl p-6 border ${highlight ? 'border-amber-500/40 bg-amber-950/20' : 'border-stone-800 bg-stone-900/40'} text-center`}>
            <div className="text-3xl mb-2">{icon}</div>
            <div className={`text-3xl font-bold mb-1 ${highlight ? 'text-amber-400' : 'text-stone-100'}`}>{value}</div>
            <div className="text-sm text-stone-500">{label}</div>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
    return (
        <div className="rounded-xl p-5 border border-stone-800 bg-stone-900/30 hover:border-stone-700 transition-colors">
            <div className="text-2xl mb-2">{icon}</div>
            <h3 className="font-semibold text-stone-200 mb-1">{title}</h3>
            <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
        </div>
    );
}

const FEATURES = [
    { icon: '🏘️', title: 'Buy & Build Pubs', desc: 'Open community, town or city pubs as leasehold or freehold. Add sports TV to boost capacity.' },
    { icon: '🏭', title: 'Run Breweries', desc: 'Build breweries, hire brewers, and craft your own beers and ales using real ingredient ratios.' },
    { icon: '📦', title: 'Manage Stock', desc: 'Buy ingredients and finished products from the dynamic market. Transfer stock to your pubs.' },
    { icon: '👷', title: 'Hire Staff', desc: 'Staff your pubs and breweries. Pay fair wages to keep satisfaction — and output — high.' },
    { icon: '📈', title: 'Dynamic Market', desc: 'Prices respond to supply and demand across all players. Buy early or pay more.' },
    { icon: '🏛️', title: 'Real UK Taxes', desc: 'Pay income tax, NI, VAT, alcohol duty, and corporation tax — calculated using real UK rates.' },
];
