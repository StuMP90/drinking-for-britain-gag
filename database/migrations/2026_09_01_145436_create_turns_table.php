<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('turns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('week_commencing');
            $table->string('financial_year'); // e.g. "2026-2027"
            $table->decimal('revenue', 15, 2)->default(0);
            $table->decimal('cogs', 15, 2)->default(0);           // cost of goods sold
            $table->decimal('costs', 15, 2)->default(0);           // operating costs
            $table->decimal('wages', 15, 2)->default(0);
            $table->decimal('taxes', 15, 2)->default(0);           // total taxes paid
            $table->decimal('depreciation', 15, 2)->default(0);
            $table->decimal('profit', 15, 2)->default(0);
            $table->decimal('litres_brewed', 10, 4)->default(0);
            $table->decimal('litres_sold', 10, 4)->default(0);
            $table->json('tax_breakdown')->nullable();              // detailed tax breakdown
            $table->json('details')->nullable();                    // full turn detail JSON
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('turns');
    }
};
