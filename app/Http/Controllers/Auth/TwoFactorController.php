<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Passkeys\Actions\GenerateVerificationOptions;
use Laravel\Passkeys\Actions\VerifyPasskey;
use Laravel\Passkeys\Http\Requests\PasskeyVerificationRequest;
use Laravel\Passkeys\Support\WebAuthn;

class TwoFactorController extends Controller
{
    /**
     * Display the 2FA challenge view.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        if (! $request->session()->has('auth_user_id')) {
            return redirect()->route('login');
        }

        return Inertia::render('Auth/TwoFactorChallenge');
    }

    /**
     * Get the passkey verification options for the user.
     */
    public function options(Request $request, GenerateVerificationOptions $generate): JsonResponse|RedirectResponse
    {
        $userId = $request->session()->get('auth_user_id');

        if (! $userId) {
            return redirect()->route('login');
        }

        $user = User::findOrFail($userId);

        // Generate options allowing only the credentials belonging to this user
        $options = $generate($user);

        $serialized = WebAuthn::toJson($options);

        $request->session()->put('passkey.verification_options', $serialized);

        return response()->json([
            'options' => WebAuthn::toBrowserArray($options),
        ]);
    }

    /**
     * Verify the passkey and log the user in.
     */
    public function store(PasskeyVerificationRequest $request, VerifyPasskey $verify): JsonResponse|RedirectResponse
    {
        $userId = $request->session()->get('auth_user_id');

        if (! $userId) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $user = User::findOrFail($userId);

        try {
            $passkey = $verify(
                $request->credential(),
                $request->verificationOptions()
            );

            // Ensure the passkey belongs to the expected user
            if ($passkey->user_id !== $user->id) {
                return response()->json(['message' => 'Invalid passkey for this user.'], 403);
            }

            Auth::login($user, $request->session()->get('auth_remember', false));

            $request->session()->regenerate();
            $request->session()->forget(['auth_user_id', 'auth_remember', 'passkey.verification_options']);

            return response()->json(['redirect' => route('dashboard', absolute: false)]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
