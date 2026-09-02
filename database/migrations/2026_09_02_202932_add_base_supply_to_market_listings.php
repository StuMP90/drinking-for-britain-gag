<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('market_listings', function (Blueprint $table) {
            $table->decimal('base_supply', 12, 2)->after('retail_price')->default(0);
        });

        // Initialize base_supply to whatever the current supply is before we reset
        // Since we had an exponential explosion, we can't just use current supply.
        // It's better to just leave it 0 and run the seeder again, or manually reset them to 2000.
        DB::statement('UPDATE market_listings SET base_supply = 2000');
    }

    public function down(): void
    {
        Schema::table('market_listings', function (Blueprint $table) {
            $table->dropColumn('base_supply');
        });
    }
};
