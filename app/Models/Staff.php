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

    public function recalculateSatisfaction(): void
    {
        $pubStaffWage     = \App\Models\Setting::number('staff_default_wage', 400);
        $breweryStaffWage = \App\Models\Setting::number('brewery_staff_default_wage', 800);

        $defaultWage = ($this->staffable_type === \App\Models\Pub::class) ? $pubStaffWage : $breweryStaffWage;

        $satisfaction = min(100, 50 * ((float) $this->weekly_wage / $defaultWage));
        $this->update(['satisfaction' => $satisfaction]);
    }
}
