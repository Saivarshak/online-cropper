<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Create folders outside backend
$uploadDir = __DIR__ . "/../uploads/";
if (!file_exists($uploadDir)) mkdir($uploadDir, 0775, true);

if (!empty($_FILES["file"])) {
    $tmp = $_FILES["file"]["tmp_name"];
    $name = time() . "_" . basename($_FILES["file"]["name"]);
    $path = $uploadDir . $name;

    if (move_uploaded_file($tmp, $path)) {
        $url = "https://" . $_SERVER['HTTP_HOST'] . "/uploads/" . $name;
        echo json_encode([
            "success" => true,
            "filename" => $name,
            "url" => $url
        ]);
        exit;
    }
    echo json_encode(["error" => "Upload failed"]);
    exit;
}

echo json_encode(["error" => "No file uploaded"]);
?>
