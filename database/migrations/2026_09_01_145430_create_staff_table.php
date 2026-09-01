<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->morphs('staffable'); // staffable_type, staffable_id
            $table->string('name');
            $table->string('role')->default('Bar Staff');
            $table->decimal('weekly_wage', 10, 2)->default(400.00);
            $table->decimal('satisfaction', 5, 2)->default(50.00); // 0–100
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff');
    }
};
