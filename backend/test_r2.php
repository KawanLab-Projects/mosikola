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
    'http' => [ 'verify' => false, 'debug' => true ]
]);

try {
    $result = $client->putObject([
        'Bucket' => env('AWS_BUCKET'),
        'Key'    => 'test-raw-ping.txt',
        'Body'   => 'hello raw r2',
        // 'ACL'    => 'public-read', // Let's try without any ACL!
    ]);
    echo "SUCCESS: " . $result['ObjectURL'] . PHP_EOL;
} catch (\Aws\Exception\AwsException $e) {
    echo "AWS ERROR: " . $e->getAwsErrorMessage() . PHP_EOL;
    echo "STATUS CODE: " . $e->getStatusCode() . PHP_EOL;
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
}
