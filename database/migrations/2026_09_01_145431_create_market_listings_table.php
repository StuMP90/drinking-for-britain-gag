<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('market_listings', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['ingredient', 'product'])->default('product');
            $table->decimal('abv', 5, 2)->default(0.00); // alcohol by volume %
            $table->decimal('base_price', 10, 4)->default(0); // per litre/kg
            $table->decimal('price', 10, 4)->default(0);       // current dynamic price
            $table->decimal('retail_price', 10, 4)->default(0); // RRP for products
            $table->decimal('supply', 12, 2)->default(500);
            $table->decimal('demand', 12, 2)->default(500);
            $table->json('recipe')->nullable(); // ingredient kg per litre for products
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('market_listings');
    }
};
