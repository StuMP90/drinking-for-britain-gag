<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Authenticate using username.
     * Uses constant-time comparison to prevent user enumeration.
     *
     * @throws ValidationException
     */
    public function authenticate(): ?User
    {
        $this->ensureIsNotRateLimited();

        // Generic error for both wrong username and wrong password (anti-enumeration)
        $genericError = trans('auth.failed');

        $user = User::where('username', $this->string('username'))->first();

        // Always run hash check even if user not found (constant-time, prevents timing attacks)
        $passwordCorrect = $user
            ? Hash::check($this->string('password'), $user->password)
            : Hash::check($this->string('password'), '$2y$12$placeholder_hash_prevents_timing_attack_aaaaaaaaaaaaa');

        if (! $user || ! $passwordCorrect) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'username' => $genericError,
            ]);
        }

        if ($user->passkeys()->exists()) {
            RateLimiter::clear($this->throttleKey());
            return $user;
        }

        Auth::login($user, $this->boolean('remember'));
        RateLimiter::clear($this->throttleKey());
        return null;
    }

    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'username' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    public function throttleKey(): string
    {
        // Key on IP only — not username — to avoid leaking whether a username exists
        return 'login|' . $this->ip();
    }
}
