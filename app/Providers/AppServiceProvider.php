<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        RateLimiter::for('web', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('turn', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip());
        });
    }
}
