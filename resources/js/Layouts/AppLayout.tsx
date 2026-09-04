import { Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';

export default function AppLayout({ children, title }: { children: ReactNode; title?: string }) {
    const { auth } = usePage<any>().props;
    const user = auth?.user;

    return (
        <div className="min-h-screen bg-[#0d0d12] text-stone-100 flex flex-col">
            {/* Top nav */}
            <nav className="sticky top-0 z-40 border-b border-stone-800/70 bg-[#0d0d12]/90 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
                    <Link href={route('dashboard')} className="flex items-center gap-2 font-bold text-amber-400 shrink-0">
                        <img src="/logo.png" alt="Drinking for Britain" className="h-8 w-8 rounded-lg object-cover" />
                        <span className="hidden sm:inline">DfB</span>
                    </Link>

                    {/* Main nav links */}
                    <div className="flex items-center gap-1 text-sm overflow-x-auto">
                        <NavLink href={route('dashboard')} label="Dashboard" />
                        <NavLink href={route('pubs.index')} label="Pubs" />
                        <NavLink href={route('breweries.index')} label="Breweries" />
                        <NavLink href={route('market.index')} label="Market" />
                        {user?.is_admin && <NavLink href={route('admin.dashboard')} label="Admin" amber />}
                    </div>

                    {/* Balance + logout */}
                    <div className="flex items-center gap-4 shrink-0">
                        <span className="text-amber-400 font-mono text-sm font-semibold">
                            £{Number(user?.balance ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                        </span>
                        <Link
                            href={route('profile.edit')}
                            className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
                        >
                            Profile
                        </Link>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
                        >
                            Sign out
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Flash messages */}
            <FlashMessages />

            {/* Page content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
                {title && <h1 className="text-2xl font-bold text-stone-100 mb-6">{title}</h1>}
                {children}
            </main>
        </div>
    );
}

function NavLink({ href, label, amber = false }: { href: string; label: string; amber?: boolean }) {
    const active = window.location.pathname.startsWith(new URL(href, window.location.origin).pathname);
    return (
        <Link
            href={href}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                active
                    ? amber ? 'bg-amber-500/20 text-amber-400' : 'bg-stone-800 text-stone-100'
                    : amber ? 'text-amber-500 hover:bg-amber-500/10' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
        >
            {label}
        </Link>
    );
}

function FlashMessages() {
    const { flash } = usePage<any>().props;
    if (!flash?.success && !flash?.error) return null;

    return (
        <div className="max-w-7xl mx-auto px-6 pt-4 space-y-2">
            {flash.success && (
                <div className="px-4 py-2.5 rounded-lg bg-green-950/60 border border-green-700/40 text-green-300 text-sm">
                    ✓ {flash.success}
                </div>
            )}
            {flash.error && (
                <div className="px-4 py-2.5 rounded-lg bg-red-950/60 border border-red-700/40 text-red-300 text-sm">
                    ✕ {flash.error}
                </div>
            )}
        </div>
    );
}
