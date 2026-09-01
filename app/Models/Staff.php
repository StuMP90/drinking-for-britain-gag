<?php

namespace App\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Staff extends BaseModel
{
    protected $fillable = [
        'name', 'role', 'weekly_wage', 'satisfaction',
    ];

    protected function casts(): array
    {
        return [
            'weekly_wage' => 'decimal:2',
            'satisfaction' => 'decimal:2',
        ];
    }

    public function staffable(): MorphTo
    {
        return $this->morphTo();
    }
}
