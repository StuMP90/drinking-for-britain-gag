<?php

namespace App\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MarketListing extends BaseModel
{
    protected $fillable = [
        'name', 'type', 'abv', 'base_price', 'price',
        'retail_price', 'supply', 'demand', 'recipe', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'abv'          => 'decimal:2',
            'base_price'   => 'decimal:4',
            'price'        => 'decimal:4',
            'retail_price' => 'decimal:4',
            'supply'       => 'decimal:2',
            'demand'       => 'decimal:2',
            'recipe'       => 'array',
            'is_active'    => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (MarketListing $listing) {
            if ($listing->supply > 0) {
                $dutyPerLitre = $listing->type === 'product'
                    ? static::alcoholDutyPerLitre((float) $listing->abv, 'beer')
                    : 0.0;

                $listing->price = round(
                    ((float) $listing->base_price * ((float) $listing->demand / (float) $listing->supply)) + $dutyPerLitre,
                    4
                );
            }

            if ($listing->type === 'product') {
                $rrpMarkup   = Setting::number('rrp_markup', 1.5);
                $servingSize = static::servingSizeLitres((float) $listing->abv);

                // retail_price is stored **per serving** (pint / 175ml / 25ml)
                // so players set and see prices in familiar pub terms.
                $listing->retail_price = round((float) $listing->price * $rrpMarkup * $servingSize, 4);
            }
        });
    }

    // -------------------------------------------------------------------------
    // Serving size helpers
    // -------------------------------------------------------------------------

    /**
     * Serving size in litres based on ABV:
     *   beer  (≤ 8% ABV)  → 1 pint   = 0.568 L
     *   wine  (≤ 22% ABV) → 175 ml   = 0.175 L
     *   spirit (> 22% ABV) → 25 ml   = 0.025 L
     */
    public static function servingSizeLitres(float $abv): float
    {
        if ($abv > 22.0) return 0.025;
        if ($abv > 8.0)  return 0.175;
        return 0.568;
    }

    /**
     * Human-readable serving label for UI display.
     */
    public static function servingLabel(float $abv): string
    {
        if ($abv > 22.0) return '25ml';
        if ($abv > 8.0)  return '175ml';
        return 'pint';
    }

    // -------------------------------------------------------------------------
    // Duty calculations
    // -------------------------------------------------------------------------

    /**
     * Duty rate per litre of pure alcohol (UK banded rates).
     */
    public static function dutyRate(float $abv, string $type = 'beer'): float
    {
        if ($abv <= 1.2) return 0.0;
        if ($abv <= 3.4) return Setting::number('alcohol_duty_low_rate', 9.96);

        if ($abv <= 8.4) {
            return $type === 'spirit'
                ? Setting::number('alcohol_duty_spirit_mid_rate', 26.61)
                : Setting::number('alcohol_duty_beer_mid_rate', 22.58);
        }

        if ($abv <= 22.0) return Setting::number('alcohol_duty_high_rate', 30.62);

        return Setting::number('alcohol_duty_very_high_rate', 33.99);
    }

    /**
     * Alcohol duty per litre of product (not per litre of pure alcohol).
     */
    public static function alcoholDutyPerLitre(float $abv, string $type = 'beer'): float
    {
        return ($abv / 100) * static::dutyRate($abv, $type);
    }

    // -------------------------------------------------------------------------
    // Relationships & scopes
    // -------------------------------------------------------------------------

    public function stocks(): HasMany
    {
        return $this->hasMany(Stock::class);
    }

    public function ingredients(): HasMany
    {
        return $this->hasMany(Ingredient::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeProducts($query)
    {
        return $query->where('type', 'product');
    }

    public function scopeIngredients($query)
    {
        return $query->where('type', 'ingredient');
    }
}
