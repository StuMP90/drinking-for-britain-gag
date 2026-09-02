<?php

namespace App\Models;



class Liability extends BaseModel
{
    protected $fillable = [
        'user_id',
        'type',
        'amount',
        'due_date',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'due_date' => 'date',
            'paid_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
