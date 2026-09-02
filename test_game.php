<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\MarketListing;
use App\Models\Pub;
use App\Models\Brewery;
use App\Http\Controllers\GameController;
use Carbon\Carbon;

$user = User::first();
auth()->login($user); // login the user so auth()->user() works in store
$pub = $user->pubs()->first();
$brewery = $user->breweries()->first();

// Fake the liability as due today
$liability = $user->liabilities()->first();
if ($liability) {
    $liability->update(['due_date' => now()->subDay()]);
}

$balanceBefore = $user->balance;
echo "Starting balance: " . $balanceBefore . "\n";

$controller = new GameController();
$request = request()->merge([]);
$controller->store($request);

$user->refresh();
echo "Balance after turn: " . $user->balance . "\n";
echo "Expected balance drop by liability amount (" . ($liability ? $liability->amount : 0) . ")\n";
echo "Change: " . ($user->balance - $balanceBefore) . "\n";

$liabilities = $user->liabilities()->get();
echo "Liabilities: " . $liabilities->count() . "\n";
foreach ($liabilities as $l) {
    echo " Liability: " . $l->type . " " . $l->amount . " due " . $l->due_date . " paid " . $l->paid_at . "\n";
}

