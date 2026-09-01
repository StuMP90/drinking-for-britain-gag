<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Base model for all application models.
 *
 * Overrides date serialisation so that any date/datetime field sent
 * to the frontend (via Inertia JSON) uses DD/MM/YYYY (UK standard)
 * rather than the default ISO 8601 format.
 */
abstract class BaseModel extends Model
{
    /**
     * Prepare a date for array / JSON serialisation.
     * Called by toArray() / toJson() on every date/timestamp field.
     */
    protected function serializeDate(\DateTimeInterface $date): string
    {
        return Carbon::instance($date)->format('d/m/Y');
    }
}
