<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name'       => 'Administrator',
                'username'   => 'admin',
                'email'      => null,
                'password'   => bcrypt(env('ADMIN_PASSWORD', 'changeme123!')),
                'balance'    => 0,
                'is_admin'   => true,
                'is_paused'  => false,
                'started_at' => null,
            ]
        );
    }
}
