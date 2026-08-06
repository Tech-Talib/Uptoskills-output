"""
utils.py
---------
Helper functions for Road Accident Detection.
"""

import cv2
import numpy as np

from config import (
    ACCIDENT_COLOR,
    VEHICLE_COLOR,
    FONT_SCALE,
    FONT_THICKNESS,
    BORDER_THICKNESS,
    BOX_THICKNESS,
)


def initialize_video_writer(cap, output_path):
    """
    Creates and returns a VideoWriter object.
    """

    fps = cap.get(cv2.CAP_PROP_FPS)

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")

    return cv2.VideoWriter(
        output_path,
        fourcc,
        fps,
        (width, height)
    )


def process_frame(model, frame, conf_threshold):
    """
    Runs YOLO inference on a single frame and draws detections.

    Returns
    -------
    processed_frame : ndarray
    accident_detected : bool
    """

    results = model(
        frame,
        conf=conf_threshold,
        verbose=False
    )

    overlay = frame.copy()

    accident_detected = False

    boxes = results[0].boxes

    if boxes is None or len(boxes) == 0:
        cv2.putText(
            overlay,
            "No collision detected",
            (10, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (0, 255, 0),
            2,
            cv2.LINE_AA,
        )

        return overlay, False

    xyxy = boxes.xyxy.cpu().numpy().astype(int)
    classes = boxes.cls.cpu().numpy().astype(int)
    confidences = boxes.conf.cpu().numpy()

    for box, cls, conf in zip(xyxy, classes, confidences):

        x1, y1, x2, y2 = box

        if cls == 0:

            color = ACCIDENT_COLOR
            label = f"ACCIDENT {conf:.2f}"
            accident_detected = True

        else:

            color = VEHICLE_COLOR
            label = f"Vehicle {conf:.2f}"

        cv2.rectangle(
            overlay,
            (x1, y1),
            (x2, y2),
            color,
            BOX_THICKNESS
        )

        cv2.putText(
            overlay,
            label,
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            FONT_SCALE,
            color,
            FONT_THICKNESS
        )

    if accident_detected:

        h, w = overlay.shape[:2]

        cv2.rectangle(
            overlay,
            (5, 5),
            (w - 5, h - 5),
            ACCIDENT_COLOR,
            BORDER_THICKNESS
        )

        cv2.putText(
            overlay,
            "ACCIDENT DETECTED",
            (10, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            ACCIDENT_COLOR,
            3,
            cv2.LINE_AA
        )

    else:

        cv2.putText(
            overlay,
            "No collision detected",
            (10, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (0, 255, 0),
            2,
            cv2.LINE_AA
        )

    return overlay, accident_detected