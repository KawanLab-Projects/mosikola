<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$template = App\Models\IdCardTemplate::find(12);
echo "background_path: " . ($template->background_path ?? 'NULL') . "\n";
echo "back_background_path: " . ($template->back_background_path ?? 'NULL') . "\n";
echo "thumbnail_path: " . ($template->thumbnail_path ?? 'NULL') . "\n";

// Now simulate the controller update EXACTLY
use Illuminate\Http\Request;
$request = Request::create('/api/superadmin/id-card-templates/97c64c33-6ee7-4883-8262-177b8806c80c8/upload', 'POST', [
    'name' => 'Template Baru Updated'
]);

$controller = new \App\Http\Controllers\Superadmin\IdCardTemplateController();
$response = $controller->update($request, '97c64c33-6ee7-4883-8262-177b8806c80c8');

echo "Update Response: " . $response->getContent() . "\n";

$template->refresh();
echo "After Update name test: " . $template->name . "\n";
