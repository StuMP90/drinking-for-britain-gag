<?php

namespace App\Http\Controllers;

use App\Models\Brewery;
use App\Models\MarketListing;
use App\Models\Setting;
use App\Models\TurnAction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BreweryController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $pendingBrews = TurnAction::pending()
            ->where('user_id', $user->id)
            ->where('type', 'brew')
            ->get()
            ->map(function ($action) {
                $listing = MarketListing::find($action->payload['market_listing_id'] ?? 0);
                $pub = \App\Models\Pub::find($action->payload['pub_id'] ?? null);
                return [
                    'id' => $action->id,
                    'brewery_id' => $action->payload['brewery_id'] ?? null,
                    'product_name' => $listing ? $listing->name : 'Unknown',
                    'quantity_litres' => $action->payload['quantity_litres'] ?? 0,
                    'pub_name' => $pub ? $pub->name : 'Brewery Storage',
                ];
            });

        return Inertia::render('Brewery/Index', [
            'breweries'      => $user->breweries()->with('staff', 'ingredients.marketListing', 'stocks.marketListing')->get(),
            'pubs'           => $user->pubs()->get(['id', 'name']),
            'products'       => MarketListing::active()->products()->whereNotNull('recipe')->get()->append('required_role'),
            'balance'        => $user->balance,
            'buildCostTiers' => Setting::json('brewery_build_cost_tiers'),
            'pendingBrews'   => $pendingBrews,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'             => 'required|string|max:100',
            'capacity_litres'  => 'required|numeric|min:100|max:100000',
        ]);

        $user     = auth()->user();
        $capacity = (float) $request->capacity_litres;
        $cost     = $this->calculateBuildCost($capacity);

        if ($user->balance < $cost) {
            return back()->with('error', 'Insufficient funds to build this brewery.');
        }

        $brewery = $user->breweries()->create([
            'name'            => $request->name,
            'capacity_litres' => $capacity,
            'build_cost'      => $cost,
        ]);

        $user->decrement('balance', $cost);

        return back()->with('success', "Brewery '{$brewery->name}' built for £" . number_format($cost, 2));
    }

    public function destroy(Brewery $brewery)
    {
        $this->authorize('delete', $brewery);
        $brewery->delete();

        return back()->with('success', 'Brewery demolished.');
    }

    /** Queue a brew action */
    public function queueBrew(Request $request, Brewery $brewery)
    {
        $this->authorize('update', $brewery);

        $request->validate([
            'market_listing_id' => 'required|exists:market_listings,id',
            'quantity_litres'   => 'required|numeric|min:1',
            'pub_id'            => 'nullable|exists:pubs,id',
        ]);

        $listing = MarketListing::findOrFail($request->market_listing_id);
        $requiredRole = MarketListing::requiredStaffRole((float) $listing->abv);
        
        if (! $brewery->staff()->where('role', $requiredRole)->exists()) {
            return back()->with('error', "You need a {$requiredRole} to brew {$listing->name}.");
        }

        $pendingBrews = TurnAction::pending()
            ->where('user_id', auth()->id())
            ->where('type', 'brew')
            ->get();
            
        $currentlyQueued = $pendingBrews->filter(function($action) use ($brewery) {
            return ($action->payload['brewery_id'] ?? null) == $brewery->id;
        })->sum(function($action) {
            return (float) ($action->payload['quantity_litres'] ?? 0);
        });

        if ($currentlyQueued + $request->quantity_litres > $brewery->capacity_litres) {
            $remaining = max(0, $brewery->capacity_litres - $currentlyQueued);
            return back()->with('error', "Cannot queue {$request->quantity_litres}L. You only have {$remaining}L of capacity remaining this week.");
        }

        TurnAction::create([
            'user_id' => auth()->id(),
            'type'    => 'brew',
            'payload' => [
                'brewery_id'        => $brewery->id,
                'market_listing_id' => $request->market_listing_id,
                'quantity_litres'   => $request->quantity_litres,
                'pub_id'            => $request->pub_id,
            ],
        ]);

        return back()->with('success', 'Brew queued for next turn.');
    }

    private function calculateBuildCost(float $capacity): float
    {
        $tiers = Setting::json('brewery_build_cost_tiers', [
            ['max_litres' => 1000,  'cost_per_litre' => 25],
            ['max_litres' => 5000,  'cost_per_litre' => 12],
            ['max_litres' => 20000, 'cost_per_litre' => 7],
            ['max_litres' => null,  'cost_per_litre' => 4],
        ]);

        foreach ($tiers as $tier) {
            if ($tier['max_litres'] === null || $capacity <= $tier['max_litres']) {
                return $capacity * $tier['cost_per_litre'];
            }
        }

        return $capacity * 4;
    }
}
