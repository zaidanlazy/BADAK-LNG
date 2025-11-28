<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FileController;

// API routes untuk file sharing
Route::prefix('file')->group(function () {
    // Upload single file
    Route::post('/upload', [FileController::class, 'upload'])->name('api.file.upload');

    // Upload multiple files (batch)
    Route::post('/upload-batch', [FileController::class, 'uploadBatch'])->name('api.file.upload-batch');

    // File info dan status
    Route::get('/{customLink}', [FileController::class, 'getFileInfo'])
        ->name('api.file.info')
        ->where('customLink', '[a-zA-Z0-9\-_]+');

    Route::get('/{customLink}/status', [FileController::class, 'checkStatus'])
        ->name('api.file.status')
        ->where('customLink', '[a-zA-Z0-9\-_]+');

    // Password validation
    Route::post('/{customLink}/validate-password', [FileController::class, 'validatePassword'])
        ->name('api.file.validate-password')
        ->where('customLink', '[a-zA-Z0-9\-_]+');

    // Download endpoints
    Route::get('/{customLink}/download', [FileController::class, 'download'])
        ->name('api.file.download')
        ->where('customLink', '[a-zA-Z0-9\-_]+');

    Route::post('/{customLink}/download', [FileController::class, 'download'])
        ->name('api.file.download.post')
        ->where('customLink', '[a-zA-Z0-9\-_]+');
});

// Admin API routes
Route::prefix('admin')->group(function () {
    Route::get('/stats', [FileController::class, 'getStats'])->name('api.admin.stats');
    Route::post('/cleanup-expired', [FileController::class, 'cleanupExpiredFiles'])->name('api.admin.cleanup');
});
