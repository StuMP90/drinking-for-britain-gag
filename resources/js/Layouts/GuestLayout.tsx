import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0d0d12]">
            <div className="w-full max-w-md px-8 py-10">
                <div className="text-center mb-10">
                    <Link href="/">
                        <img src="/logo.png" alt="Drinking for Britain" className="w-20 h-20 rounded-2xl object-cover mx-auto shadow-xl shadow-amber-900/40 ring-2 ring-amber-500/20" />
                    </Link>
                    <h1 className="text-3xl font-bold text-amber-400 tracking-tight mt-4">Drinking for Britain</h1>
                </div>

                <div className="mt-6 w-full overflow-hidden sm:max-w-md">
                    {children}
                </div>
            </div>
        </div>
    );
}
