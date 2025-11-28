<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class File extends Model
{
    use HasFactory;

    protected $fillable = [
        'share_id',
        'original_name',
        'stored_name',
        'custom_link',
        'password',
        'expires_at',
        'one_time_view',
        'download_count',
        'size',
        'mime_type',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'one_time_view' => 'boolean',
    ];

    // Scope untuk file yang masih aktif
    public function scopeActive($query)
    {
        return $query->where('expires_at', '>', Carbon::now());
    }

    // Scope untuk file yang sudah expired
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', Carbon::now());
    }

    // Check if file is expired
    public function isExpired()
    {
        return Carbon::now()->greaterThan($this->expires_at);
    }

    // Check if file can be downloaded
    public function canBeDownloaded()
    {
        if ($this->isExpired()) {
            return false;
        }

        if ($this->one_time_view && $this->download_count > 0) {
            return false;
        }

        return true;
    }

    // Get formatted file size
    public function getFormattedSizeAttribute()
    {
        $bytes = $this->size;
        if ($bytes === 0) return '0 Bytes';

        $k = 1024;
        $sizes = ['Bytes', 'KB', 'MB', 'GB'];
        $i = floor(log($bytes) / log($k));

        return round($bytes / pow($k, $i), 2) . ' ' . $sizes[$i];
    }
}
