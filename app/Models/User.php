<?php

namespace App\Models;

use Carbon\Carbon;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'username', 'email', 'password', 'balance', 'is_admin', 'is_paused', 'started_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'started_at'        => 'datetime',
            'password'          => 'hashed',
            'balance'           => 'decimal:2',
            'is_admin'          => 'boolean',
            'is_paused'         => 'boolean',
        ];
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return Carbon::instance($date)->format('d/m/Y');
    }

    public function pubs(): HasMany
    {
        return $this->hasMany(Pub::class);
    }

    public function breweries(): HasMany
    {
        return $this->hasMany(Brewery::class);
    }

    public function turns(): HasMany
    {
        return $this->hasMany(Turn::class)->orderByDesc('week_commencing');
    }

    public function turnActions(): HasMany
    {
        return $this->hasMany(TurnAction::class);
    }

    public function taxPayments(): HasMany
    {
        return $this->hasMany(TaxPayment::class);
    }

    public function liabilities(): HasMany
    {
        return $this->hasMany(Liability::class);
    }

    public function latestTurn(): ?Turn
    {
        return $this->turns()->first();
    }

    /** Next week commencing date for this player. */
    public function nextWeekCommencing(): \Carbon\Carbon
    {
        $latest = $this->turns()->first();
        if ($latest) {
            return $latest->week_commencing->addWeek();
        }

        return \Carbon\Carbon::parse('2026-04-06');
    }
}
