<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('turn_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['purchase_ingredient', 'purchase_product', 'transfer', 'brew']);
            $table->json('payload'); // action-specific data
            $table->timestamp('processed_at')->nullable();
            $table->json('result')->nullable(); // success/failure details
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('turn_actions');
    }
};
