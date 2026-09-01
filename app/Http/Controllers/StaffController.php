<?php

namespace App\Http\Controllers;

use App\Models\Staff;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'staffable_type' => 'required|in:pub,brewery',
            'staffable_id'   => 'required|integer',
            'name'           => 'required|string|max:100',
            'role'           => 'required|string|max:100',
            'weekly_wage'    => 'required|numeric|min:1',
        ]);

        $user    = auth()->user();
        $model   = $request->staffable_type === 'pub'
            ? $user->pubs()->findOrFail($request->staffable_id)
            : $user->breweries()->findOrFail($request->staffable_id);

        $staff = $model->staff()->create([
            'name'        => $request->name,
            'role'        => $request->role,
            'weekly_wage' => $request->weekly_wage,
            'satisfaction'=> 50,
        ]);

        return back()->with('success', "{$staff->name} hired.");
    }

    public function update(Request $request, Staff $staff)
    {
        $request->validate(['weekly_wage' => 'required|numeric|min:1']);

        $staff->update(['weekly_wage' => $request->weekly_wage]);

        return back()->with('success', 'Wage updated.');
    }

    public function destroy(Staff $staff)
    {
        $name = $staff->name;
        $staff->delete();

        return back()->with('success', "{$name} has been let go.");
    }
}
