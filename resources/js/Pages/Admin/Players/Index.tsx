import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

interface Player {
    id: number;
    name: string;
    username: string;
    balance: number;
    is_paused: boolean;
    is_admin: boolean;
    pubs_count: number;
    breweries_count: number;
    turns_count: number;
    passkeys_count: number;
    created_at: string;
}

const fmt = (n: number, decimals: number = 2) => '£' + Number(n).toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export default function AdminPlayersIndex({ players }: { players: Player[] }) {
    const createForm = useForm({ name: '', username: '', password: '' });

    return (
        <AppLayout title="Player Management">
            <Head title="Players — Admin" />

            {/* Create player form */}
            <div className="rounded-2xl border border-stone-800 bg-stone-900/40 p-6 mb-8">
                <h2 className="font-semibold text-stone-200 mb-4">Create New Player</h2>
                <form
                    onSubmit={e => { e.preventDefault(); createForm.post(route('admin.players.store')); }}
                    className="flex flex-wrap gap-3 items-end"
                >
                    <div>
                        <label className="text-xs text-stone-400 block mb-1">Full Name</label>
                        <input
                            className="px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-stone-100 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            value={createForm.data.name}
                            onChange={e => createForm.setData('name', e.target.value)}
                            placeholder="Stuart Hall"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-xs text-stone-400 block mb-1">Username</label>
                        <input
                            className="px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-stone-100 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            value={createForm.data.username}
                            onChange={e => createForm.setData('username', e.target.value)}
                            placeholder="stuarthal"
                            required
                        />
                        {createForm.errors.username && <p className="text-xs text-red-400 mt-1">{createForm.errors.username}</p>}
                    </div>
                    <div>
                        <label className="text-xs text-stone-400 block mb-1">Password</label>
                        <input
                            type="password"
                            className="px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-stone-100 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            value={createForm.data.password}
                            onChange={e => createForm.setData('password', e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={createForm.processing}
                        className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0d0d12] font-semibold text-sm"
                    >
                        {createForm.processing ? 'Creating…' : 'Create Player'}
                    </button>
                </form>
            </div>

            {/* Players table */}
            <div className="rounded-2xl border border-stone-800 bg-stone-900/40 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-stone-500 text-xs uppercase tracking-wider border-b border-stone-800">
                            <th className="px-6 py-3 text-left">Player</th>
                            <th className="px-6 py-3 text-right">Balance</th>
                            <th className="px-6 py-3 text-center">Pubs</th>
                            <th className="px-6 py-3 text-center">Breweries</th>
                            <th className="px-6 py-3 text-center">Turns</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map(p => (
                            <PlayerRow key={p.id} player={p} />
                        ))}
                        {players.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-stone-500">No players yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}

function PlayerRow({ player }: { player: Player }) {
    const fmt = (n: number, decimals: number = 2) => '£' + Number(n).toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    const pauseForm = useForm({});
    const deleteForm = useForm({});

    return (
        <tr className="border-b border-stone-800/50 hover:bg-stone-800/20 transition-colors">
            <td className="px-6 py-3">
                <Link href={route('admin.players.show', player.id)} className="font-medium text-stone-200 hover:text-amber-400">
                    {player.name}
                </Link>
                <p className="text-xs text-stone-500">@{player.username}</p>
            </td>
            <td className="px-6 py-3 text-right font-mono text-stone-300">{fmt(player.balance)}</td>
            <td className="px-6 py-3 text-center text-stone-400">{player.pubs_count}</td>
            <td className="px-6 py-3 text-center text-stone-400">{player.breweries_count}</td>
            <td className="px-6 py-3 text-center text-stone-400">{player.turns_count}</td>
            <td className="px-6 py-3 text-center">
                <div className="flex items-center justify-center gap-1.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${player.is_paused ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}>
                        {player.is_paused ? 'Paused' : 'Active'}
                    </span>
                    {player.passkeys_count > 0 && (
                        <div title="2FA Enabled" className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-500">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </div>
            </td>
            <td className="px-6 py-3 text-center">
                {!player.is_admin ? (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => pauseForm.post(route('admin.players.toggle-pause', player.id))}
                            disabled={pauseForm.processing}
                            className="px-3 py-1 rounded text-xs bg-stone-700 hover:bg-stone-600 text-stone-200 transition-colors"
                        >
                            {player.is_paused ? 'Resume' : 'Pause'}
                        </button>
                        <button
                            onClick={() => {
                                if (confirm(`Delete player ${player.username}? This cannot be undone.`)) {
                                    deleteForm.delete(route('admin.players.destroy', player.id));
                                }
                            }}
                            disabled={deleteForm.processing}
                            className="px-3 py-1 rounded text-xs bg-red-900/40 hover:bg-red-800/60 text-red-400 transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                ) : (
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Admin</span>
                )}
            </td>
        </tr>
    );
}
