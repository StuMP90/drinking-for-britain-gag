<?php

namespace Database\Seeders;

use App\Models\MarketListing;
use Illuminate\Database\Seeder;

class MarketListingsSeeder extends Seeder
{
    public function run(): void
    {
        // Ingredients (no ABV, used for brewing)
        $ingredients = [
            ['name' => 'Pale Malt',       'base_price' => 0.80,  'supply' => 5000, 'demand' => 5000],
            ['name' => 'Crystal Malt',    'base_price' => 1.20,  'supply' => 3000, 'demand' => 3000],
            ['name' => 'Roasted Barley',  'base_price' => 1.10,  'supply' => 3000, 'demand' => 3000],
            ['name' => 'Wheat Malt',      'base_price' => 0.90,  'supply' => 3000, 'demand' => 3000],
            ['name' => 'Bitter Hops',     'base_price' => 6.00,  'supply' => 2000, 'demand' => 2000],
            ['name' => 'Aromatic Hops',   'base_price' => 8.00,  'supply' => 1500, 'demand' => 1500],
            ['name' => 'Ale Yeast',       'base_price' => 4.00,  'supply' => 2000, 'demand' => 2000],
            ['name' => 'Lager Yeast',     'base_price' => 5.00,  'supply' => 1500, 'demand' => 1500],
            ['name' => 'Cider Apples',    'base_price' => 0.60,  'supply' => 4000, 'demand' => 4000],
            ['name' => 'Red Grapes',      'base_price' => 1.50,  'supply' => 3000, 'demand' => 3000],
            ['name' => 'White Grapes',    'base_price' => 1.40,  'supply' => 3000, 'demand' => 3000],
            ['name' => 'Wine Yeast',      'base_price' => 6.00,  'supply' => 1500, 'demand' => 1500],
            ['name' => 'Distilling Malt', 'base_price' => 0.90,  'supply' => 2000, 'demand' => 2000],
            ['name' => 'Distiller\'s Yeast','base_price'=> 7.00, 'supply' => 1500, 'demand' => 1500],
            ['name' => 'Sugar Syrup',     'base_price' => 0.40,  'supply' => 4000, 'demand' => 4000],
            ['name' => 'Carbonated Water','base_price' => 0.20,  'supply' => 4000, 'demand' => 4000],
        ];

        foreach ($ingredients as $data) {
            MarketListing::updateOrCreate(
                ['name' => $data['name'], 'type' => 'ingredient'],
                array_merge($data, [
                    'type'        => 'ingredient',
                    'abv'         => 0,
                    'price'       => $data['base_price'],
                    'base_supply' => $data['supply'],
                    'recipe'      => null,
                    'is_active'   => true,
                ])
            );
        }

        // Products (finished goods sold in pubs)
        // Recipe format: ['ingredient_name' => kg_per_litre]
        $products = [
            [
                'name'       => 'Session Bitter',
                'abv'        => 3.8,
                'base_price' => 1.20,
                'supply'     => 2000,
                'demand'     => 2000,
                'recipe'     => ['Pale Malt' => 0.18, 'Bitter Hops' => 0.04, 'Ale Yeast' => 0.008],
            ],
            [
                'name'       => 'House Lager',
                'abv'        => 3.4,
                'base_price' => 2.50,
                'supply'     => 1200,
                'demand'     => 1200,
                'recipe'     => ['Wheat Malt' => 0.35, 'Aromatic Hops' => 0.04, 'Lager Yeast' => 0.01],
            ],
            [
                'name'       => 'House Cider',
                'abv'        => 3.4,
                'base_price' => 2.50,
                'supply'     => 1200,
                'demand'     => 1200,
                'recipe'     => ['Cider Apples' => 0.70, 'Ale Yeast' => 0.01],
            ],
            [
                'name'       => 'Best Bitter',
                'abv'        => 4.3,
                'base_price' => 1.40,
                'supply'     => 2000,
                'demand'     => 2000,
                'recipe'     => ['Pale Malt' => 0.20, 'Crystal Malt' => 0.02, 'Bitter Hops' => 0.05, 'Ale Yeast' => 0.01],
            ],
            [
                'name'       => 'Premium Lager',
                'abv'        => 5.0,
                'base_price' => 1.60,
                'supply'     => 2000,
                'demand'     => 2000,
                'recipe'     => ['Wheat Malt' => 0.20, 'Aromatic Hops' => 0.03, 'Lager Yeast' => 0.01],
            ],
            [
                'name'       => 'Stout',
                'abv'        => 4.2,
                'base_price' => 1.50,
                'supply'     => 1500,
                'demand'     => 1500,
                'recipe'     => ['Pale Malt' => 0.15, 'Roasted Barley' => 0.08, 'Bitter Hops' => 0.04, 'Ale Yeast' => 0.01],
            ],
            [
                'name'       => 'Dry Cider',
                'abv'        => 4.5,
                'base_price' => 1.10,
                'supply'     => 1500,
                'demand'     => 1500,
                'recipe'     => ['Cider Apples' => 1.20, 'Ale Yeast' => 0.005],
            ],
            [
                'name'       => 'House Wine (Red)',
                'abv'        => 13.0,
                'base_price' => 3.50,
                'supply'     => 1000,
                'demand'     => 1000,
                'recipe'     => ['Red Grapes' => 1.20, 'Wine Yeast' => 0.01],
            ],
            [
                'name'       => 'House Wine (White)',
                'abv'        => 12.0,
                'base_price' => 3.50,
                'supply'     => 1000,
                'demand'     => 1000,
                'recipe'     => ['White Grapes' => 1.20, 'Wine Yeast' => 0.01],
            ],
            [
                'name'       => 'House Spirits',
                'abv'        => 40.0,
                'base_price' => 8.00,
                'supply'     => 800,
                'demand'     => 800,
                'recipe'     => ['Distilling Malt' => 0.50, 'Distiller\'s Yeast' => 0.02],
            ],
            [
                'name'       => 'Soft Drinks',
                'abv'        => 0.0,
                'base_price' => 0.80,
                'supply'     => 3000,
                'demand'     => 3000,
                'recipe'     => ['Sugar Syrup' => 0.10, 'Carbonated Water' => 0.90],
            ],
        ];

        foreach ($products as $data) {
            $recipe = $data['recipe'];
            unset($data['recipe']);

            MarketListing::updateOrCreate(
                ['name' => $data['name'], 'type' => 'product'],
                array_merge($data, [
                    'type'        => 'product',
                    'price'       => $data['base_price'],
                    'base_supply' => $data['supply'],
                    'recipe'      => $recipe,
                    'is_active'   => true,
                ])
            );
        }
    }
}
