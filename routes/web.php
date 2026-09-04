<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\BreweryController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\MarketController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PubController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\StockTransferController;
use App\Models\TaxPayment;
use App\Models\Turn;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ─── Public marketing homepage ────────────────────────────────────────────────
Route::get('/', function () {
    $totalPlayers      = User::where('is_admin', false)->count();
    $cumulativeRevenue = Turn::sum('revenue');
    $cumulativeTax     = TaxPayment::sum('amount');
    $outstandingTax    = \App\Models\Liability::whereNull('paid_at')->sum('amount');

    // Read the estimated indirect taxes paid via the supply chain for wholesale purchases from settings
    $indirectTax = \App\Models\Setting::number('global_indirect_tax', 0);

    return Inertia::render('Welcome', [
        'stats' => [
            'total_players'      => $totalPlayers,
            'cumulative_revenue' => round($cumulativeRevenue, 2),
            'total_tax_paid'     => round($cumulativeTax, 2),
            'outstanding_tax'    => round($outstandingTax, 2),
            'indirect_tax'       => round($indirectTax, 2),
        ],
    ]);
})->name('home');

// ─── Authenticated player routes ──────────────────────────────────────────────
Route::middleware(['auth', 'not-paused', 'throttle:web'])->group(function () {
    // Dashboard / turn processing
    Route::get('/dashboard', [GameController::class, 'index'])->name('dashboard');
    Route::post('/turn', [GameController::class, 'store'])->name('turn.store')->middleware('throttle:turn');

    // Pubs
    Route::get('/pubs', [PubController::class, 'index'])->name('pubs.index');
    Route::post('/pubs', [PubController::class, 'store'])->name('pubs.store');
    Route::patch('/pubs/{pub}', [PubController::class, 'update'])->name('pubs.update');
    Route::delete('/pubs/{pub}', [PubController::class, 'destroy'])->name('pubs.destroy');
    Route::post('/pubs/{pub}/sell', [PubController::class, 'sell'])->name('pubs.sell');
    Route::post('/pubs/{pub}/stock-price', [PubController::class, 'updateStockPrice'])->name('pubs.stock-price');

    // Breweries
    Route::get('/breweries', [BreweryController::class, 'index'])->name('breweries.index');
    Route::post('/breweries', [BreweryController::class, 'store'])->name('breweries.store');
    Route::delete('/breweries/{brewery}', [BreweryController::class, 'destroy'])->name('breweries.destroy');
    Route::post('/breweries/{brewery}/sell', [BreweryController::class, 'sell'])->name('breweries.sell');
    Route::post('/breweries/{brewery}/brew', [BreweryController::class, 'queueBrew'])->name('breweries.brew');

    Route::get('/market', [MarketController::class, 'index'])->name('market.index');
    Route::post('/market/product', [MarketController::class, 'buyProduct'])->name('market.buy-product');

    // Stock transfers
    Route::post('/transfers', [StockTransferController::class, 'store'])->name('transfers.store');

    // Staff
    Route::post('/staff', [StaffController::class, 'store'])->name('staff.store');
    Route::patch('/staff/{staff}', [StaffController::class, 'update'])->name('staff.update');
    Route::delete('/staff/{staff}', [StaffController::class, 'destroy'])->name('staff.destroy');

    // Profile (Breeze default)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Passkeys API
    Route::get('/user/passkeys', function (\Illuminate\Http\Request $request) {
        return $request->user()->passkeys;
    })->name('passkeys.index');
});

// ─── Admin routes ─────────────────────────────────────────────────────────────
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [Admin\DashboardController::class, 'index'])->name('dashboard');

    Route::get('/players', [Admin\PlayerController::class, 'index'])->name('players.index');
    Route::post('/players', [Admin\PlayerController::class, 'store'])->name('players.store');
    Route::get('/players/{player}', [Admin\PlayerController::class, 'show'])->name('players.show');
    Route::post('/players/{player}/reset', [Admin\PlayerController::class, 'reset'])->name('players.reset');
    Route::post('/players/{player}/toggle-pause', [Admin\PlayerController::class, 'togglePause'])->name('players.toggle-pause');
    Route::delete('/players/{player}', [Admin\PlayerController::class, 'destroy'])->name('players.destroy');

    Route::get('/settings', [Admin\SettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings', [Admin\SettingsController::class, 'update'])->name('settings.update');
});

require __DIR__.'/auth.php';
