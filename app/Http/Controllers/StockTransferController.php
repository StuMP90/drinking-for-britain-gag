<?php

namespace App\Http\Controllers;

use App\Models\TurnAction;
use Illuminate\Http\Request;

class StockTransferController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'brewery_stock_id' => 'required|exists:stocks,id',
            'pub_id'           => 'required|exists:pubs,id',
            'quantity_litres'  => 'required|numeric|min:0.1',
        ]);

        TurnAction::create([
            'user_id' => auth()->id(),
            'type'    => 'transfer',
            'payload' => $request->only('brewery_stock_id', 'pub_id', 'quantity_litres'),
        ]);

        return back()->with('success', 'Stock transfer queued for next turn.');
    }
}
