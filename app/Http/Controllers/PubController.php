<?php

namespace App\Http\Controllers;

use App\Models\Pub;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PubController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        return Inertia::render('Pub/Index', [
            'pubs'    => $user->pubs()
                              ->with(['staff', 'stocks' => fn($q) => $q->whereHas('marketListing', fn($q) => $q->where('type', 'product'))->with('marketListing')->orderBy('market_listing_id')])
                              ->orderBy('name')
                              ->get(),
            'balance' => $user->balance,
            'settings' => [
                'community_capacity' => Setting::number('pub_community_capacity', 70),
                'town_capacity'      => Setting::number('pub_town_capacity', 125),
                'city_capacity'      => Setting::number('pub_city_capacity', 275),
                'leasehold_cost'     => Setting::number('pub_leasehold_build_per_customer', 100),
                'freehold_cost'      => Setting::number('pub_freehold_build_per_customer', 1000),
                'tv_licence_cost'    => Setting::number('pub_sports_tv_licence_per_customer', 20),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'          => 'required|string|max:100',
            'category'      => 'required|in:community,town,city',
            'tenure'        => 'required|in:leasehold,freehold',
            'has_sports_tv' => 'boolean',
        ]);

        $user     = auth()->user();
        $capacity = $this->capacityForCategory($request->category);
        $costKey  = $request->tenure === 'freehold'
            ? 'pub_freehold_build_per_customer'
            : 'pub_leasehold_build_per_customer';
        $cost     = Setting::number($costKey) * $capacity;

        $tvCost = 0;
        if ($request->boolean('has_sports_tv')) {
            $tvCost = Setting::number('pub_sports_tv_licence_per_customer') * $capacity * 4; // 4 weeks upfront
        }

        $totalCost = $cost + $tvCost;

        if ($user->balance < $totalCost) {
            return back()->with('error', 'Insufficient funds to open this pub.');
        }

        $pub = $user->pubs()->create([
            'name'              => $request->name,
            'category'          => $request->category,
            'tenure'            => $request->tenure,
            'customer_capacity' => $capacity,
            'build_cost'        => $cost,
            'has_sports_tv'     => $request->boolean('has_sports_tv'),
        ]);

        $user->decrement('balance', $totalCost);

        return back()->with('success', "'{$pub->name}' opened for £" . number_format($totalCost, 2));
    }

    public function update(Request $request, Pub $pub)
    {
        $this->authorize('update', $pub);

        $request->validate([
            'has_sports_tv' => 'sometimes|boolean',
            'tenure'        => 'sometimes|in:freehold', // can only upgrade to freehold
        ]);

        $user = auth()->user();
        $totalCost = 0;
        $buildCostIncrease = 0;

        if ($request->has('has_sports_tv') && $request->boolean('has_sports_tv') && !$pub->has_sports_tv) {
            // Install TV - 4 weeks upfront
            $tvCost = Setting::number('pub_sports_tv_licence_per_customer') * $pub->customer_capacity * 4;
            $totalCost += $tvCost;
        }

        if ($request->has('tenure') && $request->tenure === 'freehold' && $pub->tenure === 'leasehold') {
            $freeholdCost = Setting::number('pub_freehold_build_per_customer');
            $leaseholdCost = Setting::number('pub_leasehold_build_per_customer');
            $upgradeCost = ($freeholdCost - $leaseholdCost) * $pub->customer_capacity;
            $totalCost += $upgradeCost;
            $buildCostIncrease = $upgradeCost;
        }

        if ($totalCost > 0 && $user->balance < $totalCost) {
            return back()->with('error', 'Insufficient funds for these upgrades.');
        }

        if ($totalCost > 0) {
            $user->decrement('balance', $totalCost);
        }

        if ($buildCostIncrease > 0) {
            $pub->increment('build_cost', $buildCostIncrease);
        }

        $pub->update($request->only('has_sports_tv', 'tenure'));

        return back()->with('success', 'Pub updated.');
    }

    public function destroy(Pub $pub)
    {
        $this->authorize('delete', $pub);
        $pub->delete();

        return back()->with('success', 'Pub closed.');
    }

    public function sell(Pub $pub)
    {
        $this->authorize('delete', $pub);
        
        $user = auth()->user();

        // 1. Calculate stock value (75% of cost)
        $stockReturn = 0;
        foreach ($pub->stocks as $stock) {
            $stockReturn += $stock->cost_per_unit * $stock->quantity_litres * 0.75;
        }

        // 2. Calculate staff severance (4 weeks wages)
        $severanceCost = 0;
        foreach ($pub->staff as $staff) {
            $severanceCost += $staff->weekly_wage * 4;
        }

        // 3. Calculate sale price (NBV * random modifier)
        $nbv = $pub->build_cost - $pub->accumulated_depreciation;
        $modifier = rand(-5, 25) / 100;
        $salePrice = $nbv * (1 + $modifier);

        // 4. Update balance
        $netReturn = $salePrice + $stockReturn - $severanceCost;
        $user->increment('balance', $netReturn);

        // 5. Cleanup
        $pubName = $pub->name;
        $pub->stocks()->delete();
        $pub->staff()->delete();
        $pub->delete();

        return back()->with('success', sprintf(
            "Sold '%s'. Sale Price: £%s, Stock Return: £%s, Staff Severance: £%s. Net Return: £%s.",
            $pubName,
            number_format($salePrice, 2),
            number_format($stockReturn, 2),
            number_format($severanceCost, 2),
            number_format($netReturn, 2)
        ));
    }

    /** Update retail prices for pub stocks */
    public function updateStockPrice(Request $request, Pub $pub)
    {
        $this->authorize('update', $pub);

        $request->validate([
            'stock_id'     => 'required|exists:stocks,id',
            'retail_price' => 'required|numeric|min:0.01',
        ]);

        $pub->stocks()->where('id', $request->stock_id)->update([
            'retail_price' => $request->retail_price,
        ]);

        return back()->with('success', 'Price updated.');
    }

    private function capacityForCategory(string $category): int
    {
        return match ($category) {
            'town'  => (int) Setting::number('pub_town_capacity', 125),
            'city'  => (int) Setting::number('pub_city_capacity', 275),
            default => (int) Setting::number('pub_community_capacity', 70),
        };
    }
}
