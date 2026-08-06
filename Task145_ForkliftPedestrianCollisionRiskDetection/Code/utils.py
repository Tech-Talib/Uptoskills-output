import os
import cv2
import datetime
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import glob

def video_frame_generator(video_path):
    """
    Opens a video file OR a directory containing sequential images, and yields frames 
    sequentially along with sequence metadata.
    
    Args:
        video_path (str): Path to the input video file or image sequence directory.
        
    Yields:
        tuple: (frame, frame_idx, fps, frame_count, width, height)
            - frame (numpy.ndarray): The current video frame.
            - frame_idx (int): The current frame index (0-based).
            - fps (float): Frame rate of the video.
            - frame_count (int): Total number of frames in the sequence.
            - width (int): Width of the video frame.
            - height (int): Height of the video frame.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Input path not found at: {video_path}")
        
    # Check if the path is a directory of images
    if os.path.isdir(video_path):
        image_extensions = ('*.png', '*.jpg', '*.jpeg', '*.bmp', '*.tif', '*.tiff')
        image_files = []
        for ext in image_extensions:
            image_files.extend(glob.glob(os.path.join(video_path, ext)))
            image_files.extend(glob.glob(os.path.join(video_path, ext.upper())))
            
        image_files = sorted(list(set(image_files)))
        
        if not image_files:
            raise FileNotFoundError(f"No image files found in directory: {video_path}")
            
        frame_count = len(image_files)
        first_frame = cv2.imread(image_files[0])
        if first_frame is None:
            raise IOError(f"Could not read the first image frame: {image_files[0]}")
        height, width = first_frame.shape[:2]
        fps = 30.0 # Default fallback FPS for image sequences
        
        for frame_idx, img_path in enumerate(image_files):
            frame = cv2.imread(img_path)
            if frame is None:
                print(f"[WARN] Could not read frame image: {img_path}")
                continue
            yield frame, frame_idx, fps, frame_count, width, height
            
    else:
        # Standard video file input
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise IOError(f"OpenCV was unable to open video file at: {video_path}")
            
        try:
            fps = cap.get(cv2.CAP_PROP_FPS)
            if fps <= 0 or fps is None:
                fps = 30.0
                
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            frame_idx = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                yield frame, frame_idx, fps, frame_count, width, height
                frame_idx += 1
        finally:
            cap.release()

def calculate_iou(box1, box2):
    """
    Computes the Intersection over Union (IoU) between two bounding boxes.
    """
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    
    if x2 < x1 or y2 < y1:
        return 0.0
        
    intersection_area = (x2 - x1) * (y2 - y1)
    box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
    box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union_area = box1_area + box2_area - intersection_area
    
    if union_area == 0.0:
        return 0.0
        
    return intersection_area / union_area

class SimpleIoUTracker:
    def __init__(self, iou_threshold=0.3, max_lost_frames=30):
        """
        A lightweight class-aware IoU-based tracker for matching detections across frames.
        """
        self.iou_threshold = iou_threshold
        self.max_lost_frames = max_lost_frames
        self.next_id = 1
        self.tracked_objects = {}
        
    def update(self, detections, frame_idx):
        """
        Updates the tracks with new detections from the current frame.
        """
        active_ids = list(self.tracked_objects.keys())
        matches = []
        
        # Calculate IoU between all current detections and existing tracked objects
        for det_idx, det in enumerate(detections):
            det_bbox = det["bbox"]
            det_cls = det["class_id"]
            for track_id in active_ids:
                track_data = self.tracked_objects[track_id]
                # Class-aware matching
                if track_data["class_id"] == det_cls:
                    track_bbox = track_data["bbox"]
                    iou = calculate_iou(det_bbox, track_bbox)
                    if iou >= self.iou_threshold:
                        matches.append((iou, det_idx, track_id))
                        
        # Sort matches by IoU in descending order
        matches.sort(key=lambda x: x[0], reverse=True)
        
        matched_det_indices = set()
        matched_track_ids = set()
        
        for iou, det_idx, track_id in matches:
            if det_idx in matched_det_indices or track_id in matched_track_ids:
                continue
                
            matched_det_indices.add(det_idx)
            matched_track_ids.add(track_id)
            
            det = detections[det_idx]
            track_data = self.tracked_objects[track_id]
            track_data["bbox"] = det["bbox"]
            track_data["confidence"] = det["confidence"]
            track_data["lost_frames"] = 0
            track_data["last_seen_frame"] = frame_idx
            
            centroid_x = (det["bbox"][0] + det["bbox"][2]) / 2.0
            centroid_y = (det["bbox"][1] + det["bbox"][3]) / 2.0
            track_data["centroid_history"].append((centroid_x, centroid_y, frame_idx))
            
            if len(track_data["centroid_history"]) > 60: # Limit history window
                track_data["centroid_history"].pop(0)
                
        # Register new tracks for unmatched detections
        for det_idx, det in enumerate(detections):
            if det_idx not in matched_det_indices:
                centroid_x = (det["bbox"][0] + det["bbox"][2]) / 2.0
                centroid_y = (det["bbox"][1] + det["bbox"][3]) / 2.0
                
                self.tracked_objects[self.next_id] = {
                    "bbox": det["bbox"],
                    "confidence": det["confidence"],
                    "class_id": det["class_id"],
                    "class_name": det["class_name"],
                    "centroid_history": [(centroid_x, centroid_y, frame_idx)],
                    "lost_frames": 0,
                    "first_seen_frame": frame_idx,
                    "last_seen_frame": frame_idx,
                    "zone_violation_logged": False
                }
                self.next_id += 1
                
        # Handle lost tracks
        dead_tracks = []
        for track_id in active_ids:
            if track_id not in matched_track_ids:
                self.tracked_objects[track_id]["lost_frames"] += 1
                if self.tracked_objects[track_id]["lost_frames"] > self.max_lost_frames:
                    dead_tracks.append(track_id)
                    
        for track_id in dead_tracks:
            del self.tracked_objects[track_id]
            
        return {
            tid: data for tid, data in self.tracked_objects.items() 
            if data["last_seen_frame"] == frame_idx
        }

def is_inside_polygon(point, polygon):
    """
    Checks if a point (x, y) is inside a polygon using OpenCV's pointPolygonTest.
    """
    poly_arr = np.array(polygon, dtype=np.float32)
    pt = (float(point[0]), float(point[1]))
    result = cv2.pointPolygonTest(poly_arr, pt, False)
    return result >= 0

def generate_synthetic_forklift_video(output_path, num_frames=150, fps=25, width=768, height=432):
    """
    Generates a synthetic mp4 video simulating a warehouse environment where
    a forklift and a pedestrian walk and cross paths, generating collision alerts.
    """
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    # Define a custom Forklift Zone
    zone_pts = np.array([(100, 320), (350, 150), (600, 150), (680, 320)], dtype=np.int32)
    
    # Path settings:
    # Pedestrian starts left-top and walks diagonally to bottom-right
    # Forklift starts bottom-left and drives horizontally to bottom-right
    for f in range(num_frames):
        # Create dark-grey warehouse floor background
        frame = np.ones((height, width, 3), dtype=np.uint8) * 45
        
        # Draw grid lines for warehouse aesthetic
        for x in range(0, width, 40):
            cv2.line(frame, (x, 0), (x, height), (55, 55, 55), 1)
        for y in range(0, height, 40):
            cv2.line(frame, (0, y), (width, y), (55, 55, 55), 1)
            
        # Draw "Forklift Zone" polygon outline and label
        cv2.polylines(frame, [zone_pts], True, (0, 140, 255), 2, lineType=cv2.LINE_AA)
        # Semi-transparent zone overlay
        overlay = frame.copy()
        cv2.fillPoly(overlay, [zone_pts], (0, 80, 150))
        cv2.addWeighted(overlay, 0.2, frame, 0.8, 0, frame)
        cv2.putText(frame, "FORKLIFT OPERATION AREA", (120, 310),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 1, lineType=cv2.LINE_AA)
        
        # Calculate moving positions:
        # Pedestrian (Person)
        ped_x = int(120 + 3.8 * f)
        ped_y = int(120 + 1.2 * f)
        
        # Forklift (Truck)
        fork_x = int(80 + 4.2 * f)
        fork_y = int(240 - 0.2 * f)
        
        # Draw Pedestrian (represented as a blue-circle/avatar walking)
        # Bounding box coordinates:
        p_w, p_h = 30, 60
        px1, py1 = ped_x - p_w//2, ped_y - p_h//2
        px2, py2 = ped_x + p_w//2, ped_y + p_h//2
        cv2.rectangle(frame, (px1, py1), (px2, py2), (255, 180, 100), 2, lineType=cv2.LINE_AA)
        cv2.circle(frame, (ped_x, ped_y - 15), 8, (255, 180, 100), -1) # head
        cv2.line(frame, (ped_x, ped_y - 7), (ped_x, ped_y + 10), (255, 180, 100), 2) # torso
        cv2.putText(frame, "P1", (px1, py1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 180, 100), 1, lineType=cv2.LINE_AA)
        
        # Draw Forklift (represented as a yellow-ish vehicle)
        f_w, f_h = 70, 50
        fx1, fy1 = fork_x - f_w//2, fork_y - f_h//2
        fx2, fy2 = fork_x + f_w//2, fork_y + f_h//2
        # Main body
        cv2.rectangle(frame, (fx1, fy1), (fx2, fy2), (0, 200, 230), -1)
        # Fork arms
        cv2.line(frame, (fx2, fy2 - 10), (fx2 + 20, fy2 - 10), (200, 200, 200), 3)
        cv2.line(frame, (fx2 + 20, fy2 - 10), (fx2 + 20, fy2 - 25), (200, 200, 200), 3)
        # Wheels
        cv2.circle(frame, (fork_x - 20, fy2), 10, (10, 10, 10), -1)
        cv2.circle(frame, (fork_x + 20, fy2), 10, (10, 10, 10), -1)
        cv2.putText(frame, "FL1", (fx1, fy1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 200, 230), 1, lineType=cv2.LINE_AA)
        
        out.write(frame)
        
    out.release()

def log_collision_incident(frame, frame_idx, track_id_1, track_id_2, class_1, class_2, dist, risk_level, evidence_dir, log_list, video_name):
    """
    Logs a forklift-pedestrian collision risk event, outputs console message,
    and saves an evidence snapshot at the risk transition point.
    """
    timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    event_id = f"{os.path.splitext(video_name)[0]}_f{frame_idx}_{track_id_1}_{track_id_2}"
    evidence_filename = f"risk_{timestamp_str}_{risk_level.lower()}_id{track_id_1}_id{track_id_2}.jpg"
    evidence_path = os.path.join(evidence_dir, evidence_filename)
    
    cv2.imwrite(evidence_path, frame)
    
    log_list.append({
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "event_id": event_id,
        "object_1_id": track_id_1,
        "object_1_class": class_1,
        "object_2_id": track_id_2,
        "object_2_class": class_2,
        "distance_pixels": float(round(dist, 2)),
        "risk_level": risk_level,
        "evidence_filename": evidence_filename,
        "frame_number": frame_idx,
        "video_name": video_name
    })
    
    print(f"[ALERT] {risk_level} COLLISION RISK: {class_1.upper()} (ID {track_id_1}) & {class_2.upper()} (ID {track_id_2}) | Distance: {dist:.1f}px | Saved snapshot: {evidence_filename}")

def display_collision_dashboard(outputs_dir, save_plot=True):
    """
    Loads forklift-pedestrian incident logs and saves/displays the telemetry analytics dashboard.
    """
    csv_path = os.path.join(outputs_dir, "incident_log.csv")
    summary_path = os.path.join(outputs_dir, "summary_stats.json")
    
    if not os.path.exists(csv_path) or os.path.getsize(csv_path) == 0:
        print("[ERROR] No incident log CSV found. Execute detection pipeline first.")
        return
        
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(f"[ERROR] Error loading incident log CSV: {e}")
        return
        
    print("\n" + "="*60)
    print("       FORKLIFT-PEDESTRIAN COLLISION RISK SYSTEM ANALYTICS")
    print("="*60)
    
    if os.path.exists(summary_path):
        try:
            with open(summary_path, 'r') as f:
                stats = json.load(f)
            print(f"Total Incidents Logged:      {stats.get('total_incidents', 0)}")
            print(f"Closest Proximity Encounter: {stats.get('closest_encounter_distance_px', 0.0):.1f} px")
            print(f"Total Warning Alerts:        {stats.get('total_warning_alerts', 0)}")
            print(f"Total Critical Alerts:       {stats.get('total_critical_alerts', 0)}")
        except Exception as e:
            print(f"Warning: Could not read summary_stats.json: {e}")
    else:
        print(f"Total Incidents Logged:      {len(df)}")
        if len(df) > 0:
            print(f"Closest Proximity Encounter: {df['distance_pixels'].min():.1f} px")
            print(f"Total Warning Alerts:        {len(df[df['risk_level'] == 'WARNING'])}")
            print(f"Total Critical Alerts:       {len(df[df['risk_level'] == 'CRITICAL'])}")
            
    print("="*60 + "\n")
    
    if len(df) == 0:
        return
        
    plt.ioff()
    fig, axes = plt.subplots(1, 2, figsize=(15, 6))
    
    # Plot 1: Alert Count by Risk Level
    risk_counts = df['risk_level'].value_counts()
    colors = ['#E06666' if x == 'CRITICAL' else '#F1C232' for x in risk_counts.index]
    axes[0].bar(risk_counts.index, risk_counts.values, color=colors, edgecolor='black', zorder=2)
    axes[0].set_title("Risk Alerts Count by Severity", fontsize=12, fontweight='bold')
    axes[0].set_xlabel("Risk Level", fontsize=10)
    axes[0].set_ylabel("Alert Count", fontsize=10)
    axes[0].grid(axis='y', linestyle='--', alpha=0.5, zorder=1)
    
    # Plot 2: Proximity Distance Log Timeline
    # Scatter plot: X: frame_number, Y: distance_pixels, Color: risk_level
    scatter_df = df.sort_values(by='frame_number')
    colors_map = {'CRITICAL': '#E06666', 'WARNING': '#F1C232', 'ZONE_VIOLATION': '#4A90E2'}
    
    for r_level in scatter_df['risk_level'].unique():
        sub_df = scatter_df[scatter_df['risk_level'] == r_level]
        axes[1].scatter(
            sub_df['frame_number'], 
            sub_df['distance_pixels'], 
            label=r_level,
            color=colors_map.get(r_level, '#777777'),
            edgecolors='black', 
            s=80,
            alpha=0.85,
            zorder=2
        )
        
    axes[1].set_title("Risk Event Proximity Distance Timeline", fontsize=12, fontweight='bold')
    axes[1].set_xlabel("Frame Number", fontsize=10)
    axes[1].set_ylabel("Centroid Distance (Pixels)", fontsize=10)
    axes[1].grid(True, linestyle='--', alpha=0.5, zorder=1)
    axes[1].legend(title="Risk Type")
    
    plt.tight_layout()
    if save_plot:
        plot_path = os.path.join(outputs_dir, "analytics_dashboard.png")
        plt.savefig(plot_path, dpi=150)
        print(f"[INFO] Saved analytics dashboard plot to: {plot_path}")
    plt.close(fig)
