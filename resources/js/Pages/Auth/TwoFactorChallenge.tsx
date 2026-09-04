import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import axios from 'axios';

export default function TwoFactorChallenge() {
    const [status, setStatus] = useState<string>('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const authenticate = async () => {
        setProcessing(true);
        setError(null);
        setStatus('Requesting challenge from server...');

        try {
            // 1. Get options from server
            const optionsResp = await axios.get(route('login.2fa.options'));
            const options = optionsResp.data.options;

            setStatus('Waiting for authenticator...');

            // 2. Invoke WebAuthn via browser
            const asseResp = await startAuthentication({ optionsJSON: options });

            setStatus('Verifying response...');

            // 3. Send response to server to verify
            const verifyResp = await axios.post(route('login.2fa'), {
                credential: asseResp
            });

            if (verifyResp.data.redirect) {
                setStatus('Success! Redirecting...');
                router.visit(verifyResp.data.redirect);
            }
        } catch (err: any) {
            console.error(err);
            if (err.name === 'NotAllowedError') {
                setError('The operation either timed out or was not allowed. Please try again.');
            } else {
                setError(err.response?.data?.message || 'Authentication failed. Please try again.');
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0d0d12] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <Head title="Two-Factor Authentication" />

            <div className="max-w-md w-full bg-[#1a1a24] p-8 rounded-xl border border-stone-800 shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-amber-500 tracking-tight">Two-Factor Auth</h2>
                    <p className="mt-2 text-sm text-stone-400">
                        Please verify your identity using your registered passkey, fingerprint, or security key.
                    </p>
                </div>

                <div className="mt-6">
                    <button
                        onClick={authenticate}
                        disabled={processing}
                        className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 transition-colors"
                    >
                        {processing ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                            </svg>
                        )}
                        {processing ? 'Verifying...' : 'Verify Passkey'}
                    </button>
                </div>

                {status && !error && (
                    <div className="mt-4 text-sm text-center text-stone-300">
                        {status}
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-md">
                        <p className="text-sm text-red-400 text-center">{error}</p>
                    </div>
                )}
                
                <div className="mt-6 text-center">
                    <a href={route('login')} className="text-sm text-amber-500/80 hover:text-amber-400">
                        Back to Login
                    </a>
                </div>
            </div>
        </div>
    );
}
