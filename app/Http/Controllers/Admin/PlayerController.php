<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlayerController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Players/Index', [
            'players' => User::where('is_admin', false)
                ->withCount(['pubs', 'breweries', 'turns'])
                ->orderByDesc('created_at')
                ->get(),
        ]);
    }

    public function show(User $player)
    {
        return Inertia::render('Admin/Players/Show', [
            'player'      => $player->load('pubs.staff', 'breweries.staff', 'turns', 'taxPayments'),
            'taxTotals'   => $player->taxPayments()
                ->selectRaw('type, SUM(amount) as total')
                ->groupBy('type')
                ->pluck('total', 'type'),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:100',
            'username' => 'required|string|max:50|unique:users,username|alpha_dash',
            'password' => 'required|string|min:8',
        ]);

        $startingBalance = Setting::number('player_starting_balance', 100000);

        User::create([
            'name'     => $request->name,
            'username' => $request->username,
            'password' => bcrypt($request->password),
            'balance'  => $startingBalance,
            'is_admin' => false,
        ]);

        return back()->with('success', "Player '{$request->username}' created.");
    }

    public function togglePause(User $player)
    {
        $player->update(['is_paused' => ! $player->is_paused]);
        $status = $player->is_paused ? 'paused' : 'resumed';

        return back()->with('success', "Player {$player->username} {$status}.");
    }

    public function reset(User $player)
    {
        $player->resetGame();
        
        return back()->with('success', "Player {$player->username} has been reset to starting state.");
    }

    public function destroy(User $player)
    {
        if ($player->is_admin) {
            return back()->with('error', 'Cannot delete admin accounts.');
        }

        $player->delete();

        return back()->with('success', 'Player deleted.');
    }
}
