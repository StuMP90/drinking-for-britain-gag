<?php

namespace App\Models;

use App\Models\BaseModel;
use Illuminate\Support\Facades\Cache;

class Setting extends BaseModel
{
    protected $fillable = ['key', 'value', 'type', 'description'];

    /** Get a numeric setting value. */
    public static function number(string $key, float $default = 0): float
    {
        return (float) static::getValue($key, (string) $default);
    }

    /** Get a string setting value. */
    public static function value(string $key, string $default = ''): string
    {
        return static::getValue($key, $default);
    }

    /** Get a JSON-decoded setting value. */
    public static function json(string $key, array $default = []): array
    {
        $raw = static::getValue($key, null);

        return $raw !== null ? (json_decode($raw, true) ?? $default) : $default;
    }

    /** Set a setting value (and bust cache). */
    public static function set(string $key, mixed $value): void
    {
        $stored = is_array($value) ? json_encode($value) : (string) $value;
        static::updateOrCreate(['key' => $key], ['value' => $stored]);
        Cache::forget("setting:{$key}");
    }

    private static function getValue(string $key, ?string $default): ?string
    {
        return Cache::rememberForever("setting:{$key}", function () use ($key, $default) {
            $setting = static::where('key', $key)->first();

            return $setting ? $setting->value : $default;
        });
    }
}
