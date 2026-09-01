<?php

namespace App\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Turn extends BaseModel
{
    protected $fillable = [
        'user_id', 'week_commencing', 'financial_year',
        'revenue', 'cogs', 'costs', 'wages', 'taxes',
        'depreciation', 'profit', 'litres_brewed', 'litres_sold',
        'tax_breakdown', 'details',
    ];

    protected function casts(): array
    {
        return [
            'week_commencing' => 'date',
            'revenue' => 'decimal:2',
            'cogs' => 'decimal:2',
            'costs' => 'decimal:2',
            'wages' => 'decimal:2',
            'taxes' => 'decimal:2',
            'depreciation' => 'decimal:2',
            'profit' => 'decimal:2',
            'litres_brewed' => 'decimal:4',
            'litres_sold' => 'decimal:4',
            'tax_breakdown' => 'array',
            'details' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function taxPayments(): HasMany
    {
        return $this->hasMany(TaxPayment::class);
    }
}
