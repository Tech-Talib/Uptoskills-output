import os

# Base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TASK_ROOT = os.path.dirname(BASE_DIR)
EVIDENCE_DIR = os.path.join(TASK_ROOT, "Outputs", "evidence")
EVENT_LOG_PATH = os.path.join(TASK_ROOT, "Outputs", "event_log.csv")
DEFAULT_VIDEO_INPUT = os.path.join(BASE_DIR, "railway_platform_test.mp4")
DEFAULT_VIDEO_OUTPUT = os.path.join(TASK_ROOT, "Outputs", "output_video.mp4")

# Ensure directories exist
os.makedirs(EVIDENCE_DIR, exist_ok=True)

# CV Parameters
YOLO_MODEL_NAME = "yolov8n.pt"
CONFIDENCE_THRESHOLD = 0.25
FRAME_WIDTH = 1280
FRAME_HEIGHT = 720

# Safety Line Coordinates: ((x1, y1), (x2, y2))
# Default: A vertical line at x = 750, dividing the platform (left) and tracks (right)
DEFAULT_LINE_COORDS = ((750, 0), (750, 720))

# Safe Side Indicator: "left", "right", "top", "bottom"
# If the line is vertical-ish, "left" means x < line_x is safe, x > line_x is danger.
SAFE_SIDE = "left"

# Alert configuration
ALERT_COOLDOWN_SECONDS = 3.0  # Cooldown between sound alerts for the same track ID
DWELL_TIME_THRESHOLD_SECONDS = 5.0  # Time in danger zone before flag as "Dwell Danger"
AUDIO_ALERT_ENABLED = True
BEEP_FREQUENCY = 1000  # Hz
BEEP_DURATION = 300  # ms
