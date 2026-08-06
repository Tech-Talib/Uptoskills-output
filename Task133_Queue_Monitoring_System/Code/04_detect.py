"""
04_detect.py — Main Queue Monitoring Detection Pipeline
Processes a video and produces:
  - Annotated output video with dashboard overlay
  - CSV report of queue statistics per frame
  - Violation snapshots

Usage:
    python Code/04_detect.py --video Input_Videos/sample.mp4
    python Code/04_detect.py --video Input_Videos/sample.mp4 --model Models/best.pt
"""

import os
import sys
import cv2
import time
import argparse
import pandas as pd

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import (
    MODELS_DIR, OUTPUT_VIDEOS_DIR, CSV_REPORTS_DIR,
    VIOLATION_SNAPSHOTS_DIR, CONFIDENCE_THRESHOLD, PERSON_CLASS_ID,
    ROI_X1, ROI_Y1, ROI_X2, ROI_Y2,
    OVERCROWDING_THRESHOLD, MOVEMENT_THRESHOLD, STALLED_SECONDS,
    create_output_dirs
)

create_output_dirs()


def parse_args():
    parser = argparse.ArgumentParser(description="Queue Monitoring System")
    parser.add_argument("--video", required=False, default="Input_Videos/sample.mp4", help="Path to input video")
    parser.add_argument("--model", default=os.path.join(MODELS_DIR, "yolov8n.pt"),
                        help="Path to YOLO model weights")
    parser.add_argument("--conf", type=float, default=CONFIDENCE_THRESHOLD)
    parser.add_argument("--roi", nargs=4, type=int,
                        default=[ROI_X1, ROI_Y1, ROI_X2, ROI_Y2],
                        metavar=("X1", "Y1", "X2", "Y2"),
                        help="Queue ROI coordinates")
    parser.add_argument("--threshold", type=int, default=OVERCROWDING_THRESHOLD,
                        help="Overcrowding person count threshold")
    return parser.parse_args()


def main():
    args = parse_args()

    if not os.path.exists(args.video):
        print(f"❌ Video not found: {args.video}")
        sys.exit(1)

    # ── Load model ────────────────────────────────────────────────────
    from ultralytics import YOLO
    print(f"\n🔄 Loading model: {args.model}")
    model = YOLO(args.model)
    print("✅ Model loaded\n")

    # ── Video setup ───────────────────────────────────────────────────
    video_name     = os.path.splitext(os.path.basename(args.video))[0]
    cap            = cv2.VideoCapture(args.video)
    width          = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height         = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps            = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total_frames   = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    temp_out_path  = os.path.join(OUTPUT_VIDEOS_DIR, f"{video_name}_temp.mp4")
    final_out_path = os.path.join(OUTPUT_VIDEOS_DIR, f"{video_name}_queue_monitoring.mp4")
    csv_path       = os.path.join(CSV_REPORTS_DIR,   f"{video_name}_statistics.csv")
    snap_dir       = os.path.join(VIOLATION_SNAPSHOTS_DIR, video_name)
    os.makedirs(snap_dir, exist_ok=True)

    fourcc    = cv2.VideoWriter_fourcc(*"mp4v")
    out_video = cv2.VideoWriter(temp_out_path, fourcc, fps, (width, height))

    # ── ROI ───────────────────────────────────────────────────────────
    rx1, ry1, rx2, ry2 = args.roi
    stalled_threshold   = int(fps * STALLED_SECONDS)

    # ── State ─────────────────────────────────────────────────────────
    entry_time         = {}
    previous_positions = {}
    stalled_counter    = 0
    records            = []
    snapshot_count     = 0
    frame_no           = 0
    start_time         = time.time()

    print(f"🎬 Processing: {args.video}")
    print(f"   Resolution : {width}x{height} | FPS: {fps:.1f} | Frames: {total_frames}")
    print(f"   ROI        : ({rx1},{ry1}) → ({rx2},{ry2})")
    print(f"   Threshold  : {args.threshold} people\n")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        current_time = frame_no / fps

        # ── Track persons ─────────────────────────────────────────────
        results = model.track(
            frame,
            persist=True,
            tracker="bytetrack.yaml",
            classes=[PERSON_CLASS_ID],
            conf=args.conf,
            verbose=False
        )

        annotated          = frame.copy()
        queue_count        = 0
        violation_count    = 0
        active_ids         = []
        current_positions  = {}
        waiting_times      = []
        moving_people      = 0
        total_movement     = 0

        if results[0].boxes.id is not None:
            ids   = results[0].boxes.id.cpu().numpy().astype(int)
            boxes = results[0].boxes.xyxy.cpu().numpy()

            for track_id, box in zip(ids, boxes):
                x1, y1, x2, y2 = map(int, box)
                cx = (x1 + x2) // 2
                cy = (y1 + y2) // 2
                inside = rx1 <= cx <= rx2 and ry1 <= cy <= ry2

                if inside:
                    queue_count += 1
                    active_ids.append(track_id)

                    if track_id not in entry_time:
                        entry_time[track_id] = current_time

                    waiting_times.append(current_time - entry_time[track_id])
                    current_positions[track_id] = (cx, cy)

                    if track_id in previous_positions:
                        px, py = previous_positions[track_id]
                        dist = ((cx - px) ** 2 + (cy - py) ** 2) ** 0.5
                        total_movement += dist
                        if dist > MOVEMENT_THRESHOLD:
                            moving_people += 1

                    color, label = (0, 255, 0), f"ID {track_id}"
                else:
                    violation_count += 1
                    color, label    = (0, 0, 255), f"OUT {track_id}"

                cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
                cv2.putText(annotated, label, (x1, y1 - 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)

        # ── Metrics ───────────────────────────────────────────────────
        avg_wait      = sum(waiting_times) / len(waiting_times) if waiting_times else 0
        max_wait      = max(waiting_times) if waiting_times else 0
        avg_movement  = total_movement / queue_count if queue_count else 0

        if moving_people == 0 and queue_count > 0:
            stalled_counter += 1
        else:
            stalled_counter = 0

        movement_status     = "STALLED" if stalled_counter >= stalled_threshold else "MOVING"
        overcrowding_status = "OVERCROWDED" if queue_count >= args.threshold else "NORMAL"

        if violation_count > 0:
            alert = "QUEUE VIOLATION"
        elif overcrowding_status == "OVERCROWDED":
            alert = "QUEUE OVERCROWDED"
        elif movement_status == "STALLED":
            alert = "QUEUE STALLED"
        else:
            alert = "NO ALERT"

        previous_positions = current_positions.copy()

        # ── Save violation snapshot ───────────────────────────────────
        if violation_count > 0 and snapshot_count < 20:
            snap_path = os.path.join(snap_dir, f"violation_frame_{frame_no}.jpg")
            cv2.imwrite(snap_path, annotated)
            snapshot_count += 1

        # ── Draw ROI ──────────────────────────────────────────────────
        cv2.rectangle(annotated, (rx1, ry1), (rx2, ry2), (255, 255, 0), 3)
        cv2.putText(annotated, "QUEUE AREA", (rx1 + 10, ry1 + 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 0), 2)

        # ── Dashboard panel ───────────────────────────────────────────
        cv2.rectangle(annotated, (15, 25), (630, 340), (0, 0, 0), -1)

        lines = [
            ("AI Queue Monitoring System",     (0, 255, 255)),
            (f"Queue Length     : {queue_count}",          (255, 255, 255)),
            (f"Moving People    : {moving_people}",        (255, 255, 255)),
            (f"Movement Status  : {movement_status}",
             (0, 0, 255) if movement_status == "STALLED" else (0, 255, 0)),
            (f"Avg Waiting Time : {avg_wait:.2f}s",        (255, 255, 255)),
            (f"Max Waiting Time : {max_wait:.2f}s",        (255, 255, 255)),
            (f"Overcrowding     : {overcrowding_status}",
             (0, 0, 255) if overcrowding_status == "OVERCROWDED" else (0, 255, 0)),
            (f"Violations       : {violation_count}",
             (0, 0, 255) if violation_count > 0 else (255, 255, 255)),
            (f"Alert            : {alert}",
             (0, 0, 255) if alert != "NO ALERT" else (0, 255, 0)),
        ]

        for i, (text, color) in enumerate(lines):
            cv2.putText(annotated, text, (30, 60 + i * 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

        # ── Record ────────────────────────────────────────────────────
        records.append({
            "Frame":                    frame_no,
            "Timestamp_sec":            round(current_time, 2),
            "Queue_Length":             queue_count,
            "Moving_People":            moving_people,
            "Movement_Status":          movement_status,
            "Average_Waiting_Time_sec": round(avg_wait, 2),
            "Maximum_Waiting_Time_sec": round(max_wait, 2),
            "Overcrowding_Status":      overcrowding_status,
            "Violation_Count":          violation_count,
            "Alert":                    alert,
        })

        out_video.write(annotated)
        frame_no += 1

        if frame_no % 50 == 0:
            pct = (frame_no / total_frames) * 100 if total_frames else 0
            print(f"  ⏳ {frame_no}/{total_frames} frames ({pct:.1f}%)")

    cap.release()
    out_video.release()

    # ── Convert to H264 for browser playback ─────────────────────────
    os.system(f'ffmpeg -y -i "{temp_out_path}" -vcodec libx264 -acodec aac "{final_out_path}" -loglevel quiet')
    if os.path.exists(final_out_path):
        os.remove(temp_out_path)

    # ── Save CSV ──────────────────────────────────────────────────────
    df = pd.DataFrame(records)
    df.to_csv(csv_path, index=False)

    # ── Summary ───────────────────────────────────────────────────────
    elapsed = time.time() - start_time
    print("\n" + "=" * 55)
    print("✅ QUEUE MONITORING COMPLETE")
    print("=" * 55)
    print(f"  Frames Processed    : {frame_no}")
    print(f"  Processing FPS      : {frame_no / elapsed:.2f}")
    print(f"  Output Video        : {final_out_path}")
    print(f"  CSV Report          : {csv_path}")
    print(f"  Violation Snapshots : {snap_dir} ({snapshot_count} saved)")
    print(f"  Avg Queue Length    : {df['Queue_Length'].mean():.2f}")
    print(f"  Max Queue Length    : {df['Queue_Length'].max()}")
    print(f"  Overcrowded Frames  : {(df['Overcrowding_Status']=='OVERCROWDED').sum()}")
    print("=" * 55)


if __name__ == "__main__":
    main()
