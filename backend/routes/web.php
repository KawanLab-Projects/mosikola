<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;

Route::get('/', function () {
    return view('welcome');
});

// Intercept storage files to serve them with proper CORS headers
// This is critical for `php artisan serve` which ignores .htaccess
Route::get('/storage/{path}', function ($path) {
    // Basic verification
    $filePath = storage_path('app/public/' . $path);

    if (!File::exists($filePath)) {
        abort(404);
    }

    $file = File::get($filePath);
    $type = File::mimeType($filePath);

    $response = Response::make($file, 200);
    $response->header("Content-Type", $type);

    // Explicit CORS headers
    $response->header('Access-Control-Allow-Origin', '*');
    $response->header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    $response->header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With');

    return $response;
})->where('path', '.*');
