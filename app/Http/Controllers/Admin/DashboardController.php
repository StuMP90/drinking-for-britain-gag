<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TaxPayment;
use App\Models\Turn;
use App\Models\User;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $totalPlayers = User::where('is_admin', false)->count();
        $activePlayers = User::where('is_admin', false)->where('is_paused', false)->count();

        $cumulativeRevenue = Turn::sum('revenue');
        $cumulativeProfit  = Turn::sum('profit');

        $taxTotals = TaxPayment::selectRaw('type, SUM(amount) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $totalTaxPaid = $taxTotals->sum();

        $outstandingTax    = \App\Models\Liability::whereNull('paid_at')->sum('amount');
        $indirectTax       = \App\Models\Setting::number('global_indirect_tax', 0);

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_players'     => $totalPlayers,
                'active_players'    => $activePlayers,
                'cumulative_revenue'=> round($cumulativeRevenue, 2),
                'cumulative_profit' => round($cumulativeProfit, 2),
                'total_tax_paid'    => round($totalTaxPaid, 2),
                'outstanding_tax'   => round($outstandingTax, 2),
                'indirect_tax'      => round($indirectTax, 2),
                'tax_breakdown'     => $taxTotals,
            ],
            'recentTurns' => Turn::with('user:id,name,username')
                ->orderByDesc('created_at')
                ->limit(20)
                ->get(),
        ]);
    }
}
