<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->unique()->after('id');
            $table->decimal('balance', 15, 2)->default(100000.00)->after('password');
            $table->boolean('is_admin')->default(false)->after('balance');
            $table->boolean('is_paused')->default(false)->after('is_admin');
            $table->timestamp('started_at')->nullable()->after('is_paused');
            // email becomes optional (admin contact only)
            $table->string('email')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['username', 'balance', 'is_admin', 'is_paused', 'started_at']);
            $table->string('email')->nullable(false)->change();
        });
    }
};
