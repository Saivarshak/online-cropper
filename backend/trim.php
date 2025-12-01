<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$uploads = __DIR__ . "/../uploads/";
$outputDir = __DIR__ . "/../output/";

if (!file_exists($uploads)) mkdir($uploads, 0775, true);
if (!file_exists($outputDir)) mkdir($outputDir, 0775, true);

$filename = $_POST["filename"] ?? null;
$start = floatval($_POST["start"] ?? 0);
$end = floatval($_POST["end"] ?? 0);

if (!$filename) { echo json_encode(["error"=>"filename missing"]); exit; }

$inputPath = $uploads . $filename;
if (!file_exists($inputPath)) { echo json_encode(["error"=>"File not found"]); exit; }

$duration = $end - $start;
$outputName = time() . "_trimmed.mp4";
$outputPath = $outputDir . $outputName;

// Set ffmpeg path (change if using a binary)
$ffmpeg = __DIR__ . "/ffmpeg/ffmpeg";  

$cmd = "$ffmpeg -ss $start -i " . escapeshellarg($inputPath) . " -t $duration -c copy " . escapeshellarg($outputPath) . " 2>&1";
exec($cmd, $out, $ret);

if ($ret !== 0) {
    echo json_encode(["error"=>"Trimming failed","details"=>$out]);
    exit;
}

$url = "https://" . $_SERVER['HTTP_HOST'] . "/output/" . $outputName;

echo json_encode([
    "success" => true,
    "url" => $url
]);
?>
