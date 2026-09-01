<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('brewery_id')->constrained()->cascadeOnDelete();
            $table->foreignId('market_listing_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity_kg', 12, 4)->default(0);
            $table->decimal('cost_per_unit', 10, 4)->default(0); // weighted avg cost per kg
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};
