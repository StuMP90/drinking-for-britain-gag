<?php

namespace App\Policies;

use App\Models\Brewery;
use App\Models\User;

class BreweryPolicy
{
    public function update(User $user, Brewery $brewery): bool
    {
        return $user->id === $brewery->user_id;
    }

    public function delete(User $user, Brewery $brewery): bool
    {
        return $user->id === $brewery->user_id;
    }
}
