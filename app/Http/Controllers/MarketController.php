<?php

namespace App\Http\Controllers;

use App\Models\MarketListing;
use App\Models\Pub;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MarketController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        return Inertia::render('Market/Index', [
            'products' => MarketListing::active()->products()->orderBy('name')->get(),
            'pubs'     => $user->pubs()->orderBy('name')->get(['id', 'name']),
            'balance'  => $user->balance,
        ]);
    }

    /**
     * Purchase finished products immediately — deduct balance, add to pub stock,
     * decrement market supply. No turn-queue needed.
     */
    public function buyProduct(Request $request)
    {
        $data = $request->validate([
            'market_listing_id' => 'required|exists:market_listings,id',
            'pub_id'            => 'required|exists:pubs,id',
            'quantity_litres'   => 'required|numeric|min:0.1|max:100000',
        ]);

        $user    = auth()->user();
        $listing = MarketListing::findOrFail($data['market_listing_id']);
        $pub     = Pub::where('user_id', $user->id)->findOrFail($data['pub_id']);
        $qty     = (float) $data['quantity_litres'];
        $cost    = round($qty * (float) $listing->price, 2);

        if ($user->balance < $cost) {
            return back()->withErrors(['quantity_litres' => "Insufficient funds. Cost: £{$cost}, Balance: £{$user->balance}"]);
        }

        if ($listing->supply < $qty) {
            return back()->withErrors(['quantity_litres' => "Only {$listing->supply}L available in market."]);
        }

        DB::transaction(function () use ($user, $pub, $listing, $qty, $cost) {
            // Deduct player balance
            $user->decrement('balance', $cost);

            // Weighted-average cost into pub stock
            $stock = $pub->stocks()->firstOrCreate(
                ['market_listing_id' => $listing->id],
                ['quantity_litres' => 0, 'cost_per_unit' => 0, 'retail_price' => $listing->retail_price]
            );

            $oldQty   = (float) $stock->quantity_litres;
            $oldTotal = $oldQty * (float) $stock->cost_per_unit;
            $newQty   = $oldQty + $qty;

            $stock->update([
                'quantity_litres' => $newQty,
                'cost_per_unit'   => $newQty > 0 ? ($oldTotal + $cost) / $newQty : 0,
                // retail_price is intentionally omitted — preserve the player's custom price
            ]);

            // Reduce market supply
            $listing->decrement('supply', $qty);

            // Record estimated indirect taxes paid via the supply chain (duty + 20% of remaining cost for NI/Corp Tax etc)
            $duty = \App\Models\MarketListing::alcoholDutyPerLitre((float) $listing->abv) * $qty;
            $indirect = $duty + (($cost - $duty) * 0.20);
            $currentGlobal = \App\Models\Setting::number('global_indirect_tax', 0);
            \App\Models\Setting::set('global_indirect_tax', $currentGlobal + $indirect);
        });

        $name = $listing->name;
        $fmt  = '£' . number_format($cost, 2);

        return back()->with('success', "Purchased {$qty}L of {$name} for {$fmt} → delivered to {$pub->name}.");
    }
}
