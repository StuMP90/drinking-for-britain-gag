import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <>
            <Head title="Sign In — Drinking for Britain" />
            <div className="min-h-screen flex items-center justify-center bg-[#0d0d12]">
                <div className="w-full max-w-md px-8 py-10">
                    {/* Logo / title */}
                    <div className="text-center mb-10">
                        <img src="/logo.png" alt="Drinking for Britain" className="w-20 h-20 rounded-2xl object-cover mx-auto shadow-xl shadow-amber-900/40 ring-2 ring-amber-500/20" />
                        <h1 className="text-3xl font-bold text-amber-400 tracking-tight">Drinking for Britain</h1>
                        <p className="text-stone-400 mt-1 text-sm">Sign in to manage your pubs &amp; breweries</p>
                    </div>

                    {status && (
                        <div className="mb-4 text-sm font-medium text-green-400 text-center">{status}</div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-stone-300 mb-1">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                autoComplete="username"
                                autoFocus
                                value={data.username}
                                onChange={e => setData('username', e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-[#1a1a24] border border-stone-700 text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                                placeholder="your_username"
                            />
                            {errors.username && (
                                <p className="mt-1 text-xs text-red-400">{errors.username}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-stone-300 mb-1">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-[#1a1a24] border border-stone-700 text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                                placeholder="••••••••"
                            />
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-400">{errors.password}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                id="remember"
                                type="checkbox"
                                checked={data.remember}
                                onChange={e => setData('remember', e.target.checked)}
                                className="w-4 h-4 rounded border-stone-600 bg-[#1a1a24] text-amber-500 focus:ring-amber-500"
                            />
                            <label htmlFor="remember" className="text-sm text-stone-400">Remember me</label>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            id="login-submit"
                            className="w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0d0d12] font-semibold text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
                        >
                            {processing ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-xs text-stone-600">
                        No account? Contact the game administrator.
                    </p>
                </div>
            </div>
        </>
    );
}
