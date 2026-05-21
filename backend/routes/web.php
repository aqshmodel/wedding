<?php
use Illuminate\Support\Facades\Route;

// /api 以外のすべてのアクセスに対して、Reactの index.html を表示させる
Route::get('/{any}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '.*');
