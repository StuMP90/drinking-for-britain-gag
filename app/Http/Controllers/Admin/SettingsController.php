<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Settings/Index', [
            'settings' => Setting::orderBy('key')->get(),
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'settings'         => 'required|array',
            'settings.*.key'   => 'required|string',
            'settings.*.value' => 'required|string',
        ]);

        foreach ($request->settings as $item) {
            Setting::set($item['key'], $item['value']);
        }

        // Bust the full settings cache
        Cache::flush();

        return back()->with('success', 'Settings saved.');
    }
}
