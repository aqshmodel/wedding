<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\LikeController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\GuestRankingController;
use App\Http\Controllers\Api\UpdateCheckController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/media', [MediaController::class, 'index']);
Route::post('/media', [MediaController::class, 'store']);
Route::post('/media/chunk', [MediaController::class, 'uploadChunk']);
Route::get('/media/download-zip', [MediaController::class, 'downloadZip']);
Route::get('/media/latest-id', [UpdateCheckController::class, 'check']);
Route::post('/media/{id}/like', [LikeController::class, 'toggleLike']);
Route::delete('/media/{id}', [MediaController::class, 'destroy']);

Route::post('/comments', [\App\Http\Controllers\Api\CommentController::class, 'store']);
Route::post('/comments/{id}/like', [\App\Http\Controllers\Api\CommentController::class, 'toggleLike']);
Route::delete('/comments/{id}', [\App\Http\Controllers\Api\CommentController::class, 'destroy']);

Route::get('/settings', [SettingsController::class, 'index']);
Route::post('/settings', [SettingsController::class, 'store']);

Route::get('/admin/ranking', [AdminController::class, 'ranking']);
Route::get('/ranking/top', [GuestRankingController::class, 'top']);

