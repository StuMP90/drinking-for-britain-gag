<?php

namespace App\Policies;

use App\Models\Pub;
use App\Models\User;

class PubPolicy
{
    public function update(User $user, Pub $pub): bool
    {
        return $user->id === $pub->user_id;
    }

    public function delete(User $user, Pub $pub): bool
    {
        return $user->id === $pub->user_id;
    }
}
