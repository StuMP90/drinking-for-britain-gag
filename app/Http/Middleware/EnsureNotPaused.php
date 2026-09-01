<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureNotPaused
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->is_paused && ! $request->user()->is_admin) {
            return redirect()->route('dashboard')->with('error', 'Your account has been paused by the administrator.');
        }

        return $next($request);
    }
}
