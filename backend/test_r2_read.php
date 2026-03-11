<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Aws\S3\S3Client;

$client = new S3Client([
    'region'      => 'auto',
    'version'     => 'latest',
    'endpoint'    => env('AWS_ENDPOINT'),
    'credentials' => [
        'key'    => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
    ],
    'use_path_style_endpoint' => true,
    'http' => [ 'verify' => false, 'debug' => false ]
]);

try {
    $result = $client->listObjectsV2([
        'Bucket' => env('AWS_BUCKET'),
        'MaxKeys' => 5
    ]);
    echo "SUCCESS (READ): found " . count($result['Contents'] ?? []) . " objects." . PHP_EOL;
} catch (\Aws\Exception\AwsException $e) {
    echo "AWS ERROR: " . $e->getAwsErrorMessage() . PHP_EOL;
    echo "CODE: " . $e->getAwsErrorCode() . PHP_EOL;
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
}
