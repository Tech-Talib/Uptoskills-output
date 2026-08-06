# Task 145: Forklift-Pedestrian Collision Risk Detection System

An AI-based computer vision system designed to detect, track, and analyze collision risks between forklifts and pedestrians in industrial or warehouse environments in real-time or from video feeds.

This system leverages **YOLOv8** for real-time object detection and integrates custom class-aware **Intersection-over-Union (IoU) Tracking** with predictive trajectory intersection heuristics and proximity checking. It provides warning alerts (proximity or path intersection) and generates evidence snapshots, event database reports, and an analytical dashboard.

---

## Key Features

1. **Object Detection**: Identifies pedestrians (`person` class) and forklifts (mapped from COCO classes like `truck` and `car` by default) using a pre-trained YOLOv8 model.
2. **Class-Aware IoU Tracking**: Tracks objects across frames to assign persistent IDs and compile centroid motion histories.
3. **Collision Risk Behavior Analysis**:
   - **Proximity Alerts**: Checks Euclidean pixel distance between forklift and pedestrian centroids. Alerts on warning distance violations (default $\leq 120$ px) and critical proximity (default $\leq 50$ px).
   - **Predictive Trajectory Warnings**: Calculates motion vectors based on recent centroid history. Projects positions $N$ frames into the future to predict overlapping paths, alerting on impending collisions with estimated Time-to-Collision (TTC) values.
   - **Warehouse Zone Monitoring**: Allows defining a custom polygonal zone (e.g. Forklift Operation Zone). Detects and logs when pedestrians enter this dangerous area.
4. **Interactive HUD overlays**: Renders bounding boxes (green for safe, yellow for warning, red for critical risk), persistent track paths, future trajectory projection lines, and a flashing top warning banner showing active hazards.
5. **Real-time Alerting & Evidence Logging**:
   - Saves evidence snapshot JPEGs at risk transition points.
   - Saves a structured CSV log of all proximity violations and trajectory intersection warnings.
   - Saves a summary statistics JSON file.
6. **Built-in Self-Test Mode**: Generates a synthetic test video showing a forklift and pedestrian crossing paths and runs the pipeline on it automatically.
7. **Analytics Dashboard**: Automatically compiles matplotlib trend graphs visualizing collision risk frequency, distance logs, and class incidents.

---

## Folder Architecture

The project workspace is structured as follows:

```text
forklift pedestrian collision risk detection/
├── .gitignore
├── README.md
└── Task145_ForkliftPedestrianCollisionRiskDetection/
    ├── notes.md                          # Logs results, test parameters, and performance stats
    ├── Code/
    │   ├── utils.py                      # Helper module (tracker, synthetic video generator, logging, dashboarding)
    │   ├── detect.py                     # Standalone CLI execution pipeline script
    │   └── forklift_pedestrian_collision_risk_detection.ipynb # Google Colab-compatible notebook
    ├── Models/
    │   └── yolov8n.pt                    # Pre-trained YOLOv8 weights (cloned or downloaded)
    └── Outputs/                          # Incident CSV logs, summary statistics, and dashboard
        ├── evidence_frames/              # JPG snapshots of detected collision hazards
        └── ...
```

---

## Getting Started

### 1. Installation

Ensure you have Python 3.8+ installed. Install the necessary libraries:

```bash
pip install ultralytics opencv-python pandas matplotlib numpy
```

### 2. Execution

To run the pipeline on a video file:

```bash
python Task145_ForkliftPedestrianCollisionRiskDetection/Code/detect.py --video <path_to_video>
```

You can customize safety thresholds and parameters via CLI flags:

```bash
# Set proximity warning to 150 pixels, critical risk to 60 pixels, and use a custom YOLO model
python Task145_ForkliftPedestrianCollisionRiskDetection/Code/detect.py --video my_warehouse.mp4 --warning_dist 150 --critical_dist 60 --model Models/yolov8s.pt
```

For a full list of configuration options, run:
```bash
python Task145_ForkliftPedestrianCollisionRiskDetection/Code/detect.py --help
```

### 3. Built-in Self-Test (No Input Video Needed)

You can run the system on programmatically generated synthetic test data to verify correctness:

```bash
python Task145_ForkliftPedestrianCollisionRiskDetection/Code/detect.py --test_mode
```

This will:
- Generate a test video named `synthetic_test.mp4` under the `Code/` folder.
- Execute the detection, tracking, proximity, and predictive warning logic.
- Output annotated frames to `Outputs/synthetic_test_annotated.mp4`.
- Log events to `Outputs/incident_log.csv` and snapshot evidence to `Outputs/evidence_frames/`.
- Compile `Outputs/summary_stats.json` and generate `Outputs/analytics_dashboard.png`.

---

### 4. Jupyter Notebook

Upload `Task145_ForkliftPedestrianCollisionRiskDetection/Code/forklift_pedestrian_collision_risk_detection.ipynb` to Google Colab, mount Google Drive, and follow the step-by-step cells to execute the pipeline on your own industrial videos.
