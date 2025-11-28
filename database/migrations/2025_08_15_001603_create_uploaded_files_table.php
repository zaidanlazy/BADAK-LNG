<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('files', function (Blueprint $table) {
            $table->id();
            $table->string('share_id', 16)->index(); // ID untuk grup file yang sama
            $table->string('original_name');
            $table->string('stored_name')->unique();
            $table->string('custom_link', 50)->unique()->nullable();
            $table->string('password')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('one_time_view')->default(false);
            $table->integer('download_count')->default(0);
            $table->bigInteger('size'); // ukuran file dalam bytes
            $table->string('mime_type')->nullable();
            $table->timestamps();

            // Indexes untuk performa
            $table->index(['custom_link']);
            $table->index(['expires_at']);
            $table->index(['share_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('files');
    }
};
