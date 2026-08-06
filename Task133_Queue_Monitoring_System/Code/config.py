"""
config.py — Central configuration for Queue Monitoring System
Change paths here once, everything else uses them automatically.
"""

import os

# ── Base project directory (auto-detects where this file lives) ──────
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# ── Input ─────────────────────────────────────────────────────────────
INPUT_VIDEOS_DIR  = os.path.join(BASE_DIR, "Input_Videos")
VIDEO_1_PATH      = os.path.join(INPUT_VIDEOS_DIR, "sample.mp4")
VIDEO_2_PATH      = os.path.join(INPUT_VIDEOS_DIR, "queue_long.mp4")

# ── Models ────────────────────────────────────────────────────────────
MODELS_DIR        = os.path.join(BASE_DIR, "Models")
PRETRAINED_MODEL  = os.path.join(MODELS_DIR, "yolov8n.pt")      # downloaded automatically
TRAINED_MODEL     = os.path.join(MODELS_DIR, "best.pt")          # after training

# ── Datasets ──────────────────────────────────────────────────────────
DATASETS_DIR      = os.path.join(BASE_DIR, "Datasets")

# ── Outputs ───────────────────────────────────────────────────────────
OUTPUTS_DIR             = os.path.join(BASE_DIR, "Outputs")
OUTPUT_VIDEOS_DIR       = os.path.join(OUTPUTS_DIR, "output_videos")
SNAPSHOTS_DIR           = os.path.join(OUTPUTS_DIR, "snapshots")
CSV_REPORTS_DIR         = os.path.join(OUTPUTS_DIR, "csv_reports")
VIOLATION_SNAPSHOTS_DIR = os.path.join(OUTPUTS_DIR, "violation_snapshots")

# ── Detection Settings ────────────────────────────────────────────────
CONFIDENCE_THRESHOLD    = 0.25   # YOLO detection confidence
PERSON_CLASS_ID         = 0      # COCO class 0 = person

# ── Queue ROI (Region of Interest) ───────────────────────────────────
# These are pixel coordinates of the queue area in your video
# Change these based on your video - run visualize_roi.py to find them
ROI_X1, ROI_Y1 = 650, 350
ROI_X2, ROI_Y2 = 1550, 1080

# ── Alert Thresholds ──────────────────────────────────────────────────
OVERCROWDING_THRESHOLD  = 5     # people count above this = overcrowded
MOVEMENT_THRESHOLD      = 8     # pixels moved per frame to count as "moving"
STALLED_SECONDS         = 2.0   # seconds of no movement = stalled queue

# ── Training Settings ─────────────────────────────────────────────────
TRAIN_EPOCHS  = 50
TRAIN_IMGSZ   = 640
TRAIN_BATCH   = 8
TRAIN_DEVICE  = 0     # 0 = GPU, "cpu" = CPU


def create_output_dirs():
    """Call this at the start of any script to ensure all folders exist."""
    dirs = [
        INPUT_VIDEOS_DIR, MODELS_DIR, DATASETS_DIR,
        OUTPUT_VIDEOS_DIR, SNAPSHOTS_DIR,
        CSV_REPORTS_DIR, VIOLATION_SNAPSHOTS_DIR
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)






