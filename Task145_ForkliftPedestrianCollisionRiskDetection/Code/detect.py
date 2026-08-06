import os
import sys
import cv2
import argparse
import time
import json
import torch
import pandas as pd
import numpy as np

# PyTorch 2.6+ compatibility patch to prevent weights_only security errors
try:
    _orig_load = torch.load
    def _patched_load(*args, **kwargs):
        kwargs['weights_only'] = False
        return _orig_load(*args, **kwargs)
    torch.load = _patched_load
except Exception:
    pass

from ultralytics import YOLO

# Add parent directory to path to enable local module importing
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils import (
    video_frame_generator,
    SimpleIoUTracker,
    is_inside_polygon,
    generate_synthetic_forklift_video,
    log_collision_incident,
    display_collision_dashboard
)

def parse_args():
    parser = argparse.ArgumentParser(description="Task 145: Forklift-Pedestrian Collision Risk Detection System")
    parser.add_argument(
        "--video",
        type=str,
        default="",
        help="Path to input video file or image sequence directory. Ignored if --test_mode is set."
    )
    parser.add_argument(
        "--test_mode",
        action="store_true",
        help="Run self-test mode with programmatically generated synthetic forklift and pedestrian video."
    )
    parser.add_argument(
        "--output",
        type=str,
        default="",
        help="Path to save annotated output video. Default saves inside Outputs/."
    )
    parser.add_argument(
        "--model",
        type=str,
        default=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Models", "yolov8n.pt")),
        help="Path to YOLOv8 model weights file."
    )
    parser.add_argument(
        "--conf",
        type=float,
        default=0.3,
        help="YOLO detection confidence threshold."
    )
    parser.add_argument(
        "--warning_dist",
        type=float,
        default=120.0,
        help="Proximity warning threshold distance in pixels."
    )
    parser.add_argument(
        "--critical_dist",
        type=float,
        default=50.0,
        help="Critical risk threshold distance in pixels."
    )
    parser.add_argument(
        "--ttc_threshold",
        type=float,
        default=1.5,
        help="Time-to-collision warning threshold in seconds."
    )
    parser.add_argument(
        "--projection_frames",
        type=int,
        default=30,
        help="Number of frames to project future trajectories."
    )
    parser.add_argument(
        "--zone",
        type=str,
        default="100,320,350,150,600,150,680,320",
        help="Normalized/pixel safety zone vertices coordinates (x1,y1,x2,y2,x3,y3,x4,y4) separating Forklift Area."
    )
    parser.add_argument(
        "--forklift_classes",
        type=str,
        default="truck,car",
        help="COCO class names to consider as forklifts (comma-separated)."
    )
    return parser.parse_args()

def get_synthetic_detections(frame_idx):
    """
    Simulates pedestrian and forklift detections matching the path in the synthetic video.
    Returns: list of detections, matching the format expected by our tracker.
    """
    detections = []
    
    # 1. Pedestrian path: walking diagonally from top-left to bottom-right
    ped_x = 120.0 + 3.8 * frame_idx
    ped_y = 120.0 + 1.2 * frame_idx
    p_w, p_h = 30.0, 60.0
    detections.append({
        "bbox": [ped_x - p_w/2, ped_y - p_h/2, ped_x + p_w/2, ped_y + p_h/2],
        "confidence": 0.92,
        "class_id": 0, # Person
        "class_name": "person"
    })
    
    # 2. Forklift path: driving horizontally from bottom-left to bottom-right
    fork_x = 80.0 + 4.2 * frame_idx
    fork_y = 240.0 - 0.2 * frame_idx
    f_w, f_h = 70.0, 50.0
    detections.append({
        "bbox": [fork_x - f_w/2, fork_y - f_h/2, fork_x + f_w/2, fork_y + f_h/2],
        "confidence": 0.88,
        "class_id": 7, # Truck/Forklift
        "class_name": "truck"
    })
    
    return detections

def main():
    args = parse_args()
    
    # Setup base output directories
    code_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(code_dir)
    outputs_dir = os.path.join(project_dir, "Outputs")
    evidence_dir = os.path.join(outputs_dir, "evidence_frames")
    
    os.makedirs(outputs_dir, exist_ok=True)
    os.makedirs(evidence_dir, exist_ok=True)
    
    video_path = args.video
    
    if args.test_mode:
        print("[INFO] Operating in SYNTHETIC SELF-TEST mode.")
        synthetic_video_path = os.path.join(code_dir, "synthetic_test.mp4")
        print(f"Generating synthetic test video at: {synthetic_video_path}")
        generate_synthetic_forklift_video(synthetic_video_path, num_frames=150, fps=25)
        video_path = synthetic_video_path
        
    if not video_path:
        print("[ERROR] Please provide --video path OR run with --test_mode flag.")
        sys.exit(1)
        
    if not os.path.exists(video_path):
        print(f"[ERROR] Input video path does not exist: {video_path}")
        sys.exit(1)
        
    video_filename = os.path.basename(video_path)
    video_name_only, _ = os.path.splitext(video_filename)
    
    # Resolve output path
    if args.output:
        output_video_path = args.output
    else:
        output_video_path = os.path.join(outputs_dir, f"{video_name_only}_annotated.mp4")
        
    # Configure classes
    forklift_class_list = [c.strip().lower() for c in args.forklift_classes.split(',') if c.strip()]
    allowed_classes = {"person"} | set(forklift_class_list)
    
    # Parse Safety Zone Coordinates
    try:
        zone_coords = [int(x) for x in args.zone.split(',') if x.strip()]
        if len(zone_coords) % 2 != 0 or len(zone_coords) < 6:
            raise ValueError("Zone must contain at least 3 points (6 coordinates).")
        safety_zone_poly = [(zone_coords[i], zone_coords[i+1]) for i in range(0, len(zone_coords), 2)]
    except Exception as e:
        print(f"[WARN] Error parsing safety zone: {e}. Fallback to default.")
        safety_zone_poly = [(100, 320), (350, 150), (600, 150), (680, 320)]
        
    print(f"\n[INFO] Initializing Forklift-Pedestrian Collision Risk System")
    print(f" - Input Path:           {video_path}")
    print(f" - Output Video Path:     {output_video_path}")
    print(f" - Warning Distance:     {args.warning_dist} px")
    print(f" - Critical Distance:    {args.critical_dist} px")
    print(f" - Time-to-Collision:    {args.ttc_threshold}s limit")
    print(f" - Safety Zone Polygon:  {safety_zone_poly}")
    
    # Load YOLOv8 Model
    model = None
    if not args.test_mode:
        if not os.path.exists(args.model):
            print(f"[ERROR] YOLO model weights not found at: {args.model}")
            sys.exit(1)
        print("Loading YOLOv8 model weights...")
        model = YOLO(args.model)
        print("[OK] YOLO model loaded successfully.\n")
    else:
        print("YOLO Loading bypassed in Self-Test Mode (using ground truth injections).\n")
        
    start_time = time.time()
    processed_frames = 0
    tracker = SimpleIoUTracker(iou_threshold=0.3, max_lost_frames=30)
    incident_logs = []
    
    # Keep track of logged risks to prevent redundant CSV lines for the same encounter
    logged_risk_keys = set()
    
    # Statistics trackers
    closest_encounter = float('inf')
    total_warnings = 0
    total_criticals = 0
    
    try:
        frame_generator = video_frame_generator(video_path)
        out_writer = None
        
        for frame, frame_idx, fps, frame_count, width, height in frame_generator:
            if out_writer is None:
                # Initialize video writer matching frame resolution and frame rate
                fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                out_writer = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))
                print(f"Video Info: {width}x{height} | {fps:.2f} FPS | {frame_count} frames")
                print("Running detection pipeline...")
                
            # A. Detections retrieval
            detections = []
            if args.test_mode:
                detections = get_synthetic_detections(frame_idx)
            else:
                results = model.predict(frame, verbose=False)
                result = results[0]
                if result.boxes is not None and len(result.boxes) > 0:
                    boxes = result.boxes.xyxy.cpu().numpy()
                    confs = result.boxes.conf.cpu().numpy()
                    classes = result.boxes.cls.cpu().numpy()
                    names = result.names
                    
                    for idx in range(len(boxes)):
                        cls_name = names[int(classes[idx])].lower()
                        if cls_name in allowed_classes and confs[idx] >= args.conf:
                            # Map 'truck' or 'car' to forklift naming for consistency
                            mapped_class = "forklift" if cls_name in forklift_class_list else "pedestrian"
                            detections.append({
                                "bbox": list(boxes[idx]),
                                "confidence": float(confs[idx]),
                                "class_id": int(classes[idx]),
                                "class_name": mapped_class
                            })
                            
            # B. Track update
            current_tracks = tracker.update(detections, frame_idx)
            
            # C. Velocity calculations
            for track_id, track in current_tracks.items():
                history = track["centroid_history"]
                vx, vy = 0.0, 0.0
                if len(history) >= 5:
                    curr_cx, curr_cy, curr_f = history[-1]
                    prev_cx, prev_cy, prev_f = history[-5]
                    fdiff = curr_f - prev_f
                    if fdiff > 0:
                        vx = (curr_cx - prev_cx) / fdiff
                        vy = (curr_cy - prev_cy) / fdiff
                track["velocity"] = (vx, vy)
                
            # D. Proximity & Predictive Trajectory Heuristics
            # Categorize tracks
            ped_tracks = {tid: data for tid, data in current_tracks.items() if data["class_name"] == "person" or data["class_name"] == "pedestrian"}
            fork_tracks = {tid: data for tid, data in current_tracks.items() if data["class_name"] == "truck" or data["class_name"] == "forklift"}
            
            # Reset daily risks for frame
            frame_risks = []
            
            for p_id, p_track in ped_tracks.items():
                p_history = p_track["centroid_history"]
                px, py, _ = p_history[-1]
                p_vx, p_vy = p_track["velocity"]
                
                # Check zone violations
                in_safety_zone = is_inside_polygon((px, py), safety_zone_poly)
                if in_safety_zone:
                    # Mark warning zone violation
                    risk_key = f"zone_violation_ped{p_id}"
                    if risk_key not in logged_risk_keys:
                        log_collision_incident(
                            frame=frame,
                            frame_idx=frame_idx,
                            track_id_1=p_id,
                            track_id_2=-1,
                            class_1="pedestrian",
                            class_2="N/A",
                            dist=0.0,
                            risk_level="ZONE_VIOLATION",
                            evidence_dir=evidence_dir,
                            log_list=incident_logs,
                            video_name=video_filename
                        )
                        logged_risk_keys.add(risk_key)
                        total_warnings += 1
                    
                    frame_risks.append({
                        "type": "ZONE_VIOLATION",
                        "ped_id": p_id,
                        "fork_id": -1,
                        "desc": f"WARNING: PEDESTRIAN #{p_id} ENTERED FORKLIFT AREA!"
                    })
                
                # Compare against all forklifts
                for f_id, f_track in fork_tracks.items():
                    f_history = f_track["centroid_history"]
                    fx, fy, _ = f_history[-1]
                    f_vx, f_vy = f_track["velocity"]
                    
                    # 1. Proximity Check
                    dist = np.sqrt((px - fx)**2 + (py - fy)**2)
                    closest_encounter = min(closest_encounter, dist)
                    
                    risk_level = None
                    risk_desc = ""
                    
                    if dist <= args.critical_dist:
                        risk_level = "CRITICAL"
                        risk_desc = f"CRITICAL COLLISION RISK: FL #{f_id} & PEDESTRIAN #{p_id}!"
                    elif dist <= args.warning_dist:
                        risk_level = "WARNING"
                        risk_desc = f"WARNING PROXIMITY: FL #{f_id} & PEDESTRIAN #{p_id}!"
                        
                    # 2. Predictive Path Check (if not already critical)
                    if risk_level != "CRITICAL":
                        # Project positions over window
                        min_proj_dist = float('inf')
                        ttc_frame = -1
                        for step in range(1, args.projection_frames + 1):
                            proj_px = px + step * p_vx
                            proj_py = py + step * p_vy
                            proj_fx = fx + step * f_vx
                            proj_fy = fy + step * f_vy
                            
                            proj_dist = np.sqrt((proj_px - proj_fx)**2 + (proj_py - proj_fy)**2)
                            if proj_dist < min_proj_dist:
                                min_proj_dist = proj_dist
                                ttc_frame = step
                                
                        if min_proj_dist <= args.critical_dist:
                            ttc_sec = ttc_frame / fps
                            if ttc_sec <= args.ttc_threshold:
                                risk_level = "WARNING"
                                risk_desc = f"WARNING: FL #{f_id} & PED #{p_id} PATH INTERSECTION (TTC ~{ttc_sec:.1f}s)"
                                p_track["predicted_collision_point"] = (px + ttc_frame * p_vx, py + ttc_frame * p_vy)
                                f_track["predicted_collision_point"] = (fx + ttc_frame * f_vx, fy + ttc_frame * f_vy)
                                
                    if risk_level:
                        risk_key = f"{risk_level}_ped{p_id}_fork{f_id}"
                        if risk_key not in logged_risk_keys:
                            log_collision_incident(
                                frame=frame,
                                frame_idx=frame_idx,
                                track_id_1=f_id,
                                track_id_2=p_id,
                                class_1="forklift",
                                class_2="pedestrian",
                                dist=dist,
                                risk_level=risk_level,
                                evidence_dir=evidence_dir,
                                log_list=incident_logs,
                                video_name=video_filename
                            )
                            logged_risk_keys.add(risk_key)
                            if risk_level == "CRITICAL":
                                total_criticals += 1
                            else:
                                total_warnings += 1
                                
                        frame_risks.append({
                            "type": risk_level,
                            "ped_id": p_id,
                            "fork_id": f_id,
                            "desc": risk_desc
                        })
            
            # E. Render annotations
            annotated_frame = frame.copy()
            
            # Draw Forklift Safety Zone outline (orange)
            zone_pts_np = np.array(safety_zone_poly, dtype=np.int32)
            cv2.polylines(annotated_frame, [zone_pts_np], True, (0, 140, 255), 2, lineType=cv2.LINE_AA)
            cv2.putText(annotated_frame, "ACTIVE FORKLIFT AREA", (safety_zone_poly[0][0], safety_zone_poly[0][1] + 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 140, 255), 2, lineType=cv2.LINE_AA)
            
            # Render track bounding boxes and stats
            for track_id, track in current_tracks.items():
                x1, y1, x2, y2 = map(int, track["bbox"])
                cls_name = track["class_name"]
                
                # Check if this track is involved in any critical or warning risk in the current frame
                is_crit = any(r["type"] == "CRITICAL" and (r["ped_id"] == track_id or r["fork_id"] == track_id) for r in frame_risks)
                is_warn = any(r["type"] == "WARNING" and (r["ped_id"] == track_id or r["fork_id"] == track_id) for r in frame_risks)
                is_zone = any(r["type"] == "ZONE_VIOLATION" and r["ped_id"] == track_id for r in frame_risks)
                
                if is_crit:
                    color = (0, 0, 255) # Red
                    status = "CRITICAL RISK"
                    thick = 3
                elif is_warn or is_zone:
                    color = (0, 255, 255) # Yellow
                    status = "WARNING"
                    thick = 2
                else:
                    color = (0, 255, 0) # Green
                    status = "SAFE"
                    thick = 2
                    
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, thick)
                label_txt = f"ID {track_id} | {cls_name.upper()} | {status}"
                
                (w, h), _ = cv2.getTextSize(label_txt, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                cv2.rectangle(annotated_frame, (x1, y1 - 18), (x1 + w, y1), color, -1)
                cv2.putText(annotated_frame, label_txt, (x1, y1 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0) if color == (0, 255, 255) else (255, 255, 255), 1, lineType=cv2.LINE_AA)
                
                # Draw history path line
                history = track["centroid_history"]
                for i in range(1, len(history)):
                    pt1 = (int(history[i-1][0]), int(history[i-1][1]))
                    pt2 = (int(history[i][0]), int(history[i][1]))
                    age_pct = i / len(history)
                    fade_color = (
                        int(color[0] * age_pct + 80 * (1 - age_pct)),
                        int(color[1] * age_pct + 80 * (1 - age_pct)),
                        int(color[2] * age_pct + 80 * (1 - age_pct))
                    )
                    cv2.line(annotated_frame, pt1, pt2, fade_color, 2, lineType=cv2.LINE_AA)
                    
                # Draw future velocity projection vector line
                vx, vy = track["velocity"]
                if len(history) > 0 and (vx != 0.0 or vy != 0.0):
                    cx, cy, _ = history[-1]
                    proj_x = int(cx + args.projection_frames * vx)
                    proj_y = int(cy + args.projection_frames * vy)
                    cv2.arrowedLine(annotated_frame, (int(cx), int(cy)), (proj_x, proj_y), color, 2, cv2.LINE_AA, 0, 0.2)
                    
                    # Highlight trajectory collision projections if available
                    if "predicted_collision_point" in track and is_warn:
                        col_x, col_y = map(int, track["predicted_collision_point"])
                        cv2.circle(annotated_frame, (col_x, col_y), 8, (0, 165, 255), 1, lineType=cv2.LINE_AA)
                        cv2.putText(annotated_frame, "COLLISION PATH", (col_x + 10, col_y), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 165, 255), 1, lineType=cv2.LINE_AA)
                        
            # F. Render Flashing Top Warning HUD
            if frame_risks:
                # Find worst severity
                has_crit = any(r["type"] == "CRITICAL" for r in frame_risks)
                banner_color = (0, 0, 200) if has_crit else (0, 165, 255) # Red for critical, Orange for warning
                
                # Draw top bar
                cv2.rectangle(annotated_frame, (0, 0), (width, 40), banner_color, -1)
                
                # Display first alert text
                lead_alert = frame_risks[0]["desc"]
                if len(frame_risks) > 1:
                    lead_alert += f" (+{len(frame_risks) - 1} more)"
                cv2.putText(annotated_frame, lead_alert, (20, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, lineType=cv2.LINE_AA)
                
            out_writer.write(annotated_frame)
            processed_frames += 1
            
            if processed_frames % 50 == 0 or processed_frames == frame_count:
                progress = (processed_frames / frame_count) * 100
                print(f" [INFO] Processed {processed_frames}/{frame_count} frames ({progress:.1f}%)")
                
        # Clean up video writer
        if out_writer is not None:
            out_writer.release()
            
        # Export CSV incident logs
        log_cols = ["timestamp", "event_id", "object_1_id", "object_1_class", "object_2_id", "object_2_class", "distance_pixels", "risk_level", "evidence_filename", "frame_number", "video_name"]
        log_df = pd.DataFrame(incident_logs, columns=log_cols)
        csv_path = os.path.join(outputs_dir, "incident_log.csv")
        
        # Merge with existing CSV if it exists
        if os.path.exists(csv_path) and os.path.getsize(csv_path) > 0:
            try:
                existing_df = pd.read_csv(csv_path)
                log_df = pd.concat([existing_df, log_df], ignore_index=True)
                log_df = log_df.drop_duplicates(subset=["timestamp", "event_id", "video_name"])
            except Exception:
                pass
        log_df.to_csv(csv_path, index=False)
        print(f"[INFO] Incident CSV report updated: {csv_path}")
        
        # Export Summary Statistics JSON
        avg_dist = log_df['distance_pixels'].mean() if len(log_df) > 0 else 0.0
        summary_stats = {
            "total_incidents": len(log_df),
            "closest_encounter_distance_px": float(closest_encounter if closest_encounter != float('inf') else 0.0),
            "total_warning_alerts": total_warnings,
            "total_critical_alerts": total_criticals,
            "average_incident_distance": float(round(avg_dist, 2)),
            "processing_speed_fps": float(round(processed_frames / (time.time() - start_time), 2)),
            "total_frames_processed": processed_frames
        }
        summary_path = os.path.join(outputs_dir, "summary_stats.json")
        with open(summary_path, 'w') as f:
            json.dump(summary_stats, f, indent=4)
        print(f"[INFO] Summary statistics JSON saved: {summary_path}")
        
        # G. Render Analytics Dashboard
        display_collision_dashboard(outputs_dir, save_plot=True)
        
        elapsed = time.time() - start_time
        print("\n" + "="*60)
        print("[SUCCESS] PIPELINE COMPLETED SUCCESSFULLY")
        print("="*60)
        print(f"Total Processing Time: {elapsed:.2f} seconds")
        print(f"Average Frame Speed:   {processed_frames/elapsed:.2f} FPS")
        print(f"Annotated Video:       {output_video_path}")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"[ERROR] Critical pipeline failure: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
