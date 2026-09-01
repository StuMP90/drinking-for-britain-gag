<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stocks', function (Blueprint $table) {
            $table->id();
            $table->morphs('stockable'); // stockable_type, stockable_id (pub or brewery)
            $table->foreignId('market_listing_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity_litres', 12, 4)->default(0);
            $table->decimal('cost_per_unit', 10, 4)->default(0); // weighted avg cost per litre
            $table->decimal('retail_price', 10, 4)->default(0);   // per litre
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stocks');
    }
};
