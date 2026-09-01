<?php

namespace App\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Stock extends BaseModel
{
    protected $fillable = [
        'market_listing_id', 'quantity_litres', 'cost_per_unit', 'retail_price',
    ];

    protected function casts(): array
    {
        return [
            'quantity_litres' => 'decimal:4',
            'cost_per_unit' => 'decimal:4',
            'retail_price' => 'decimal:4',
        ];
    }

    public function stockable(): MorphTo
    {
        return $this->morphTo();
    }

    public function marketListing(): BelongsTo
    {
        return $this->belongsTo(MarketListing::class);
    }
}
