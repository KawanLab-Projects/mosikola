<?php

namespace App\Jobs;

use App\Models\Student;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use ZipArchive;

class ProcessIdCardZip implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 0;   // no timeout — job can run as long as needed
    public int $tries   = 1;   // don't retry on failure — results would duplicate

    private const CACHE_TTL    = 1800; // 30 minutes
    private const CACHE_PREFIX = 'zip_job:';

    public function __construct(
        private readonly string $jobId,
        private readonly int    $tenantId,
        private readonly string $zipLocalPath  // path on local disk (Storage::disk('local'))
    ) {}

    public function handle(): void
    {
        ini_set('memory_limit', '512M');

        $cacheKey = self::CACHE_PREFIX . $this->jobId;

        try {
            // ── 1. Open ZIP ──────────────────────────────────────────────────
            $absolutePath = Storage::disk('local')->path($this->zipLocalPath);

            if (!file_exists($absolutePath)) {
                $this->markFailed($cacheKey, 'File ZIP tidak ditemukan di server.');
                return;
            }

            $zip = new ZipArchive();
            if ($zip->open($absolutePath) !== true) {
                $this->markFailed($cacheKey, 'Gagal membuka file ZIP. Pastikan file tidak rusak.');
                return;
            }

            // ── 2. Extract to temporary directory ────────────────────────────
            $tmpDir      = 'temp_zips/' . $this->jobId;
            $extractPath = Storage::disk('local')->path($tmpDir);
            Storage::disk('local')->makeDirectory($tmpDir);
            $zip->extractTo($extractPath);
            $zip->close();

            // ── 3. Scan & count image files ───────────────────────────────────
            $allFiles   = collect(File::allFiles($extractPath))
                ->filter(fn($f) => in_array(strtolower($f->getExtension()), ['jpg', 'jpeg', 'png']))
                ->values();
            $total      = $allFiles->count();

            if ($total === 0) {
                Storage::disk('local')->deleteDirectory($tmpDir);
                $this->markFailed($cacheKey, 'ZIP tidak mengandung file foto (.jpg/.jpeg/.png).');
                return;
            }

            // ── 4. Update cache: processing started ───────────────────────────
            Cache::put($cacheKey, [
                'status'  => 'processing',
                'current' => 0,
                'total'   => $total,
            ], self::CACHE_TTL);

            // ── 5. Process each photo ─────────────────────────────────────────
            $valid   = [];
            $invalid = [];

            foreach ($allFiles as $index => $f) {
                $filename = $f->getFilename();
                $nisn     = pathinfo($filename, PATHINFO_FILENAME);
                $ext      = strtolower($f->getExtension());

                $student = Student::where('tenant_id', $this->tenantId)
                    ->where('nisn', $nisn)
                    ->first();

                if ($student) {
                    $newPath = 'student_photos/' . $this->tenantId . '/' . Str::random(15) . '.' . $ext;
                    Storage::disk('s3')->put($newPath, file_get_contents($f->getPathname()));

                    $valid[] = [
                        'student'   => $student,
                        'photo_url' => Storage::disk('s3')->url($newPath),
                        'photo_path'=> $newPath,
                    ];
                } else {
                    $invalid[] = $filename;
                }

                // Update progress after each file
                Cache::put($cacheKey, [
                    'status'  => 'processing',
                    'current' => $index + 1,
                    'total'   => $total,
                ], self::CACHE_TTL);
            }

            // ── 6. Cleanup & store final result ───────────────────────────────
            Storage::disk('local')->deleteDirectory($tmpDir);
            Storage::disk('local')->delete($this->zipLocalPath);

            Cache::put($cacheKey, [
                'status' => 'done',
                'result' => compact('valid', 'invalid'),
            ], self::CACHE_TTL);

        } catch (\Throwable $e) {
            $this->markFailed($cacheKey, 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    public function failed(\Throwable $e): void
    {
        Cache::put(
            self::CACHE_PREFIX . $this->jobId,
            ['status' => 'failed', 'message' => $e->getMessage()],
            self::CACHE_TTL
        );
    }

    private function markFailed(string $cacheKey, string $message): void
    {
        Cache::put($cacheKey, ['status' => 'failed', 'message' => $message], self::CACHE_TTL);
    }
}
