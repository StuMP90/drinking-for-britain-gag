<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // Volume conversions
            ['key' => 'litres_per_pint',             'value' => '0.568',   'type' => 'number', 'description' => 'Physical conversion: pints to litres'],
            ['key' => 'pints_per_gallon',             'value' => '8',       'type' => 'number', 'description' => 'Pints per gallon'],

            // Pub capacities
            ['key' => 'pub_community_capacity',       'value' => '70',      'type' => 'number', 'description' => 'Community pub default customer capacity'],
            ['key' => 'pub_town_capacity',            'value' => '125',     'type' => 'number', 'description' => 'Town pub default customer capacity'],
            ['key' => 'pub_city_capacity',            'value' => '275',     'type' => 'number', 'description' => 'City pub default customer capacity'],

            // Pub build costs
            ['key' => 'pub_leasehold_build_per_customer', 'value' => '100', 'type' => 'number', 'description' => 'Leasehold pub build cost per customer'],
            ['key' => 'pub_freehold_build_per_customer',  'value' => '1000','type' => 'number', 'description' => 'Freehold pub build cost per customer'],

            // Pub weekly costs
            ['key' => 'pub_rent_per_customer',            'value' => '2',   'type' => 'number', 'description' => 'Weekly leasehold rent per customer'],
            ['key' => 'pub_insurance_per_customer',       'value' => '1',   'type' => 'number', 'description' => 'Weekly pub insurance per customer'],
            ['key' => 'pub_utilities_per_customer',       'value' => '0.6', 'type' => 'number', 'description' => 'Weekly pub utilities per customer'],
            ['key' => 'pub_sports_tv_licence_per_customer','value' => '2',  'type' => 'number', 'description' => 'Weekly sports TV licence per customer'],

            // Staff
            ['key' => 'staff_default_wage',               'value' => '400', 'type' => 'number', 'description' => 'Default weekly pub staff wage'],
            ['key' => 'brewery_staff_default_wage',       'value' => '800', 'type' => 'number', 'description' => 'Default weekly brewery staff wage'],
            ['key' => 'brewery_staff_default_role',       'value' => 'Brewer', 'type' => 'string', 'description' => 'Default brewery staff role'],

            // Pub performance
            ['key' => 'pub_pints_per_customer_per_week', 'value' => '20',   'type' => 'number', 'description' => 'Drinks consumed per customer per week'],
            ['key' => 'pub_pints_per_staff_per_week',    'value' => '1500', 'type' => 'number', 'description' => 'Max drinks served per staff member per week'],

            // Brewery costs
            ['key' => 'brewery_insurance_per_litre',     'value' => '0.01', 'type' => 'number', 'description' => 'Weekly brewery insurance per litre of capacity'],
            ['key' => 'brewery_utilities_per_litre',     'value' => '0.08', 'type' => 'number', 'description' => 'Weekly brewery utilities per litre of capacity'],

            // Brewery build cost tiers (JSON: array of {max_litres, cost_per_litre})
            ['key' => 'brewery_build_cost_tiers', 'value' => json_encode([
                ['max_litres' => 1000,  'cost_per_litre' => 25],
                ['max_litres' => 5000,  'cost_per_litre' => 12],
                ['max_litres' => 20000, 'cost_per_litre' => 7],
                ['max_litres' => null,  'cost_per_litre' => 4],
            ]), 'type' => 'json', 'description' => 'Brewery build cost tiers (non-linear)'],

            // Default brewery recipe
            ['key' => 'brewery_ingredient_rates', 'value' => json_encode([
                'Pale Malt'   => 0.2,
                'Bitter Hops' => 0.05,
                'Ale Yeast'   => 0.01,
            ]), 'type' => 'json', 'description' => 'Default recipe: kg per litre of beer'],

            // Alcohol duty (per litre of pure alcohol)
            ['key' => 'alcohol_duty_low_rate',         'value' => '9.96',  'type' => 'number', 'description' => 'UK duty: beer/cider 1.2–3.4% ABV (per litre alcohol)'],
            ['key' => 'alcohol_duty_beer_mid_rate',    'value' => '22.58', 'type' => 'number', 'description' => 'UK duty: beer 3.5–8.4% ABV (per litre alcohol)'],
            ['key' => 'alcohol_duty_spirit_mid_rate',  'value' => '26.61', 'type' => 'number', 'description' => 'UK duty: spirits 3.5–8.4% ABV (per litre alcohol)'],
            ['key' => 'alcohol_duty_high_rate',        'value' => '30.62', 'type' => 'number', 'description' => 'UK duty: 8.5–22% ABV (per litre alcohol)'],
            ['key' => 'alcohol_duty_very_high_rate',   'value' => '33.99', 'type' => 'number', 'description' => 'UK duty: above 22% ABV (per litre alcohol)'],

            // VAT
            ['key' => 'tax_vat_rate',                  'value' => '0.20',  'type' => 'number', 'description' => 'VAT rate'],

            // Income tax
            ['key' => 'tax_weeks_per_year',            'value' => '52',      'type' => 'number', 'description' => 'Weeks per tax year'],
            ['key' => 'tax_personal_allowance',        'value' => '12570',   'type' => 'number', 'description' => 'UK income tax personal allowance'],
            ['key' => 'tax_personal_allowance_taper',  'value' => '100000',  'type' => 'number', 'description' => 'Personal allowance taper start'],
            ['key' => 'tax_basic_rate_threshold',      'value' => '37700',   'type' => 'number', 'description' => 'Basic rate band ceiling'],
            ['key' => 'tax_higher_rate_threshold',     'value' => '50270',   'type' => 'number', 'description' => 'Higher rate threshold'],
            ['key' => 'tax_additional_rate_threshold', 'value' => '125140',  'type' => 'number', 'description' => 'Additional rate threshold'],
            ['key' => 'tax_basic_rate',                'value' => '0.20',    'type' => 'number', 'description' => 'Basic income tax rate'],
            ['key' => 'tax_higher_rate',               'value' => '0.40',    'type' => 'number', 'description' => 'Higher income tax rate'],
            ['key' => 'tax_additional_rate',           'value' => '0.45',    'type' => 'number', 'description' => 'Additional income tax rate'],

            // National Insurance
            ['key' => 'ni_primary_threshold_weekly',   'value' => '242',  'type' => 'number', 'description' => 'NI primary threshold (weekly)'],
            ['key' => 'ni_upper_earnings_limit_weekly','value' => '967',  'type' => 'number', 'description' => 'NI upper earnings limit (weekly)'],
            ['key' => 'ni_employee_rate',              'value' => '0.08', 'type' => 'number', 'description' => 'Employee NI main rate'],
            ['key' => 'ni_employee_higher_rate',       'value' => '0.02', 'type' => 'number', 'description' => 'Employee NI upper rate'],
            ['key' => 'ni_employer_rate',              'value' => '0.138','type' => 'number', 'description' => 'Employer NI rate'],

            // Corporation tax
            ['key' => 'corporation_tax_rate',          'value' => '0.25', 'type' => 'number', 'description' => 'Corporation tax rate on weekly profit'],

            // Depreciation
            ['key' => 'asset_depreciation_years',      'value' => '33.3333', 'type' => 'number', 'description' => 'Straight-line depreciation years'],
            ['key' => 'turns_per_year',                'value' => '52',      'type' => 'number', 'description' => 'Game turns per year'],

            // Market
            ['key' => 'market_supply_per_player',      'value' => '0.4',  'type' => 'number', 'description' => 'Market supply multiplier per active player'],
            ['key' => 'market_supply_per_brewery',     'value' => '0.4',  'type' => 'number', 'description' => 'Market supply multiplier per active brewery'],
            ['key' => 'market_supply_per_pub',         'value' => '0.1',  'type' => 'number', 'description' => 'Market supply multiplier per active pub'],
            ['key' => 'market_minimum_supply',         'value' => '500',  'type' => 'number', 'description' => 'Floor for market supply'],
            ['key' => 'market_supply_restore_rate',    'value' => '100',  'type' => 'number', 'description' => 'Supply restored per purchase'],
            ['key' => 'rrp_markup',                    'value' => '1.5',  'type' => 'number', 'description' => 'RRP markup on wholesale price'],

            // Game
            ['key' => 'player_starting_balance',       'value' => '50000','type' => 'number', 'description' => 'Starting balance for new players'],
            ['key' => 'game_start_date',               'value' => '2026-04-06', 'type' => 'string', 'description' => 'Game week start date'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
