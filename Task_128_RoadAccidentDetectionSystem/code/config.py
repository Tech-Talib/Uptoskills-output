"""
config.py
----------
Contains all configurable settings for the Road Accident Detection project.
"""

import os

# ============================================================
# PROJECT ROOT
# ============================================================

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ============================================================
# MODEL
# ============================================================

MODEL_PATH = os.path.join(
    PROJECT_ROOT,
    "Models",
    "epoch61.pt"
)

# ============================================================
# INPUT VIDEO
# ============================================================

VIDEO_PATH = os.path.join(
    PROJECT_ROOT,
    "Videos",
    "input",
    "road_accident_video_26.mp4"
)

# ============================================================
# OUTPUT VIDEO
# ============================================================

OUTPUT_PATH = os.path.join(
    PROJECT_ROOT,
    "Videos",
    "output",
    "output_hf.mp4"
)

# ============================================================
# DETECTION SETTINGS
# ============================================================

CONF_THRESHOLD = 0.40

# ============================================================
# DRAWING SETTINGS
# ============================================================

ACCIDENT_COLOR = (0, 0, 255)      # Red
VEHICLE_COLOR = (0, 255, 0)       # Green

FONT_SCALE = 0.6
FONT_THICKNESS = 2

BORDER_THICKNESS = 8
BOX_THICKNESS = 2