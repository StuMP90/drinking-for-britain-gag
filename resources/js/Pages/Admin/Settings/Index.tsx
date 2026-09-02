import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

interface Setting {
    id: number;
    key: string;
    value: string;
    type: string;
    description: string;
}

interface Props {
    settings: Setting[];
}

export default function SettingsIndex({ settings }: Props) {
    const { data, setData, post, processing, isDirty } = useForm({
        settings: settings.map(s => ({
            key: s.key,
            value: s.value,
        }))
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.settings.update'));
    };

    return (
        <AppLayout>
            <Head title="Game Settings — Admin" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-stone-100">Game Settings</h1>
                    <p className="text-stone-400 mt-1">Configure global game parameters.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-stone-900/40 border border-stone-800 rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {settings.map((setting, index) => (
                        <div key={setting.id} className="bg-stone-800/50 border border-stone-700/50 rounded-xl p-4">
                            <label className="block text-stone-200 font-semibold mb-1 text-sm">
                                {setting.description || setting.key}
                            </label>
                            <div className="text-xs text-stone-500 mb-3 font-mono">
                                {setting.key} ({setting.type})
                            </div>
                            
                            {setting.type === 'json' ? (
                                <textarea
                                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 h-24"
                                    value={data.settings[index].value}
                                    onChange={(e) => {
                                        const newSettings = [...data.settings];
                                        newSettings[index] = { ...newSettings[index], value: e.target.value };
                                        setData('settings', newSettings);
                                    }}
                                />
                            ) : (
                                <input
                                    type={setting.type === 'number' ? 'number' : 'text'}
                                    step={setting.type === 'number' ? 'any' : undefined}
                                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    value={data.settings[index].value}
                                    onChange={(e) => {
                                        const newSettings = [...data.settings];
                                        newSettings[index] = { ...newSettings[index], value: e.target.value };
                                        setData('settings', newSettings);
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-stone-800 flex justify-end">
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0d0d12] font-bold text-sm transition-colors"
                    >
                        {processing ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}
