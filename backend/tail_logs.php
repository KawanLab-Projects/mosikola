<?php
$lines = file('storage/logs/laravel.log');
$errors = [];
$capture = false;
$current = '';

for ($i = count($lines) - 1; $i >= 0; $i--) {
    $line = $lines[$i];
    if (strpos($line, 'local.ERROR:') !== false) {
        $errors[] = $line . $current;
        $current = '';
        if (count($errors) >= 3) break;
    } else {
        // Only keep first few lines of trace to avoid massive output
        $current = $line . $current;
        if (strlen($current) > 1000) {
            $current = substr($current, 0, 1000) . "\n...truncated...";
        }
    }
}

foreach (array_reverse($errors) as $e) {
    echo "====================================\n";
    echo substr($e, 0, 1500) . "\n";
}
