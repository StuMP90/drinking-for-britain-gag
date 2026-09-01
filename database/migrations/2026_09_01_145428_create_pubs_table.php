<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pubs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('category', ['community', 'town', 'city'])->default('community');
            $table->enum('tenure', ['leasehold', 'freehold'])->default('leasehold');
            $table->unsignedInteger('customer_capacity')->default(70);
            $table->boolean('has_sports_tv')->default(false);
            $table->decimal('build_cost', 15, 2)->default(0);
            $table->decimal('accumulated_depreciation', 15, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pubs');
    }
};
