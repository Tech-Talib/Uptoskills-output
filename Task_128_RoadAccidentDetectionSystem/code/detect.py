"""
detect.py
----------
Main program for Road Accident Detection.

Workflow:
1. Load configuration
2. Load YOLO model
3. Open video
4. Detect accidents frame by frame
5. Draw detections
6. Save output video
"""

import cv2
from ultralytics import YOLO

from config import (
    MODEL_PATH,
    VIDEO_PATH,
    OUTPUT_PATH,
    CONF_THRESHOLD
)

from utils import (
    process_frame,
    initialize_video_writer
)


def main():

    print("Loading YOLO model...")
    model = YOLO(MODEL_PATH)

    print("Opening video...")
    cap = cv2.VideoCapture(VIDEO_PATH)

    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {VIDEO_PATH}")

    out = initialize_video_writer(cap, OUTPUT_PATH)

    total_frames = 0
    accident_frames = 0

    while True:

        ret, frame = cap.read()

        if not ret:
            break

        total_frames += 1

        processed_frame, detected = process_frame(
            model,
            frame,
            CONF_THRESHOLD
        )

        if detected:
            accident_frames += 1

        out.write(processed_frame)

    cap.release()
    out.release()

    print("\n===================================")
    print("Processing Finished")
    print("===================================")
    print(f"Total Frames     : {total_frames}")
    print(f"Accident Frames  : {accident_frames}")
    print(f"Saved Output To  : {OUTPUT_PATH}")


if __name__ == "__main__":
    main()