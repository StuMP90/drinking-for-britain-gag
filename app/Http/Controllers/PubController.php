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
            'pubs'    => $user->pubs()->with('staff', 'stocks.marketListing')->get(),
            'balance' => $user->balance,
            'settings' => [
                'community_capacity' => Setting::number('pub_community_capacity', 70),
                'town_capacity'      => Setting::number('pub_town_capacity', 125),
                'city_capacity'      => Setting::number('pub_city_capacity', 275),
                'leasehold_cost'     => Setting::number('pub_leasehold_build_per_customer', 100),
                'freehold_cost'      => Setting::number('pub_freehold_build_per_customer', 1000),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:100',
            'category' => 'required|in:community,town,city',
            'tenure'   => 'required|in:leasehold,freehold',
        ]);

        $user     = auth()->user();
        $capacity = $this->capacityForCategory($request->category);
        $costKey  = $request->tenure === 'freehold'
            ? 'pub_freehold_build_per_customer'
            : 'pub_leasehold_build_per_customer';
        $cost     = Setting::number($costKey) * $capacity;

        if ($user->balance < $cost) {
            return back()->with('error', 'Insufficient funds to open this pub.');
        }

        $pub = $user->pubs()->create([
            'name'              => $request->name,
            'category'          => $request->category,
            'tenure'            => $request->tenure,
            'customer_capacity' => $capacity,
            'build_cost'        => $cost,
        ]);

        $user->decrement('balance', $cost);

        return back()->with('success', "'{$pub->name}' opened for £" . number_format($cost, 2));
    }

    public function update(Request $request, Pub $pub)
    {
        $this->authorize('update', $pub);

        $request->validate([
            'has_sports_tv' => 'sometimes|boolean',
        ]);

        if ($request->has('has_sports_tv') && ! $pub->has_sports_tv) {
            $user = auth()->user();
            $tvCost = Setting::number('pub_sports_tv_licence_per_customer') * $pub->customer_capacity * 52;
            if ($user->balance < $tvCost) {
                return back()->with('error', 'Insufficient funds for sports TV installation.');
            }
            $user->decrement('balance', $tvCost);
        }

        $pub->update($request->only('has_sports_tv'));

        return back()->with('success', 'Pub updated.');
    }

    public function destroy(Pub $pub)
    {
        $this->authorize('delete', $pub);
        $pub->delete();

        return back()->with('success', 'Pub closed.');
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
