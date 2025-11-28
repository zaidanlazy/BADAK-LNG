<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FileController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => 'Laravel File Sharing',
        'version' => '1.0.0',
        'timestamp' => now()->toISOString(),
    ]);
});

// API routes are now in routes/api.php

// Public download page - untuk user yang klik link
Route::get('/download/{customLink}', function ($customLink) {
    // Di development, redirect ke React app dengan parameter
    if (app()->environment('local')) {
        return redirect("http://localhost:3000/download/{$customLink}");
    }

    // Di production, serve React app
    if (file_exists(public_path('index.html'))) {
        return file_get_contents(public_path('index.html'));
    }

    return response()->json([
        'error' => 'Frontend not found',
        'custom_link' => $customLink,
        'api_endpoint' => url("/api/file/{$customLink}")
    ], 404);
})->name('download.page')->where('customLink', '[a-zA-Z0-9\-_]+');

// Admin routes
Route::prefix('admin')->group(function () {
    Route::get('/', function () {
        if (app()->environment('local')) {
            return redirect('http://localhost:3000/admin');
        }
        return file_exists(public_path('index.html'))
            ? file_get_contents(public_path('index.html'))
            : response()->json(['error' => 'Admin panel not found'], 404);
    })->name('admin.dashboard');

    Route::get('/stats', function () {
        if (app()->environment('local')) {
            return redirect('http://localhost:3000/admin/stats');
        }
        return file_exists(public_path('index.html'))
            ? file_get_contents(public_path('index.html'))
            : response()->json(['error' => 'Admin stats not found'], 404);
    })->name('admin.stats.page');
});

// Fallback untuk React SPA - harus paling terakhir
Route::get('/{any}', function () {
    // Development: redirect ke React dev server
    if (app()->environment('local')) {
        return redirect('http://localhost:3000' . request()->getPathInfo());
    }

    // Production: serve built React app
    if (file_exists(public_path('index.html'))) {
        return file_get_contents(public_path('index.html'));
    }

    // Fallback error
    return response()->json([
        'error' => 'React app not found',
        'message' => 'Please run "npm run build" to build the React frontend',
        'requested_path' => request()->getPathInfo()
    ], 404);
})->where('any', '.*')->name('spa.fallback');
