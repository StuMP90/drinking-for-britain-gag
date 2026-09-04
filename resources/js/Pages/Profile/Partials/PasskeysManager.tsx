import { useState, useEffect } from 'react';
import axios from 'axios';
import { startRegistration } from '@simplewebauthn/browser';

interface Passkey {
    id: number;
    name: string;
    created_at: string;
}

export default function PasskeysManager({ className = '' }: { className?: string }) {
    const [passkeys, setPasskeys] = useState<Passkey[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [passkeyName, setPasskeyName] = useState('');

    const fetchPasskeys = async () => {
        try {
            const response = await axios.get('/user/passkeys');
            setPasskeys(response.data);
        } catch (err) {
            console.error('Error fetching passkeys:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPasskeys();
    }, []);

    const registerPasskey = async () => {
        if (!passkeyName.trim()) {
            setError('Please provide a name for the passkey.');
            return;
        }

        setProcessing(true);
        setError(null);
        setMessage(null);

        try {
            // 1. Get registration options from the server
            const optionsResp = await axios.get('/user/passkeys/options');
            const options = optionsResp.data.options;

            // 2. Invoke WebAuthn via browser
            const asseResp = await startRegistration({ optionsJSON: options });

            // 3. Send response to server to verify and save
            const verifyResp = await axios.post('/user/passkeys', {
                credential: asseResp,
                name: passkeyName
            });

            setMessage('Passkey added successfully.');
            setPasskeyName('');
            fetchPasskeys();
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 423) {
                window.location.href = '/confirm-password';
                return;
            }
            
            if (err.name === 'NotAllowedError') {
                setError('The operation either timed out or was not allowed.');
            } else {
                setError(err.response?.data?.message || 'Registration failed.');
            }
        } finally {
            setProcessing(false);
        }
    };

    const deletePasskey = async (id: number) => {
        if (!confirm('Are you sure you want to remove this passkey?')) return;

        try {
            await axios.delete(`/user/passkeys/${id}`);
            setMessage('Passkey removed successfully.');
            fetchPasskeys();
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 423) {
                window.location.href = '/confirm-password';
                return;
            }
            setError('Failed to remove passkey.');
        }
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-stone-100">
                    Two-Factor Authentication (Passkeys)
                </h2>

                <p className="mt-1 text-sm text-stone-400">
                    Add passkeys, fingerprints, or security keys for secure two-factor authentication.
                </p>
            </header>

            {message && (
                <div className="mt-4 p-3 bg-green-100 border border-green-200 text-green-700 rounded-md text-sm">
                    {message}
                </div>
            )}
            
            {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md text-sm">
                    {error}
                </div>
            )}

            <div className="mt-6">
                {loading ? (
                    <p className="text-sm text-stone-500">Loading passkeys...</p>
                ) : passkeys.length > 0 ? (
                    <ul className="divide-y divide-stone-700 border-t border-b border-stone-700 mb-6">
                        {passkeys.map(passkey => (
                            <li key={passkey.id} className="py-4 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-stone-200">{passkey.name}</p>
                                    <p className="text-xs text-stone-500">Added on {new Date(passkey.created_at).toLocaleDateString()}</p>
                                </div>
                                <button
                                    onClick={() => deletePasskey(passkey.id)}
                                    className="text-sm text-red-400 hover:text-red-300"
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-stone-500 mb-6">You don't have any passkeys configured.</p>
                )}

                <div className="flex items-center space-x-4">
                    <input
                        type="text"
                        value={passkeyName}
                        onChange={e => setPasskeyName(e.target.value)}
                        placeholder="e.g. MacBook Touch ID"
                        className="rounded-lg bg-[#0d0d12] border-stone-700 text-stone-100 placeholder-stone-500 focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                        disabled={processing}
                    />
                    <button
                        onClick={registerPasskey}
                        disabled={processing || !passkeyName.trim()}
                        className="inline-flex items-center px-4 py-2 bg-amber-500 rounded-lg font-semibold text-xs text-[#0d0d12] uppercase tracking-widest hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-[#1a1a24] transition ease-in-out duration-150 disabled:opacity-50"
                    >
                        {processing ? 'Registering...' : 'Add Passkey'}
                    </button>
                </div>
            </div>
        </section>
    );
}
