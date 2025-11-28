<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\File;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use ZipArchive;

class FileController extends Controller
{
    private int $cacheDuration = 300; // menyimpan selama 5 menit

    // === UPLOAD SINGLE FILE (Keep for backward compatibility) ===
    public function upload(Request $request)
    {
        try {
            $request->validate([
                'file' => 'required|file|max:51200', // 50 mb max size
            ]);

            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $storedName = Str::random(20) . '.' . $extension;

            // upload file ke storage user
            $file->storeAs('uploads', $storedName, 'public');

            // Generate custom link random atau dari user
            $customLink = $request->input('custom_link') ?: Str::random(8);

            // Check if custom link already exists
            if (File::where('custom_link', $customLink)->exists()) {
                $customLink = Str::random(8);
            }

            // Handle password - only hash if provided
            $password = null;
            if ($request->filled('password')) {
                $password = bcrypt($request->input('password'));
            }

            // Handle expiration date - only set if provided
            $expiresAt = null;
            if ($request->filled('expired_date')) {
                $expiresAt = Carbon::parse($request->input('expired_date'));
            } else {
                // Default to 1 year if no expiration set
                $expiresAt = Carbon::now()->addYear();
            }

            $fileRecord = File::create([
                'original_name' => $originalName,
                'stored_name'   => $storedName,
                'custom_link'   => $customLink,
                'password'      => $password,
                'expires_at'    => $expiresAt,
                'one_time_view' => $request->boolean('one_time_view'),
                'download_count'=> 0,
                'size'          => $file->getSize(),
                'mime_type'     => $file->getClientMimeType(),
            ]);

            $this->clearFileCache($customLink);

            return response()->json([
                'message' => 'File uploaded successfully',
                'share_link' => url('/download/' . $customLink),
                'download_url' => url('/api/file/' . $customLink . '/download'),
                'file_id' => $fileRecord->id,
                'custom_link' => $customLink,
                'original_name' => $originalName,
                'size' => $file->getSize()
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            \Log::error('Upload failed', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Upload failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // === UPLOAD BATCH FILES (NEW) ===
    public function uploadBatch(Request $request)
    {
        try {
            $request->validate([
                'files' => 'required|array|min:1',
                'files.*' => 'required|file|max:51200', // 50 mb max size per file
            ]);

            // Generate custom link (same for all files in batch)
            $customLink = $request->input('custom_link') ?: Str::random(8);

            // Check if custom link already exists
            if (File::where('custom_link', $customLink)->exists()) {
                $customLink = Str::random(8);
            }

            // Handle password - only hash if provided
            $password = null;
            if ($request->filled('password')) {
                $password = bcrypt($request->input('password'));
            }

            // Handle expiration date
            $expiresAt = null;
            if ($request->filled('expired_date')) {
                $expiresAt = Carbon::parse($request->input('expired_date'));
            } else {
                // Default to 1 year if no expiration set
                $expiresAt = Carbon::now()->addYear();
            }

            $oneTimeView = $request->boolean('one_time_view');
            $uploadedFiles = [];
            $totalSize = 0;

            // Upload all files with the same custom_link
            foreach ($request->file('files') as $file) {
                $originalName = $file->getClientOriginalName();
                $extension = $file->getClientOriginalExtension();
                $storedName = Str::random(20) . '.' . $extension;

                // Upload file to storage
                $file->storeAs('uploads', $storedName, 'public');

                $fileRecord = File::create([
                    'original_name' => $originalName,
                    'stored_name'   => $storedName,
                    'custom_link'   => $customLink,
                    'password'      => $password,
                    'expires_at'    => $expiresAt,
                    'one_time_view' => $oneTimeView,
                    'download_count'=> 0,
                    'size'          => $file->getSize(),
                    'mime_type'     => $file->getClientMimeType(),
                ]);

                $uploadedFiles[] = [
                    'id' => $fileRecord->id,
                    'original_name' => $originalName,
                    'size' => $file->getSize()
                ];

                $totalSize += $file->getSize();
            }

            $this->clearFileCache($customLink);

            return response()->json([
                'message' => 'Files uploaded successfully',
                'share_link' => url('/download/' . $customLink),
                'download_url' => url('/api/file/' . $customLink . '/download'),
                'custom_link' => $customLink,
                'files' => $uploadedFiles,
                'total_files' => count($uploadedFiles),
                'total_size' => $totalSize
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            \Log::error('Batch upload failed', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Batch upload failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // === FILE INFO (UPDATED to support multiple files) ===
    public function getFileInfo($customLink)
    {
        try {
            $cacheKey = "file_info_{$customLink}";

            if ($cached = Cache::get($cacheKey)) {
                return response()->json($cached);
            }

            // Get all files with the same custom_link
            $files = File::select([
                'id', 'original_name', 'stored_name', 'size', 'password',
                'expires_at', 'download_count', 'one_time_view', 'created_at', 'mime_type'
            ])->where('custom_link', $customLink)->get();

            if ($files->isEmpty()) {
                return response()->json(['message' => 'File tidak ditemukan'], 404);
            }

            // Get first file for common properties
            $firstFile = $files->first();
            $now = Carbon::now();

            if ($firstFile->expires_at && $now->greaterThan($firstFile->expires_at)) {
                return response()->json(['message' => 'Link sudah expired'], 410);
            }

            if ($firstFile->one_time_view && $firstFile->download_count > 0) {
                return response()->json(['message' => 'File ini sudah pernah diunduh'], 410);
            }

            $responseData = [
                'customLink' => $customLink,
                'hasPassword' => !is_null($firstFile->password),
                'expiresAt' => $firstFile->expires_at,
                'downloadCount' => $firstFile->download_count,
                'oneTimeView' => $firstFile->one_time_view,
                'createdAt' => $firstFile->created_at,
                'timeRemaining' => $firstFile->expires_at
                    ? max($firstFile->expires_at->diffInSeconds($now), 0) * 1000
                    : null,
                // Add files array
                'files' => $files->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'original_name' => $file->original_name,
                        'size' => $file->size,
                        'mime_type' => $file->mime_type
                    ];
                })->toArray(),
                'totalFiles' => $files->count(),
                'totalSize' => $files->sum('size')
            ];

            // For backward compatibility, add single file data if only 1 file
            if ($files->count() === 1) {
                $responseData['originalName'] = $firstFile->original_name;
                $responseData['size'] = $firstFile->size;
            }

            $cacheTime = ($firstFile->one_time_view || ($firstFile->expires_at && $firstFile->expires_at->diffInMinutes($now) < 30))
                ? 60 : $this->cacheDuration;

            Cache::put($cacheKey, $responseData, $cacheTime);

            return response()->json($responseData);

        } catch (\Throwable $e) {
            \Log::error('Get file info failed', [
                'custom_link' => $customLink,
                'error' => $e->getMessage()
            ]);
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    // === VALIDATE PASSWORD ===
    public function validatePassword(Request $request, $customLink)
    {
        try {
            $cacheKey = "file_password_{$customLink}";
            $passwordHash = Cache::get($cacheKey);

            if (!$passwordHash) {
                $file = File::select(['password'])
                    ->where('custom_link', $customLink)
                    ->first();

                if (!$file) {
                    return response()->json(['message' => 'File tidak ditemukan'], 404);
                }

                $passwordHash = $file->password;
                Cache::put($cacheKey, $passwordHash, 600);
            }

            if (!$passwordHash) {
                return response()->json(['valid' => true]);
            }

            if (!$request->filled('password')) {
                return response()->json(['valid' => false, 'message' => 'Password required'], 401);
            }

            $isValid = password_verify($request->input('password'), $passwordHash);

            return response()->json(['valid' => $isValid]);

        } catch (\Throwable $e) {
            \Log::error('Password validation failed', [
                'custom_link' => $customLink,
                'error' => $e->getMessage()
            ]);
            return response()->json(['valid' => false, 'message' => 'Server error'], 500);
        }
    }

    // === DOWNLOAD FILE (UPDATED to support multiple files as ZIP) ===
    public function download(Request $request, $customLink)
    {
        try {
            $files = DB::transaction(function () use ($customLink, $request) {
                $files = File::lockForUpdate()
                    ->where('custom_link', $customLink)
                    ->get();

                if ($files->isEmpty()) {
                    throw new \Exception('File tidak ditemukan', 404);
                }

                $firstFile = $files->first();
                $now = Carbon::now();

                if ($firstFile->expires_at && $now->greaterThan($firstFile->expires_at)) {
                    throw new \Exception('Link sudah expired', 410);
                }

                if ($firstFile->one_time_view && $firstFile->download_count > 0) {
                    throw new \Exception('File ini hanya bisa diunduh sekali', 410);
                }

                if ($firstFile->password) {
                    if (!$request->filled('password') || !password_verify($request->input('password'), $firstFile->password)) {
                        throw new \Exception('Password salah', 401);
                    }
                }

                // Increment download count for all files
                File::where('custom_link', $customLink)->increment('download_count');

                return $files;
            });

            $this->clearFileCache($customLink);

            // If single file, download directly
            if ($files->count() === 1) {
                $file = $files->first();
                $filePath = 'uploads/' . $file->stored_name;

                if (!Storage::disk('public')->exists($filePath)) {
                    return response()->json(['message' => 'File sudah dihapus'], 404);
                }

                return Storage::disk('public')->download($filePath, $file->original_name);
            }

            // If multiple files, create ZIP
            return $this->downloadAsZip($files, $customLink);

        } catch (\Exception $e) {
            \Log::error('Download failed', [
                'custom_link' => $customLink,
                'error' => $e->getMessage()
            ]);
            return response()->json(['message' => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    // === HELPER: Download multiple files as ZIP ===
    private function downloadAsZip($files, $customLink)
    {
        try {
            // Create temp directory if not exists
            $tempDir = storage_path('app/public/temp');
            if (!file_exists($tempDir)) {
                mkdir($tempDir, 0755, true);
            }

            $zipFileName = 'files_' . $customLink . '_' . time() . '.zip';
            $zipPath = $tempDir . '/' . $zipFileName;

            $zip = new ZipArchive();
            if ($zip->open($zipPath, ZipArchive::CREATE) !== TRUE) {
                throw new \Exception('Tidak dapat membuat file ZIP');
            }

            $addedFiles = 0;
            foreach ($files as $file) {
                $filePath = storage_path('app/public/uploads/' . $file->stored_name);

                if (file_exists($filePath)) {
                    // Handle duplicate filenames by adding number
                    $originalName = $file->original_name;
                    $counter = 1;
                    while ($zip->locateName($originalName) !== false) {
                        $pathInfo = pathinfo($file->original_name);
                        $originalName = $pathInfo['filename'] . '_' . $counter . '.' . $pathInfo['extension'];
                        $counter++;
                    }

                    $zip->addFile($filePath, $originalName);
                    $addedFiles++;
                } else {
                    \Log::warning("File not found for ZIP: {$file->stored_name}");
                }
            }

            $zip->close();

            if ($addedFiles === 0) {
                if (file_exists($zipPath)) {
                    unlink($zipPath);
                }
                throw new \Exception('Tidak ada file yang dapat didownload');
            }

            // Return download response and delete temp file after send
            return response()->download($zipPath, $zipFileName)->deleteFileAfterSend(true);

        } catch (\Throwable $e) {
            \Log::error('ZIP creation failed', [
                'custom_link' => $customLink,
                'error' => $e->getMessage()
            ]);
            throw new \Exception('Gagal membuat file ZIP: ' . $e->getMessage());
        }
    }

    // === CHECK STATUS ===
    public function checkStatus($customLink)
    {
        try {
            $cacheKey = "file_status_{$customLink}";
            if ($cached = Cache::get($cacheKey)) {
                return response()->json($cached);
            }

            $file = File::select(['expires_at', 'one_time_view', 'download_count'])
                ->where('custom_link', $customLink)
                ->first();

            if (!$file) {
                $status = ['status' => 'not_found'];
                Cache::put($cacheKey, $status, 300);
                return response()->json($status, 404);
            }

            $now = Carbon::now();

            if ($file->expires_at && $now->greaterThan($file->expires_at)) {
                $status = ['status' => 'expired'];
                Cache::put($cacheKey, $status, 3600);
                return response()->json($status, 410);
            }

            if ($file->one_time_view && $file->download_count > 0) {
                $status = ['status' => 'used'];
                Cache::put($cacheKey, $status, 3600);
                return response()->json($status, 410);
            }

            $status = ['status' => 'available'];
            Cache::put($cacheKey, $status, 60);
            return response()->json($status);

        } catch (\Throwable $e) {
            \Log::error('Status check failed', [
                'custom_link' => $customLink,
                'error' => $e->getMessage()
            ]);
            return response()->json(['status' => 'error'], 500);
        }
    }

    // === GET STATS ===
    public function getStats()
    {
        try {
            return Cache::remember('file_stats', 300, function () {
                $now = Carbon::now();

                $stats = DB::selectOne('
                    SELECT
                        COUNT(*) as total_files,
                        SUM(download_count) as total_downloads,
                        SUM(CASE WHEN expires_at < ? THEN 1 ELSE 0 END) as expired_files,
                        SUM(CASE WHEN expires_at > ? THEN 1 ELSE 0 END) as active_files,
                        SUM(size) as total_size
                    FROM files
                ', [$now, $now]);

                return [
                    'total_files' => $stats->total_files ?? 0,
                    'total_downloads' => $stats->total_downloads ?? 0,
                    'expired_files' => $stats->expired_files ?? 0,
                    'active_files' => $stats->active_files ?? 0,
                    'total_size' => $stats->total_size ?? 0,
                ];
            });

        } catch (\Throwable $e) {
            \Log::error('Get stats failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    // === CLEANUP EXPIRED FILES ===
    public function cleanupExpiredFiles()
    {
        try {
            $expiredFiles = File::where('expires_at', '<', Carbon::now())
                ->select(['id', 'stored_name', 'custom_link'])
                ->get();

            $deletedCount = 0;
            $errors = [];

            foreach ($expiredFiles as $file) {
                try {
                    $filePath = 'uploads/' . $file->stored_name;
                    if (Storage::disk('public')->exists($filePath)) {
                        Storage::disk('public')->delete($filePath);
                    }
                    $file->delete();
                    $this->clearFileCache($file->custom_link);
                    $deletedCount++;
                } catch (\Throwable $e) {
                    $errors[] = "Failed to delete file {$file->id}: " . $e->getMessage();
                }
            }

            Cache::forget('file_stats');

            return response()->json([
                'message' => "Cleaned up $deletedCount expired files",
                'deleted_count' => $deletedCount,
                'errors' => $errors
            ]);

        } catch (\Throwable $e) {
            \Log::error('Cleanup failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Cleanup failed'], 500);
        }
    }

    // === CLEAR CACHE ===
    private function clearFileCache($customLink): void
    {
        Cache::forget("file_info_{$customLink}");
        Cache::forget("file_status_{$customLink}");
        Cache::forget("file_password_{$customLink}");
        Cache::forget('file_stats');
    }
}
