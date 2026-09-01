<?php

namespace App\Http\Controllers;

use App\Models\Brewery;
use App\Models\Ingredient;
use App\Models\MarketListing;
use App\Models\Pub;
use App\Models\Setting;
use App\Models\Staff;
use App\Models\Stock;
use App\Models\TaxPayment;
use App\Models\Turn;
use App\Models\TurnAction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class GameController extends Controller
{
    /** Player dashboard */
    public function index(): Response
    {
        $user = auth()->user();

        return Inertia::render('Dashboard', [
            'balance'     => $user->balance,
            'latestTurn'  => $user->latestTurn(),
            'recentTurns' => $user->turns()->limit(10)->get(),
            'nextWeek'    => $user->nextWeekCommencing()->format('d M Y'),
            'pendingActions' => $user->turnActions()->pending()->count(),
            'pubs'        => $user->pubs()->with('staff', 'stocks.marketListing')->get(),
            'breweries'   => $user->breweries()->with('staff', 'ingredients.marketListing')->get(),
        ]);
    }

    /** Process one turn for the authenticated player */
    public function store(Request $request)
    {
        $user = auth()->user();

        if ($user->is_paused) {
            return back()->with('error', 'Your account is paused.');
        }

        DB::transaction(function () use ($user) {
            $weekCommencing = $user->nextWeekCommencing();
            $financialYear  = $this->financialYear($weekCommencing);

            $turn = Turn::create([
                'user_id'         => $user->id,
                'week_commencing' => $weekCommencing,
                'financial_year'  => $financialYear,
            ]);

            // 1. Market supply reset
            $this->recalculateMarketSupply();

            // 2. Staff satisfaction
            $this->calculateSatisfaction($user);

            // 3. Process queued turn actions in order
            $actionOrder = ['purchase_ingredient', 'purchase_product', 'transfer', 'brew'];
            $pendingActions = $user->turnActions()->pending()->get()->sortBy(
                fn (TurnAction $a) => array_search($a->type, $actionOrder)
            );

            $actionLog = [];
            foreach ($pendingActions as $action) {
                $result = match ($action->type) {
                    'purchase_ingredient' => $this->applyPurchaseIngredient($user, $action->payload),
                    'purchase_product'    => $this->applyPurchaseProduct($user, $action->payload),
                    'transfer'            => $this->applyTransfer($user, $action->payload),
                    'brew'                => $this->applyBrew($user, $action->payload),
                    default               => ['success' => false, 'message' => 'Unknown action type'],
                };
                $action->update(['processed_at' => now(), 'result' => $result]);
                $actionLog[] = array_merge(['type' => $action->type], $result);
            }

            // 4. Pub sales
            $totalRevenue       = 0;
            $totalCogs          = 0;
            $totalVat           = 0;
            $totalAlcoholDuty   = 0;
            $totalLitresSold    = 0;
            $pubDetails         = [];

            foreach ($user->pubs()->active()->with('staff', 'stocks.marketListing')->get() as $pub) {
                $salesResult = $this->processPubSales($pub);
                $totalRevenue     += $salesResult['revenue'];
                $totalCogs        += $salesResult['cogs'];
                $totalVat         += $salesResult['vat'];
                $totalAlcoholDuty += $salesResult['alcohol_duty'];
                $totalLitresSold  += $salesResult['litres_sold'];
                $pubDetails[]      = $salesResult;
            }

            // 5. Operating costs
            $pubCosts      = $user->pubs()->active()->get()->sum(fn ($p) => $p->weeklyOperatingCosts());
            $breweryCosts  = $user->breweries()->active()->get()->sum(fn ($b) => $b->weeklyOperatingCosts());
            $totalCosts    = $pubCosts + $breweryCosts;

            // 6. Wages + PAYE + NI
            $allStaff = Staff::whereIn('staffable_id',
                array_merge(
                    $user->pubs()->pluck('id')->toArray(),
                    $user->breweries()->pluck('id')->toArray()
                )
            )->get();

            $totalWages       = 0;
            $totalIncomeTax   = 0;
            $totalEmployeeNi  = 0;
            $totalEmployerNi  = 0;

            foreach ($allStaff as $s) {
                $wage         = (float) $s->weekly_wage;
                $incomeTax    = $this->incomeTaxForWage($wage);
                $employeeNi   = $this->employeeNiForWage($wage);
                $employerNi   = $this->employerNiForWage($wage);

                $totalWages      += $wage;
                $totalIncomeTax  += $incomeTax;
                $totalEmployeeNi += $employeeNi;
                $totalEmployerNi += $employerNi;
            }

            // 7. Depreciation
            $depreciationYears = Setting::number('asset_depreciation_years', 33.3333);
            $turnsPerYear      = Setting::number('turns_per_year', 52);
            $depreciationTurns = $depreciationYears * $turnsPerYear;

            $totalDepreciation = 0;
            foreach ($user->pubs()->active()->get() as $pub) {
                $dep = (float) $pub->build_cost / $depreciationTurns;
                $pub->increment('accumulated_depreciation', $dep);
                $totalDepreciation += $dep;
            }
            foreach ($user->breweries()->active()->get() as $brewery) {
                $dep = (float) $brewery->build_cost / $depreciationTurns;
                $brewery->increment('accumulated_depreciation', $dep);
                $totalDepreciation += $dep;
            }

            // 8. Corporation tax
            $preTaxProfit = $totalRevenue - $totalCogs - $totalCosts - $totalWages
                          - $totalIncomeTax - $totalEmployeeNi - $totalEmployerNi
                          - $totalVat - $totalAlcoholDuty;

            $corpTaxRate  = Setting::number('corporation_tax_rate', 0.25);
            $corpTax      = $preTaxProfit > 0 ? round($preTaxProfit * $corpTaxRate, 2) : 0;

            $totalTaxes = $totalIncomeTax + $totalEmployeeNi + $totalEmployerNi
                        + $totalVat + $totalAlcoholDuty + $corpTax;

            $netProfit = $preTaxProfit - $corpTax;

            // 9. Update turn record
            $taxBreakdown = [
                'income_tax'     => round($totalIncomeTax, 2),
                'employee_ni'    => round($totalEmployeeNi, 2),
                'employer_ni'    => round($totalEmployerNi, 2),
                'vat'            => round($totalVat, 2),
                'alcohol_duty'   => round($totalAlcoholDuty, 2),
                'corporation_tax'=> round($corpTax, 2),
                'total'          => round($totalTaxes, 2),
            ];

            $turn->update([
                'revenue'       => round($totalRevenue, 2),
                'cogs'          => round($totalCogs, 2),
                'costs'         => round($totalCosts, 2),
                'wages'         => round($totalWages, 2),
                'taxes'         => round($totalTaxes, 2),
                'depreciation'  => round($totalDepreciation, 2),
                'profit'        => round($netProfit, 2),
                'litres_sold'   => round($totalLitresSold, 4),
                'tax_breakdown' => $taxBreakdown,
                'details'       => ['pubs' => $pubDetails, 'actions' => $actionLog],
            ]);

            // 10. Record tax payments
            foreach ($taxBreakdown as $type => $amount) {
                if ($type === 'total' || $amount <= 0) {
                    continue;
                }
                TaxPayment::create([
                    'user_id' => $user->id,
                    'turn_id' => $turn->id,
                    'type'    => $type,
                    'amount'  => $amount,
                ]);
            }

            // 11. Adjust player balance
            $balanceChange = $totalRevenue - $totalCogs - $totalCosts - $totalWages - $totalTaxes;
            $user->increment('balance', round($balanceChange, 2));

            if (! $user->started_at) {
                $user->update(['started_at' => now()]);
            }
        });

        return redirect()->route('dashboard')->with('success', 'Turn processed successfully.');
    }

    // -------------------------------------------------------------------------
    // Turn action processors
    // -------------------------------------------------------------------------

    private function applyPurchaseIngredient(User $user, array $payload): array
    {
        $listing  = MarketListing::find($payload['market_listing_id'] ?? 0);
        $brewery  = Brewery::where('user_id', $user->id)->find($payload['brewery_id'] ?? 0);
        $quantity = (float) ($payload['quantity_kg'] ?? 0);

        if (! $listing || ! $brewery || $quantity <= 0) {
            return ['success' => false, 'message' => 'Invalid purchase payload'];
        }

        $cost = $listing->price * $quantity;
        if ($user->balance < $cost) {
            return ['success' => false, 'message' => 'Insufficient funds'];
        }

        // Reduce market supply
        $listing->decrement('supply', $quantity);

        // Update ingredient stock (weighted avg)
        $ingredient = $brewery->ingredients()->firstOrCreate(
            ['market_listing_id' => $listing->id],
            ['quantity_kg' => 0, 'cost_per_unit' => 0]
        );

        $existingTotal = (float) $ingredient->quantity_kg * (float) $ingredient->cost_per_unit;
        $newTotal      = $quantity * (float) $listing->price;
        $newQty        = (float) $ingredient->quantity_kg + $quantity;
        $ingredient->update([
            'quantity_kg'   => $newQty,
            'cost_per_unit' => $newQty > 0 ? ($existingTotal + $newTotal) / $newQty : 0,
        ]);

        $user->decrement('balance', $cost);

        return ['success' => true, 'message' => "Purchased {$quantity}kg of {$listing->name}", 'cost' => $cost];
    }

    private function applyPurchaseProduct(User $user, array $payload): array
    {
        $listing  = MarketListing::find($payload['market_listing_id'] ?? 0);
        $pub      = Pub::where('user_id', $user->id)->find($payload['pub_id'] ?? 0);
        $quantity = (float) ($payload['quantity_litres'] ?? 0);

        if (! $listing || ! $pub || $quantity <= 0) {
            return ['success' => false, 'message' => 'Invalid purchase payload'];
        }

        $dutyPerLitre = MarketListing::alcoholDutyPerLitre((float) $listing->abv);
        $cost         = (float) $listing->price * $quantity;

        if ($user->balance < $cost) {
            return ['success' => false, 'message' => 'Insufficient funds'];
        }

        $listing->decrement('supply', $quantity);

        $stock = $pub->stocks()->firstOrCreate(
            ['market_listing_id' => $listing->id],
            ['quantity_litres' => 0, 'cost_per_unit' => 0, 'retail_price' => $listing->retail_price]
        );

        $existingTotal = (float) $stock->quantity_litres * (float) $stock->cost_per_unit;
        $newTotal      = $quantity * (float) $listing->price;
        $newQty        = (float) $stock->quantity_litres + $quantity;
        $stock->update([
            'quantity_litres' => $newQty,
            'cost_per_unit'   => $newQty > 0 ? ($existingTotal + $newTotal) / $newQty : 0,
        ]);

        $user->decrement('balance', $cost);

        return ['success' => true, 'message' => "Purchased {$quantity}L of {$listing->name}", 'cost' => $cost];
    }

    private function applyTransfer(User $user, array $payload): array
    {
        $breweryStock = Stock::where('stockable_type', Brewery::class)
            ->where('stockable_id', $payload['brewery_stock_id'] ?? 0)
            ->whereHas('stockable', fn ($q) => $q->where('user_id', $user->id))
            ->first();

        $pub      = Pub::where('user_id', $user->id)->find($payload['pub_id'] ?? 0);
        $quantity = (float) ($payload['quantity_litres'] ?? 0);

        if (! $breweryStock || ! $pub || $quantity <= 0) {
            return ['success' => false, 'message' => 'Invalid transfer payload'];
        }

        if ((float) $breweryStock->quantity_litres < $quantity) {
            return ['success' => false, 'message' => 'Insufficient brewery stock'];
        }

        $breweryStock->decrement('quantity_litres', $quantity);
        if ((float) $breweryStock->quantity_litres <= 0) {
            $breweryStock->delete();
        }

        $pubStock = $pub->stocks()->firstOrCreate(
            ['market_listing_id' => $breweryStock->market_listing_id],
            ['quantity_litres' => 0, 'cost_per_unit' => 0, 'retail_price' => $breweryStock->retail_price]
        );

        $existingTotal = (float) $pubStock->quantity_litres * (float) $pubStock->cost_per_unit;
        $addedTotal    = $quantity * (float) $breweryStock->cost_per_unit;
        $newQty        = (float) $pubStock->quantity_litres + $quantity;
        $pubStock->update([
            'quantity_litres' => $newQty,
            'cost_per_unit'   => $newQty > 0 ? ($existingTotal + $addedTotal) / $newQty : 0,
        ]);

        return ['success' => true, 'message' => "Transferred {$quantity}L to {$pub->name}"];
    }

    private function applyBrew(User $user, array $payload): array
    {
        $listing       = MarketListing::find($payload['market_listing_id'] ?? 0);
        $brewery       = Brewery::where('user_id', $user->id)->find($payload['brewery_id'] ?? 0);
        $targetPub     = Pub::where('user_id', $user->id)->find($payload['pub_id'] ?? 0);
        $quantityLitres = (float) ($payload['quantity_litres'] ?? 0);

        if (! $listing || ! $brewery || $quantityLitres <= 0) {
            return ['success' => false, 'message' => 'Invalid brew payload'];
        }

        $recipe = $listing->recipe ?? Setting::json('brewery_ingredient_rates');
        if (empty($recipe)) {
            return ['success' => false, 'message' => 'No recipe found for this product'];
        }

        $satisfaction     = $brewery->averageStaffSatisfaction();
        $producedQuantity = $quantityLitres * ($satisfaction / 50);
        $totalCost        = 0;
        $costPerUnit      = 0;
        $ingredientCosts  = [];

        foreach ($recipe as $ingredientName => $kgPerLitre) {
            $required = $quantityLitres * $kgPerLitre;

            $ingredientListing = MarketListing::where('name', $ingredientName)->first();
            if (! $ingredientListing) {
                return ['success' => false, 'message' => "Ingredient not found: {$ingredientName}"];
            }

            $heldIngredient = $brewery->ingredients()->where('market_listing_id', $ingredientListing->id)->first();
            $held           = $heldIngredient ? (float) $heldIngredient->quantity_kg : 0;
            $needed         = max(0, $required - $held);
            $ingredientCost = 0;

            if ($needed > 0) {
                $buyCost = (float) $ingredientListing->price * $needed;
                if ($user->balance < $buyCost) {
                    return ['success' => false, 'message' => "Insufficient funds to buy {$ingredientName}"];
                }
                $ingredientListing->decrement('supply', $needed);
                $user->decrement('balance', $buyCost);
                $ingredientCost += $buyCost;
            }

            if ($heldIngredient && $held > 0) {
                $useFromStock = min($held, $required);
                $ingredientCost += $useFromStock * (float) $heldIngredient->cost_per_unit;
                $heldIngredient->decrement('quantity_kg', $useFromStock);
            }

            $costPerUnit += ($ingredientCost / $required) * $kgPerLitre;
            $ingredientCosts[$ingredientName] = $ingredientCost;
            $totalCost += $ingredientCost;
        }

        $finalCostPerUnit = $producedQuantity > 0 ? $totalCost / $producedQuantity : 0;

        $defaultRetailPrice = $listing->retail_price ?? ($listing->price * Setting::number('rrp_markup', 1.5));

        if ($targetPub) {
            $pubStock = $targetPub->stocks()->firstOrCreate(
                ['market_listing_id' => $listing->id],
                ['quantity_litres' => 0, 'cost_per_unit' => 0, 'retail_price' => $defaultRetailPrice]
            );
            $existingTotal = (float) $pubStock->quantity_litres * (float) $pubStock->cost_per_unit;
            $newTotal      = $producedQuantity * $finalCostPerUnit;
            $newQty        = (float) $pubStock->quantity_litres + $producedQuantity;
            $pubStock->update([
                'quantity_litres' => $newQty,
                'cost_per_unit'   => $newQty > 0 ? ($existingTotal + $newTotal) / $newQty : 0,
            ]);
        } else {
            $breweryStock = $brewery->stocks()->firstOrCreate(
                ['market_listing_id' => $listing->id],
                ['quantity_litres' => 0, 'cost_per_unit' => 0, 'retail_price' => $defaultRetailPrice]
            );
            $existingTotal = (float) $breweryStock->quantity_litres * (float) $breweryStock->cost_per_unit;
            $newTotal      = $producedQuantity * $finalCostPerUnit;
            $newQty        = (float) $breweryStock->quantity_litres + $producedQuantity;
            $breweryStock->update([
                'quantity_litres' => $newQty,
                'cost_per_unit'   => $newQty > 0 ? ($existingTotal + $newTotal) / $newQty : 0,
            ]);
        }

        return [
            'success'          => true,
            'message'          => "Brewed {$producedQuantity}L of {$listing->name}",
            'litres_brewed'    => round($producedQuantity, 4),
            'cost'             => round($totalCost, 2),
            'satisfaction'     => $satisfaction,
        ];
    }

    // -------------------------------------------------------------------------
    // Pub sales engine
    // -------------------------------------------------------------------------

    private function processPubSales(Pub $pub): array
    {
        $drinksPerCustomer = Setting::number('pub_pints_per_customer_per_week', 20);
        $litresPerPint     = Setting::number('litres_per_pint', 0.568);
        $drinksPerStaff    = Setting::number('pub_pints_per_staff_per_week', 1500);
        $vatRate           = Setting::number('tax_vat_rate', 0.20);

        $effectiveCapacity = $pub->effectiveCapacity();
        $customerDemand    = $effectiveCapacity * $drinksPerCustomer; // in pints

        $staff    = $pub->staff;
        $minStaff = max(1, (int) ceil($effectiveCapacity / $drinksPerStaff));

        if ($staff->count() < $minStaff) {
            return ['pub_id' => $pub->id, 'pub_name' => $pub->name,
                    'revenue' => 0, 'cogs' => 0, 'vat' => 0,
                    'alcohol_duty' => 0, 'litres_sold' => 0,
                    'note' => 'Understaffed — no sales'];
        }

        $avgSatisfaction  = $staff->avg('satisfaction') ?? 50;
        $effectiveDrinks  = $drinksPerStaff * ($avgSatisfaction / 50);
        $serviceCapacity  = $staff->count() * $effectiveDrinks; // in pints
        $demandDrinks     = min($customerDemand, $serviceCapacity);
        $demandLitres     = $demandDrinks * $litresPerPint;

        // Demand-weighted allocation across stocks.
        // Weight is inverse-sqrt of per-litre equivalent price so that cheaper-per-litre
        // products attract more demand regardless of serving size.
        $stocks   = $pub->stocks->filter(fn ($s) => (float) $s->quantity_litres > 0);
        $weights  = $stocks->mapWithKeys(function ($s) {
            $abv          = (float) ($s->marketListing->abv ?? 4.0);
            $servingSize  = \App\Models\MarketListing::servingSizeLitres($abv);
            $pricePerLitre = $servingSize > 0
                ? (float) $s->retail_price / $servingSize
                : (float) $s->retail_price;
            return [$s->id => 1 / sqrt(max(0.01, $pricePerLitre))];
        });
        $totalWeight = $weights->sum();

        $revenue     = 0;
        $cogs        = 0;
        $alcoholDuty = 0;
        $litresSold  = 0;
        $remaining   = $demandLitres;

        foreach ($stocks as $stock) {
            if ($remaining <= 0) {
                break;
            }

            $share     = $totalWeight > 0 ? ($weights[$stock->id] / $totalWeight) : 0;
            $allocated = $remaining * $share;
            $sold      = min($allocated, (float) $stock->quantity_litres);

            if ($sold <= 0) {
                continue;
            }

            // retail_price is per-serving; convert to per-litre for revenue
            $abv         = (float) ($stock->marketListing->abv ?? 4.0);
            $servingSize = \App\Models\MarketListing::servingSizeLitres($abv);
            $revenue    += $sold * ((float) $stock->retail_price / max(0.001, $servingSize));
            $cogs       += $sold * (float) $stock->cost_per_unit;
            $litresSold += $sold;

            $abv      = (float) ($stock->marketListing->abv ?? 0);
            $alcoholDuty += MarketListing::alcoholDutyPerLitre($abv) * $sold;

            $stock->decrement('quantity_litres', $sold);
            $remaining -= $sold;
        }

        $vat = $revenue * $vatRate;

        return [
            'pub_id'       => $pub->id,
            'pub_name'     => $pub->name,
            'revenue'      => round($revenue, 2),
            'cogs'         => round($cogs, 2),
            'vat'          => round($vat, 2),
            'alcohol_duty' => round($alcoholDuty, 2),
            'litres_sold'  => round($litresSold, 4),
        ];
    }

    // -------------------------------------------------------------------------
    // Tax calculations (UK PAYE approximation)
    // -------------------------------------------------------------------------

    private function incomeTaxForWage(float $weeklyWage): float
    {
        $weeksPerYear    = Setting::number('tax_weeks_per_year', 52);
        $annualWage      = $weeklyWage * $weeksPerYear;
        $personalAllowance = Setting::number('tax_personal_allowance', 12570);
        $taper           = Setting::number('tax_personal_allowance_taper', 100000);

        if ($annualWage > ($taper + 2 * $personalAllowance)) {
            $personalAllowance = 0;
        } elseif ($annualWage > $taper) {
            $personalAllowance = max(0, $personalAllowance - ($annualWage - $taper) / 2);
        }

        $taxable    = max(0, $annualWage - $personalAllowance);
        $basicEnd   = Setting::number('tax_basic_rate_threshold', 37700);
        $higherEnd  = Setting::number('tax_higher_rate_threshold', 50270);
        $addlStart  = Setting::number('tax_additional_rate_threshold', 125140);
        $basicRate  = Setting::number('tax_basic_rate', 0.20);
        $higherRate = Setting::number('tax_higher_rate', 0.40);
        $addlRate   = Setting::number('tax_additional_rate', 0.45);

        $tax  = 0;
        $tax += min($taxable, $basicEnd) * $basicRate;
        if ($taxable > $basicEnd) {
            $tax += min($taxable - $basicEnd, $higherEnd - $basicEnd) * $higherRate;
        }
        if ($taxable > $higherEnd) {
            $tax += ($taxable - $higherEnd) * $addlRate;
        }

        return round($tax / $weeksPerYear, 2);
    }

    private function employeeNiForWage(float $weeklyWage): float
    {
        $primaryThreshold = Setting::number('ni_primary_threshold_weekly', 242);
        $upperLimit       = Setting::number('ni_upper_earnings_limit_weekly', 967);
        $mainRate         = Setting::number('ni_employee_rate', 0.08);
        $upperRate        = Setting::number('ni_employee_higher_rate', 0.02);

        $ni = 0;
        if ($weeklyWage > $primaryThreshold) {
            $ni += min($weeklyWage, $upperLimit) * $mainRate - $primaryThreshold * $mainRate;
        }
        if ($weeklyWage > $upperLimit) {
            $ni += ($weeklyWage - $upperLimit) * $upperRate;
        }

        return round(max(0, $ni), 2);
    }

    private function employerNiForWage(float $weeklyWage): float
    {
        $primaryThreshold = Setting::number('ni_primary_threshold_weekly', 242);
        $employerRate     = Setting::number('ni_employer_rate', 0.138);

        $ni = max(0, $weeklyWage - $primaryThreshold) * $employerRate;

        return round($ni, 2);
    }

    // -------------------------------------------------------------------------
    // Market supply reset
    // -------------------------------------------------------------------------

    private function recalculateMarketSupply(): void
    {
        $playerCount  = User::where('is_paused', false)->where('is_admin', false)->count();
        $breweryCount = Brewery::where('is_active', true)->count();
        $pubCount     = Pub::where('is_active', true)->count();

        $perPlayer  = Setting::number('market_supply_per_player', 0.4);
        $perBrewery = Setting::number('market_supply_per_brewery', 0.4);
        $perPub     = Setting::number('market_supply_per_pub', 0.1);
        $minSupply  = Setting::number('market_minimum_supply', 500);

        foreach (MarketListing::active()->get() as $listing) {
            $baseSupply   = (float) $listing->supply;
            $targetSupply = max(
                $minSupply,
                $baseSupply * (1 + $perPlayer * $playerCount + $perBrewery * $breweryCount + $perPub * $pubCount)
            );
            $listing->update(['supply' => $targetSupply, 'demand' => $targetSupply]);
        }
    }

    // -------------------------------------------------------------------------
    // Staff satisfaction update
    // -------------------------------------------------------------------------

    private function calculateSatisfaction(User $user): void
    {
        $pubStaffWage     = Setting::number('staff_default_wage', 400);
        $breweryStaffWage = Setting::number('brewery_staff_default_wage', 800);

        foreach ($user->pubs()->with('staff')->get() as $pub) {
            foreach ($pub->staff as $s) {
                $satisfaction = min(100, 50 * ((float) $s->weekly_wage / $pubStaffWage));
                $s->update(['satisfaction' => $satisfaction]);
            }
        }

        foreach ($user->breweries()->with('staff')->get() as $brewery) {
            foreach ($brewery->staff as $s) {
                $satisfaction = min(100, 50 * ((float) $s->weekly_wage / $breweryStaffWage));
                $s->update(['satisfaction' => $satisfaction]);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function financialYear(Carbon $date): string
    {
        $year = $date->month >= 4 ? $date->year : $date->year - 1;

        return "{$year}–" . ($year + 1);
    }
}
