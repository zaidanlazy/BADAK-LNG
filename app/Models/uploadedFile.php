<?php
// app/Models/UploadedFile.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class UploadedFile extends Model
{
    use HasFactory;

    protected $table = 'uploaded_files';

    protected $fillable = [
        'file_id',
        'original_name',
        'sanitized_name',
        'file_path',
        'file_size',
        'mime_type',
        'password',
        'is_password_protected',
        'expires_at',
        'is_one_time_view',
        'max_views',
        'view_count',
        'download_count',
        'upload_ip',
        'user_agent',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_password_protected' => 'boolean',
        'is_one_time_view' => 'boolean',
        'view_count' => 'integer',
        'download_count' => 'integer',
        'max_views' => 'integer',
        'file_size' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $hidden = [
        'password',
        'upload_ip',
        'user_agent',
    ];

    // Scopes
    public function scopeActive($query)
    {
        return $query->where(function($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        });
    }

    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<', now());
    }

    public function scopePasswordProtected($query)
    {
        return $query->where('is_password_protected', true);
    }

    public function scopeOneTimeView($query)
    {
        return $query->where('is_one_time_view', true);
    }

    public function scopeAvailable($query)
    {
        return $query->active()
                    ->where(function($q) {
                        $q->where('is_one_time_view', false)
                          ->orWhere(function($subQ) {
                              $subQ->where('is_one_time_view', true)
                                   ->whereRaw('view_count < COALESCE(max_views, 1)');
                          });
                    });
    }

    // Accessors
    public function getFormattedFileSizeAttribute()
    {
        return $this->formatBytes($this->file_size);
    }

    public function getIsExpiredAttribute()
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function getIsAvailableAttribute()
    {
        if ($this->is_expired) {
            return false;
        }

        if ($this->is_one_time_view && $this->view_count >= ($this->max_views ?? 1)) {
            return false;
        }

        return true;
    }

    public function getTimeRemainingAttribute()
    {
        if (!$this->expires_at) {
            return null;
        }

        if ($this->expires_at->isPast()) {
            return 'Kedaluwarsa';
        }

        $diff = now()->diff($this->expires_at);

        if ($diff->days > 0) {
            return $diff->days . ' hari ' . $diff->h . ' jam tersisa';
        } elseif ($diff->h > 0) {
            return $diff->h . ' jam ' . $diff->i . ' menit tersisa';
        } elseif ($diff->i > 0) {
            return $diff->i . ' menit tersisa';
        } else {
            return 'Kurang dari 1 menit tersisa';
        }
    }

    public function getPublicUrlAttribute()
    {
        return url('/file/' . $this->file_id);
    }

    public function getDownloadUrlAttribute()
    {
        return url('/download/' . $this->file_id);
    }

    // Helper methods
    public function canBeAccessed()
    {
        return $this->is_available;
    }

    public function hasValidPassword($password)
    {
        if (!$this->is_password_protected) {
            return true;
        }



        return password_verify($password, $this->password);
    }

    public function incrementViews()
    {
        $this->increment('view_count');
    }

    public function incrementDownloads()
    {
        $this->increment('download_count');
    }

    private function formatBytes($size, $precision = 2)
    {
        if ($size <= 0) return '0 B';

        $units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        $factor = floor(log($size, 1024));
        $factor = min($factor, count($units) - 1);

        $formattedSize = round($size / pow(1024, $factor), $precision);

        return $formattedSize . ' ' . $units[$factor];
    }

    // Events
    protected static function booted()
    {
        static::deleting(function ($file) {
            // Cleanup physical file when model is deleted
            if (\Storage::disk('public')->exists($file->file_path)) {
                \Storage::disk('public')->delete($file->file_path);
            }
        });
    }
}
