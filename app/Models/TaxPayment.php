<?php

namespace App\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaxPayment extends BaseModel
{
    protected $fillable = [
        'user_id', 'turn_id', 'type', 'amount',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function turn(): BelongsTo
    {
        return $this->belongsTo(Turn::class);
    }
}
