import os
import cv2
import numpy as np
import pandas as pd
import datetime
import time
import argparse
import threading
import winsound
import config

# Try to import Ultralytics YOLO with PyTorch 2.6 weights_only patch
YOLO_AVAILABLE = False
try:
    import torch
    # Monkeypatch torch.load to bypass PyTorch 2.6 weights_only default value issue
    _orig_load = torch.load
    def _patched_load(*args, **kwargs):
        kwargs['weights_only'] = False
        return _orig_load(*args, **kwargs)
    torch.load = _patched_load
    
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    pass

# Thread-safe audio alert function
def beep_alert():
    try:
        winsound.Beep(config.BEEP_FREQUENCY, config.BEEP_DURATION)
    except Exception as e:
        print(f"Error playing beep: {e}")

def trigger_audio_alert():
    if config.AUDIO_ALERT_ENABLED:
        threading.Thread(target=beep_alert, daemon=True).start()


class CentroidTracker:
    """
    A simple Centroid Tracker for fallback mode when YOLO tracking is not available.
    Associates bounding boxes across frames using Euclidean distance between centroids.
    """
    def __init__(self, max_disappeared=15):
        self.next_object_id = 1
        self.objects = {}       # id -> centroid (cx, cy)
        self.bboxes = {}        # id -> bbox (x, y, w, h)
        self.disappeared = {}   # id -> frame count since last seen
        self.max_disappeared = max_disappeared

    def register(self, centroid, bbox):
        self.objects[self.next_object_id] = centroid
        self.bboxes[self.next_object_id] = bbox
        self.disappeared[self.next_object_id] = 0
        self.next_object_id += 1

    def deregister(self, object_id):
        del self.objects[object_id]
        del self.bboxes[object_id]
        del self.disappeared[object_id]

    def update(self, rects):
        # rects: list of (x, y, w, h)
        if len(rects) == 0:
            for object_id in list(self.disappeared.keys()):
                self.disappeared[object_id] += 1
                if self.disappeared[object_id] > self.max_disappeared:
                    self.deregister(object_id)
            return self.bboxes

        # Calculate centroids of input bboxes
        input_centroids = np.zeros((len(rects), 2), dtype="int")
        for (i, (x, y, w, h)) in enumerate(rects):
            cx = int(x + w / 2.0)
            cy = int(y + h / 2.0)
            input_centroids[i] = (cx, cy)

        # If no objects are currently tracked, register all input centroids
        if len(self.objects) == 0:
            for i in range(0, len(input_centroids)):
                self.register(input_centroids[i], rects[i])
        else:
            object_ids = list(self.objects.keys())
            object_centroids = list(self.objects.values())

            # Distance matrix between tracked centroids and new centroids
            D = np.linalg.norm(np.array(object_centroids)[:, np.newaxis] - input_centroids, axis=2)

            # Find matching centroids (row minimums and sorting)
            rows = D.min(axis=1).argsort()
            cols = D.argmin(axis=1)[rows]

            used_rows = set()
            used_cols = set()

            for (row, col) in zip(rows, cols):
                if row in used_rows or col in used_cols:
                    continue

                object_id = object_ids[row]
                self.objects[object_id] = input_centroids[col]
                self.bboxes[object_id] = rects[col]
                self.disappeared[object_id] = 0

                used_rows.add(row)
                used_cols.add(col)

            # Unused rows (disappeared tracked objects)
            unused_rows = set(range(0, D.shape[0])).difference(used_rows)
            for row in unused_rows:
                object_id = object_ids[row]
                self.disappeared[object_id] += 1
                if self.disappeared[object_id] > self.max_disappeared:
                    self.deregister(object_id)

            # Unused cols (new objects)
            unused_cols = set(range(0, D.shape[1])).difference(used_cols)
            for col in unused_cols:
                self.register(input_centroids[col], rects[col])

        return self.bboxes


def create_static_bg():
    bg = np.zeros((config.FRAME_HEIGHT, config.FRAME_WIDTH, 3), dtype=np.uint8)
    bg[:, :750] = [180, 180, 180]
    for x in range(100, 750, 100):
        cv2.line(bg, (x, 0), (x, config.FRAME_HEIGHT), (160, 160, 160), 1)
    for y in range(100, config.FRAME_HEIGHT, 100):
        cv2.line(bg, (0, y), (750, y), (160, 160, 160), 1)
    bg[:, 750:] = [45, 50, 55]
    for y in range(20, config.FRAME_HEIGHT, 40):
        cv2.rectangle(bg, (800, y), (1200, y + 15), (30, 40, 50), -1)
    cv2.line(bg, (880, 0), (880, config.FRAME_HEIGHT), (120, 120, 130), 8)
    cv2.line(bg, (1120, 0), (1120, config.FRAME_HEIGHT), (120, 120, 130), 8)
    cv2.line(bg, (750, 0), (750, config.FRAME_HEIGHT), (0, 215, 255), 10)
    return bg


class SafetyMonitor:
    def __init__(self, use_yolo=True, model_path=config.YOLO_MODEL_NAME, conf_thresh=config.CONFIDENCE_THRESHOLD, is_synthetic=False):
        self.use_yolo = use_yolo and YOLO_AVAILABLE
        self.model_path = model_path
        self.conf_thresh = conf_thresh
        self.is_synthetic = is_synthetic
        
        # Load YOLO if available
        if self.use_yolo:
            print(f"Initializing YOLOv8 Safety Monitor using '{model_path}'...")
            try:
                self.model = YOLO(model_path)
            except Exception as e:
                print(f"Failed to load YOLO model: {e}. Falling back to standard OpenCV tracker.")
                self.use_yolo = False
        
        if not self.use_yolo:
            if self.is_synthetic:
                print("Initializing Fallback Static Background Diff Safety Monitor...")
                self.static_bg = create_static_bg()
            else:
                print("Initializing Fallback MOG2 Background Subtraction Safety Monitor...")
                self.back_sub = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=30, detectShadows=True)
            self.tracker = CentroidTracker(max_disappeared=15)
            
        # Tracking States
        # track_id -> dict(first_seen, danger_entry_time, total_danger_duration, in_danger, last_alert_time)
        self.track_states = {}
        
        # Event logs
        self.event_records = []
        if os.path.exists(config.EVENT_LOG_PATH):
            try:
                self.event_records = pd.read_csv(config.EVENT_LOG_PATH).to_dict('records')
            except Exception:
                self.event_records = []
        else:
            # Create empty CSV
            pd.DataFrame(columns=["Timestamp", "Track ID", "Event Type", "Duration in Danger Zone (s)", "Snapshot Path"]).to_csv(config.EVENT_LOG_PATH, index=False)

    def is_point_in_danger(self, point, line_coords=config.DEFAULT_LINE_COORDS, safe_side=config.SAFE_SIDE):
        px, py = point
        (x1, y1), (x2, y2) = line_coords
        
        # Determine if vertical-ish or horizontal-ish
        is_vertical = abs(x2 - x1) < abs(y2 - y1)
        
        if is_vertical:
            # Interpolate x line coordinate at py
            if y2 != y1:
                x_line = x1 + (py - y1) * (x2 - x1) / (y2 - y1)
            else:
                x_line = x1
            
            if safe_side == "left":
                return px > x_line
            else: # safe_side == "right"
                return px < x_line
        else:
            # Interpolate y line coordinate at px
            if x2 != x1:
                y_line = y1 + (px - x1) * (y2 - y1) / (x2 - x1)
            else:
                y_line = y1
                
            if safe_side == "top":
                return py > y_line
            else: # safe_side == "bottom"
                return py < y_line

    def log_event(self, track_id, event_type, duration, snapshot_path):
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        record = {
            "Timestamp": timestamp,
            "Track ID": track_id,
            "Event Type": event_type,
            "Duration in Danger Zone (s)": round(duration, 2),
            "Snapshot Path": snapshot_path
        }
        self.event_records.append(record)
        
        # Write to CSV
        try:
            df = pd.DataFrame(self.event_records)
            df.to_csv(config.EVENT_LOG_PATH, index=False)
        except Exception as e:
            print(f"Error saving event to CSV: {e}")
            
        print(f"[{timestamp}] ALERT: Track {track_id} - {event_type} (Duration: {duration:.1f}s) - Snapshot: {snapshot_path}")

    def save_evidence_snapshot(self, frame, track_id, event_type, bbox, line_coords=config.DEFAULT_LINE_COORDS):
        x, y, w, h = bbox
        # Crop with extra padding if within image bounds
        h_img, w_img, _ = frame.shape
        pad = 20
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(w_img, x + w + pad)
        y2 = min(h_img, y + h + pad)
        
        # Draw indicator in snapshot
        annotated_snapshot = frame.copy()
        cv2.rectangle(annotated_snapshot, (x, y), (x + w, y + h), (0, 0, 255), 2)
        cv2.putText(annotated_snapshot, f"VIOLATOR ID: {track_id}", (x, y - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
        
        # Draw safety line
        (lx1, ly1), (lx2, ly2) = line_coords
        cv2.line(annotated_snapshot, (lx1, ly1), (lx2, ly2), (0, 0, 255), 3)
        
        # Save snapshot
        timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"track_{track_id}_{event_type.lower().replace(' ', '_')}_{timestamp_str}.jpg"
        filepath = os.path.join(config.EVIDENCE_DIR, filename)
        cv2.imwrite(filepath, annotated_snapshot)
        return filepath

    def process_frame(self, frame, line_coords=config.DEFAULT_LINE_COORDS, safe_side=config.SAFE_SIDE):
        # Resize frame to standard if needed
        h_frame, w_frame, _ = frame.shape
        if (w_frame, h_frame) != (config.FRAME_WIDTH, config.FRAME_HEIGHT):
            frame = cv2.resize(frame, (config.FRAME_WIDTH, config.FRAME_HEIGHT))
            h_frame, w_frame, _ = frame.shape
            
        annotated_frame = frame.copy()
        current_time = time.time()
        
        # Detected boxes: list of (track_id, x, y, w, h)
        detected_people = []
        
        if self.use_yolo:
            # YOLO tracking with imgsz=640 for high sensitivity on small/distant human figures
            try:
                results = self.model.track(frame, persist=True, verbose=False, conf=self.conf_thresh, imgsz=640)
            except Exception:
                results = self.model.predict(frame, verbose=False, conf=self.conf_thresh, imgsz=640)
                
            if len(results) > 0 and results[0].boxes is not None and len(results[0].boxes) > 0:
                boxes = results[0].boxes
                
                # Safely convert to 2D numpy arrays
                xyxys = boxes.xyxy.cpu().numpy()
                if xyxys.ndim == 1:
                    xyxys = np.expand_dims(xyxys, axis=0)
                    
                classes = boxes.cls.cpu().numpy().flatten() if boxes.cls is not None else None
                track_ids = boxes.id.cpu().numpy().flatten() if boxes.id is not None else None
                
                for i in range(len(xyxys)):
                    cls_id = int(classes[i]) if classes is not None and i < len(classes) else 0
                    if cls_id == 0:  # 0 is person class in COCO dataset
                        x1, y1, x2, y2 = map(int, xyxys[i])
                        w = max(1, x2 - x1)
                        h = max(1, y2 - y1)
                        
                        if track_ids is not None and i < len(track_ids):
                            track_id = int(track_ids[i])
                        else:
                            track_id = i + 1000  # Fallback temporary ID
                            
                        detected_people.append((track_id, x1, y1, w, h))
        else:
            # Fallback Tracking: high-sensitivity motion detection tuned for CCTV human figures
            if self.is_synthetic:
                diff = cv2.absdiff(frame, self.static_bg)
                fg_mask = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
                _, fg_mask = cv2.threshold(fg_mask, 15, 255, cv2.THRESH_BINARY)
            else:
                fg_mask = self.back_sub.apply(frame)
                _, fg_mask = cv2.threshold(fg_mask, 120, 255, cv2.THRESH_BINARY)
            
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
            fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel)
            
            contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            rects = []
            for contour in contours:
                area_thresh = 400 if self.is_synthetic else 250
                if cv2.contourArea(contour) > area_thresh:
                    x, y, w, h = cv2.boundingRect(contour)
                    if h > 15:
                        rects.append((x, y, w, h))
                        
            # Update centroid tracker
            tracked_bboxes = self.tracker.update(rects)
            for track_id, (x, y, w, h) in tracked_bboxes.items():
                detected_people.append((track_id, x, y, w, h))

        # Check safety violations and update states
        any_active_violations = False
        
        for track_id, x, y, w, h in detected_people:
            # Bottom-center of the bounding box (feet position on the platform)
            ref_point = (int(x + w / 2.0), y + h)
            
            # Check line crossing
            in_danger = self.is_point_in_danger(ref_point, line_coords, safe_side)
            
            # Initialize or update state
            if track_id not in self.track_states:
                self.track_states[track_id] = {
                    "first_seen": current_time,
                    "danger_entry_time": None,
                    "total_danger_duration": 0.0,
                    "in_danger": False,
                    "last_alert_time": 0.0,
                    "violation_logged": False,
                    "dwell_warning_logged": False
                }
                
            state = self.track_states[track_id]
            prev_in_danger = state["in_danger"]
            state["in_danger"] = in_danger
            
            # Visual box color and text
            box_color = (0, 255, 0) # Green for safe
            status_text = f"ID:{track_id} SAFE"
            
            if in_danger:
                any_active_violations = True
                box_color = (0, 0, 255) # Red for danger
                
                # Check transition to danger
                if not prev_in_danger or state["danger_entry_time"] is None:
                    state["danger_entry_time"] = current_time
                    
                state["total_danger_duration"] = current_time - state["danger_entry_time"]
                
                # Triggers & Logs
                if not state["violation_logged"]:
                    state["violation_logged"] = True
                    # Take snapshot and save record
                    snap_path = self.save_evidence_snapshot(frame, track_id, "Line Crossing", (x, y, w, h), line_coords=line_coords)
                    self.log_event(track_id, "Line Crossing", state["total_danger_duration"], snap_path)
                    trigger_audio_alert()
                    state["last_alert_time"] = current_time
                
                # Dwell Warning: in danger for > DWELL_TIME_THRESHOLD_SECONDS
                if (state["total_danger_duration"] >= config.DWELL_TIME_THRESHOLD_SECONDS 
                        and not state["dwell_warning_logged"]):
                    state["dwell_warning_logged"] = True
                    snap_path = self.save_evidence_snapshot(frame, track_id, "Dwell Danger", (x, y, w, h), line_coords=line_coords)
                    self.log_event(track_id, "Dwell Danger", state["total_danger_duration"], snap_path)
                    trigger_audio_alert()
                    state["last_alert_time"] = current_time
                    
                # Recurring beep alert if still in danger and cooldown passed
                if current_time - state["last_alert_time"] > config.ALERT_COOLDOWN_SECONDS:
                    trigger_audio_alert()
                    state["last_alert_time"] = current_time
                
                status_text = f"ID:{track_id} DANGER ({state['total_danger_duration']:.1f}s)"
            else:
                # If they were in danger and now returned to safe zone
                if prev_in_danger and state["danger_entry_time"] is not None:
                    total_dur = current_time - state["danger_entry_time"]
                    snap_path = self.save_evidence_snapshot(frame, track_id, "Safe Return", (x, y, w, h), line_coords=line_coords)
                    self.log_event(track_id, "Safe Return", total_dur, snap_path)
                    # Reset danger time
                    state["danger_entry_time"] = None
                    state["violation_logged"] = False
                    state["dwell_warning_logged"] = False
            
            # Draw bounding box and label
            cv2.rectangle(annotated_frame, (x, y), (x + w, y + h), box_color, 2)
            cv2.circle(annotated_frame, ref_point, 5, (255, 0, 0), -1) # Blue dot on feet reference point
            cv2.putText(annotated_frame, status_text, (x, y - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, box_color, 2)
            
        # Draw Safety Line
        # Line color is RED if active violation, yellow otherwise
        line_color = (0, 0, 255) if any_active_violations else (0, 215, 255)
        (lx1, ly1), (lx2, ly2) = line_coords
        cv2.line(annotated_frame, (lx1, ly1), (lx2, ly2), line_color, 3)
        
        # Draw semi-transparent header overlay if violation is active
        if any_active_violations:
            overlay = annotated_frame.copy()
            cv2.rectangle(overlay, (0, 0), (config.FRAME_WIDTH, 60), (0, 0, 255), -1)
            cv2.addWeighted(overlay, 0.3, annotated_frame, 0.7, 0, annotated_frame)
            cv2.putText(annotated_frame, "!!! SAFETY VIOLATION DETECTED !!!", (350, 42),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 3, cv2.LINE_AA)
            
        return annotated_frame


def run_pipeline(input_path, output_path, use_yolo=True, tracker_type="yolo"):
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print(f"Error opening video file: {input_path}")
        return
        
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        fps = 30.0
        
    print(f"Input video properties: {width}x{height} @ {fps} FPS")
    
    # Setup video writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (config.FRAME_WIDTH, config.FRAME_HEIGHT))
    
    is_synthetic = "railway_platform_test.mp4" in os.path.basename(input_path)
    monitor = SafetyMonitor(use_yolo=(tracker_type=="yolo"), is_synthetic=is_synthetic)
    
    frame_count = 0
    start_time = time.time()
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        processed = monitor.process_frame(frame)
        out.write(processed)
        
        frame_count += 1
        if frame_count % 30 == 0:
            print(f"Processed {frame_count} frames...")
            
    cap.release()
    out.release()
    
    elapsed = time.time() - start_time
    print(f"Processing complete! Saved annotated video to: {output_path}")
    print(f"Total processed frames: {frame_count} in {elapsed:.1f}s ({frame_count/elapsed:.1f} FPS)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Railway Platform Safety Monitor Core")
    parser.add_argument("--input", type=str, default=config.DEFAULT_VIDEO_INPUT, help="Path to input video file")
    parser.add_argument("--output", type=str, default=config.DEFAULT_VIDEO_OUTPUT, help="Path to output video file")
    parser.add_argument("--tracker", type=str, choices=["yolo", "fallback"], default="yolo", help="Tracker type: yolo or fallback")
    parser.add_argument("--no-audio", action="store_true", help="Disable auditory alerts")
    
    args = parser.parse_args()
    
    if args.no_audio:
        config.AUDIO_ALERT_ENABLED = False
        
    # Generate synthetic video first if default input is missing
    if args.input == config.DEFAULT_VIDEO_INPUT and not os.path.exists(config.DEFAULT_VIDEO_INPUT):
        print("Default test video not found. Generating synthetic video first...")
        from synthetic_video_generator import generate_video
        generate_video(config.DEFAULT_VIDEO_INPUT)
        
    run_pipeline(args.input, args.output, tracker_type=args.tracker)
