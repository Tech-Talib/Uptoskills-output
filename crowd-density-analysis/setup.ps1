$folders = @(
"models",
"input",
"input\videos",
"input\images",
"output",
"output\videos",
"output\screenshots",
"output\reports",
"detection",
"zones",
"analytics",
"alerts",
"database",
"dashboard",
"utils",
"logs",
"tests",
"assets",
"assets\icons",
"assets\screenshots"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
}

$files = @(
"README.md",
"requirements.txt",
"app.py",
"config.py",

"models\classes.txt",

"detection\__init__.py",
"detection\detector.py",
"detection\tracker.py",
"detection\inference.py",

"zones\__init__.py",
"zones\roi.py",
"zones\zone_counter.py",
"zones\zone_config.py",

"analytics\__init__.py",
"analytics\density.py",
"analytics\statistics.py",
"analytics\heatmap.py",
"analytics\graph.py",

"alerts\__init__.py",
"alerts\alert.py",
"alerts\notification.py",
"alerts\threshold.py",

"database\crowd.db",
"database\database.py",
"database\logger.py",

"dashboard\dashboard.py",
"dashboard\charts.py",
"dashboard\widgets.py",

"utils\__init__.py",
"utils\drawing.py",
"utils\colors.py",
"utils\fps.py",
"utils\timer.py",
"utils\helper.py",

"logs\events.csv",
"logs\alerts.csv",
"logs\system.log",

"tests\test_detection.py",
"tests\test_tracking.py",
"tests\test_density.py",
"tests\test_database.py"
)

foreach ($file in $files) {
    New-Item -ItemType File -Force -Path $file | Out-Null
}

Write-Host ""
Write-Host "========================================"
Write-Host " CrowdDensityAI Project Created!"
Write-Host "========================================"