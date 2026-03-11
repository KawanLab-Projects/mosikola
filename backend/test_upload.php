<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\UploadedFile;
use App\Models\IdCardTemplate;

$template = IdCardTemplate::first();
if (!$template) {
    echo "No template found!\n";
    exit;
}

echo "Testing on Template: " . $template->public_id . "\n";
echo "Before DB path: " . $template->background_path . "\n";

$file = UploadedFile::fake()->image('test-background.jpg');
$path = $file->store('id-card-templates', 's3');

echo "S3 Path: " . $path . "\n";

if ($path) {
    $template->background_path = $path;
    $template->save();
    
    // Refresh from DB
    $template->refresh();
    echo "After DB path: " . $template->background_path . "\n";
    echo "After DB auth url: " . $template->background_url . "\n";
} else {
    echo "Failed to store to S3\n";
}
