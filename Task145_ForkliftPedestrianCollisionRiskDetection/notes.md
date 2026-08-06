# Task 145: AI-Based Forklift-Pedestrian Collision Risk Detection System

## Task Overview

This project implements a robust **Forklift-Pedestrian Collision Risk Detection System** designed to monitor industrial warehouses or factory floors. It integrates:
1. **YOLOv8** for real-time detection of pedestrians (`person`) and forklifts (mapped from COCO classes like `truck` or `car`).
2. **Class-Aware IoU Tracker** to maintain persistent object IDs and historical trajectories.
3. **Proximity and Spatial Zone Analysis**:
   - **Proximity Alerts**: Evaluates Euclidean pixel distance between forklift and pedestrian centroids. Alerts are categorized into Warning (default $\leq 120$ px) and Critical (default $\leq 50$ px) risks.
   - **Predictive Trajectory Projections**: Computes current track velocity vectors and projects future object paths up to 30 frames ahead to estimate Time-to-Collision (TTC) and raise preemptive warnings for intersecting trajectories.
   - **Safety Zone Violation**: Tracks intrusions into a custom polygonal Forklift Operation Area.
4. **Visual Overlays (HUD)**: Displays dynamic bounding boxes (color-coded by risk level), track path histories, future trajectory arrows, and a flashing notification banner at the top of the frame for active incidents.
5. **Incident Reports & Telemetry Log**: Logs events to a structured CSV file, writes summary metrics JSON, saves evidence JPEG snapshots at severity transition points, and compiles an analytical dashboard.

---

## Folder Architecture & Alignment

In accordance with internship guidelines, the project workspace is structured as follows:

```text
Task145_ForkliftPedestrianCollisionRiskDetection/
├── Code/
│   ├── detect.py                   # Standalone CLI execution script
│   ├── utils.py                    # Helper module (frame reader, tracker, logging, dashboarding, self-test generator)
│   └── forklift_pedestrian_collision_risk_detection.ipynb # Google Colab Jupyter Notebook
├── Models/
│   └── yolov8n.pt                  # Pre-trained YOLOv8 weights (6.2 MB)
├── Outputs/
│   ├── synthetic_test_annotated.mp4 # Processed output video in self-test mode (3 incidents)
│   ├── incident_log.csv            # Structured CSV database log of incidents (3 rows)
│   ├── summary_stats.json          # Overall summary statistics JSON
│   ├── analytics_dashboard.png     # Rendered Matplotlib dashboard plots
│   └── evidence_frames/            # JPEG snapshots saved at risk transition points
│       ├── risk_20260714_221048_warning_id2_id1.jpg
│       ├── risk_20260714_221048_zone_violation_id1_id-1.jpg
│       └── risk_20260714_221048_critical_id2_id1.jpg
└── notes.md                        # Task notes and outcomes log (this file)
```

---

## Verification & Execution Outcomes

The pipeline was successfully validated using the built-in synthetic self-test mode:

### 1. Execution Command:
```bash
python Task145_ForkliftPedestrianCollisionRiskDetection/Code/detect.py --test_mode
```

### 2. Video Properties (Synthetic Self-Test):
- **Resolution**: 768x432 pixels
- **Frame Rate**: 25.00 FPS
- **Length**: 150 frames
- **Camera Setup**: Stationary Warehouse Floor camera mapping a custom safety zone `[(100, 320), (350, 150), (600, 150), (680, 320)]`.

### 3. Verification Logs:
- **Frame 5**: Proximity warning triggered at distance 119.2px. Forklift FL1 (ID 2) and Pedestrian P1 (ID 1) are approaching each other.
  - *Saved snapshot*: `Outputs/evidence_frames/risk_20260714_221048_warning_id2_id1.jpg`.
- **Frame 50**: Zone Violation warning triggered. Pedestrian P1 (ID 1) walks into the Forklift Operation Area.
  - *Saved snapshot*: `Outputs/evidence_frames/risk_20260714_221048_zone_violation_id1_id-1.jpg`.
- **Frame 53**: Critical Collision Risk warning triggered at distance 49.5px. FL1 (ID 2) and P1 (ID 1) are in close proximity.
  - *Saved snapshot*: `Outputs/evidence_frames/risk_20260714_221048_critical_id2_id1.jpg`.

### 4. Metrics Output:
- **Total Incidents**: 3 logged events.
- **Closest Proximity Encounter**: 5.5 px (at peak crossover point).
- **Average Incident Distance**: 56.24 px.
- **Pipeline Speed**: ~341.76 FPS (ground-truth tracker execution on CPU).
- **Annotated Video**: Successfully generated visual overlays with colored bounding boxes, track lines, future arrows, and HUD warnings.
- **Analytics Dashboard**: Rendered dashboard containing:
  - Bar chart showing alert count by severity level (WARNING, CRITICAL, ZONE_VIOLATION).
  - Proximity timeline scatter showing frame number vs. encounter distance.

### Real CCTV Footage Validation (Near-Miss Video)

To test the system on real-world warehouse surveillance footage rather than 3D animated or synthetic sequences, the pipeline was executed on a real CCTV recording containing forklift-pedestrian interactions.

#### 1. Execution Command:
```bash
python Task145_ForkliftPedestrianCollisionRiskDetection/Code/detect.py --video Task145_ForkliftPedestrianCollisionRiskDetection/Code/real_cctv_test_nearmiss.mp4 --conf 0.3
```

#### 2. Video Properties:
- **Source**: Real warehouse surveillance camera (CCTV) containing moving forklifts and active walking pedestrians.
- **Resolution**: 640x360 pixels
- **Frame Rate**: 25.00 FPS
- **Length**: 439 frames (~17.5 seconds)
- **Safety Zone**: Default polygonal zone `[(100, 320), (350, 150), (600, 150), (680, 320)]`.

#### 3. Execution Logs & Detection Performance:
- **Object Recognition**: YOLOv8 successfully recognized pedestrians (`person`) and mapped forklift objects (detected via COCO `car` and `truck` classes).
- **Persistent Tracking**: The class-aware IoU tracker successfully maintained persistent IDs for active forklifts and pedestrians across frames.
- **Encounter Summaries**:
  - **Zone Violations**: Multiple pedestrians (such as IDs 55, 56, 58, 77) walked into the designated active forklift safety zone, triggering immediate `ZONE_VIOLATION` notifications.
  - **Proximity Alerts**: System logged warning proximity alerts (between 50px and 120px) and critical collision alerts (distance $\leq 50$ px), e.g., Forklift ID 59 and Pedestrian ID 58 at 45.8px distance in frame 198.
  - **Predictive Trajectory Projection**: Projected future velocities 30 frames ahead to flag intersecting paths.

#### 4. Metrics Output (Combined & Real-World Footage):
- **Total Combined Incidents**: 73 events.
- **Closest Encounter Distance**: 8.0 px.
- **Total Warning Alerts**: 53.
- **Total Critical Alerts**: 17.
- **Average Incident Distance**: 72.57 px.
- **Pipeline Processing Speed**: ~15.95 FPS (YOLOv8 inference and tracking on CPU).
- **Annotated Output Video**: Successfully generated `Outputs/real_cctv_test_nearmiss_annotated.mp4` showing bounding box indicators, trace history, direction vectors, warning banners, and zone overlays.
- **Updated Dashboard**: Compiles risk severity bar charts and a frame-by-frame proximity scatter plot.

---

## How to Run


### Standalone CLI Execution
To execute the pipeline on your own video file:
```bash
# Basic run with defaults
python Task145_ForkliftPedestrianCollisionRiskDetection/Code/detect.py --video <path_to_video>

# Custom thresholds run
python Task145_ForkliftPedestrianCollisionRiskDetection/Code/detect.py --video my_warehouse.mp4 --warning_dist 150 --critical_dist 60 --conf 0.4
```

### Google Colab Notebook
Upload `Task145_ForkliftPedestrianCollisionRiskDetection/Code/forklift_pedestrian_collision_risk_detection.ipynb` to Google Colab, mount Drive, specify input file, and run.
