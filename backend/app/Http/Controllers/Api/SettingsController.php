<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;

class SettingsController extends Controller
{
    public function index()
    {
        // 全ての設定を key => value 形式で返す
        $settings = Setting::all()->pluck('value', 'key');
        
        // 初期値がない場合のフォールバック（デフォルトfalse）
        return response()->json([
            'opening_movie_visible' => $settings->get('opening_movie_visible', 'false') === 'true',
            'profile_movie_visible' => $settings->get('profile_movie_visible', 'false') === 'true',
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'opening_movie_visible' => 'required|boolean',
            'profile_movie_visible' => 'required|boolean',
        ]);

        Setting::updateOrCreate(
            ['key' => 'opening_movie_visible'],
            ['value' => $request->opening_movie_visible ? 'true' : 'false']
        );
        Setting::updateOrCreate(
            ['key' => 'profile_movie_visible'],
            ['value' => $request->profile_movie_visible ? 'true' : 'false']
        );

        return response()->json(['success' => true]);
    }
}
