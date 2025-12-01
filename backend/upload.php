<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Create folders
$uploadDir = __DIR__ . "/uploads/";
if (!file_exists($uploadDir)) mkdir($uploadDir, 0775, true);

// If file uploaded from local device
if (!empty($_FILES["file"])) {
    $tmp = $_FILES["file"]["tmp_name"];
    $name = time() . "_" . basename($_FILES["file"]["name"]);
    $path = $uploadDir . $name;

    if (move_uploaded_file($tmp, $path)) {
        echo json_encode([
            "success" => true,
            "filename" => $name,
            "url" => "uploads/" . $name
        ]);
        exit;
    }
    echo json_encode(["error" => "Upload failed"]);
    exit;
}

// If URL upload
if (!empty($_POST["url"])) {
    $videoUrl = $_POST["url"];
    $name = time() . "_url.mp4";
    $path = $uploadDir . $name;

    file_put_contents($path, file_get_contents($videoUrl));

    echo json_encode([
        "success" => true,
        "filename" => $name,
        "url" => "uploads/" . $name
    ]);
    exit;
}

echo json_encode(["error" => "No input provided"]);
?>
