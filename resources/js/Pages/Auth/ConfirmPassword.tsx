import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <div className="mb-8 text-sm text-stone-400 text-center">
                This is a secure area of the application. Please confirm your
                password before continuing.
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-stone-300 mb-1">
                        Password
                    </label>

                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        autoFocus
                        className="w-full px-4 py-3 rounded-lg bg-[#1a1a24] border border-stone-700 text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    {errors.password && (
                        <p className="mt-1 text-xs text-red-400">{errors.password}</p>
                    )}
                </div>

                <div className="mt-6 flex items-center justify-end">
                    <button 
                        type="submit" 
                        disabled={processing}
                        className="w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0d0d12] font-semibold text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
                    >
                        {processing ? 'Confirming...' : 'Confirm'}
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
