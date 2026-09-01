<?php

namespace App\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Brewery extends BaseModel
{
    protected $fillable = [
        'user_id', 'name', 'capacity_litres',
        'build_cost', 'accumulated_depreciation', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'capacity_litres' => 'decimal:2',
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

    public function ingredients(): HasMany
    {
        return $this->hasMany(Ingredient::class);
    }

    public function stocks(): MorphMany
    {
        return $this->morphMany(Stock::class, 'stockable');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /** Weekly operating costs (insurance + utilities). */
    public function weeklyOperatingCosts(): float
    {
        $litres = (float) $this->capacity_litres;

        return ($litres * Setting::number('brewery_insurance_per_litre'))
             + ($litres * Setting::number('brewery_utilities_per_litre'));
    }

    /** Average staff satisfaction (0–100). */
    public function averageStaffSatisfaction(): float
    {
        $staff = $this->staff;

        return $staff->isEmpty() ? 50.0 : (float) $staff->avg('satisfaction');
    }
}
