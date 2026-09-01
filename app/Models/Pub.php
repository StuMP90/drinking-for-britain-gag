<?php

namespace App\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Pub extends BaseModel
{
    protected $fillable = [
        'user_id', 'name', 'category', 'tenure',
        'customer_capacity', 'has_sports_tv',
        'build_cost', 'accumulated_depreciation', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'has_sports_tv' => 'boolean',
            'is_active' => 'boolean',
            'build_cost' => 'decimal:2',
            'accumulated_depreciation' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function staff(): MorphMany
    {
        return $this->morphMany(Staff::class, 'staffable');
    }

    public function stocks(): MorphMany
    {
        return $this->morphMany(Stock::class, 'stockable');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /** Effective customer capacity (boosted by sports TV). */
    public function effectiveCapacity(): int
    {
        return $this->has_sports_tv
            ? (int) round($this->customer_capacity * 1.5)
            : $this->customer_capacity;
    }

    /** Weekly operating costs excluding staff wages. */
    public function weeklyOperatingCosts(): float
    {
        $cap = $this->customer_capacity;
        $rent = $this->tenure === 'leasehold' ? Setting::number('pub_rent_per_customer') * $cap : 0;
        $insurance = Setting::number('pub_insurance_per_customer') * $cap;
        $utilities = Setting::number('pub_utilities_per_customer') * $cap;
        $tv = $this->has_sports_tv ? Setting::number('pub_sports_tv_licence_per_customer') * $cap : 0;

        return $rent + $insurance + $utilities + $tv;
    }
}
