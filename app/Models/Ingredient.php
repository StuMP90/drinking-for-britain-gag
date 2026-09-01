<?php

namespace App\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ingredient extends BaseModel
{
    protected $fillable = [
        'brewery_id', 'market_listing_id', 'quantity_kg', 'cost_per_unit',
    ];

    protected function casts(): array
    {
        return [
            'quantity_kg' => 'decimal:4',
            'cost_per_unit' => 'decimal:4',
        ];
    }

    public function brewery(): BelongsTo
    {
        return $this->belongsTo(Brewery::class);
    }

    public function marketListing(): BelongsTo
    {
        return $this->belongsTo(MarketListing::class);
    }
}
