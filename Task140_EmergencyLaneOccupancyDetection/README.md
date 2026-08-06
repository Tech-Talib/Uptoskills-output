# Emergency Lane Occupancy Detection System

An AI-based computer vision system designed to detect and track unauthorized vehicles occupying emergency lanes in real-time or from recorded video files. The system uses a pre-trained YOLO object detector and ByteTrack tracker to identify objects and track their paths, performing polygon containment checks to flag violations, save evidence snapshots, and maintain a detailed event log.

---

## Key Features
- **Object Detection & Tracking**: Employs YOLO (v8/v11) and ByteTrack/BoT-SORT to detect and track cars, trucks, buses, motorcycles, and pedestrians.
- **Dynamic Region of Interest (ROI)**: Supports configurable multi-point polygon coordinates to fit any highway lane layout.
- **Temporal Verification**: Requires a vehicle to stay within the lane for a minimum number of frames before triggering an alert, minimizing false positives from transient lane-changes.
- **Evidence Management**: Automatically crops and saves snapshots of violating vehicles with overlay indicators (track ID, vehicle class, timestamp) to an `evidence/` folder.
- **Structured Reporting**: Exports a comprehensive CSV file logging all violations (Track ID, vehicle class, arrival timestamp, departure timestamp, violation duration, snapshot path).
- **Rich Visualization**: Generates an annotated output video showing the emergency lane boundary (color-coded: green when empty, red when occupied) and the bounding boxes of offending vehicles.

---

## Installation & Setup

1. **Create and Activate a Virtual Environment (Recommended)**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Verify CUDA availability (Optional for GPU speedup)**
   If you have an Nvidia GPU and want to run YOLO on CUDA:
   ```bash
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
   ```

---

## Quick Start Guide

1. **Launch Jupyter Notebook**
   ```bash
   jupyter notebook
   ```
   Open [emergency_lane_detection.ipynb](file:///d:/Internship/Emergency%20Lane%20Occupancy%20Detection/emergency_lane_detection.ipynb) in your browser.

2. **Configure your Paths and Settings**
   In the second cell of the notebook, configure the input video path and other options:
   ```python
   VIDEO_PATH = "path/to/your/input_video.mp4"
   OUTPUT_VIDEO_PATH = "output_video_annotated.mp4"
   ROI_POLYGON = [(x1, y1), (x2, y2), (x3, y3), (x4, y4)]  # Coordinates of the emergency lane
   ```

3. **Select the Emergency Lane ROI**
   The notebook includes an interactive OpenCV window tool. Run this cell to load the first frame of your video, click the vertices of the emergency lane, and press `Enter` to output the exact coordinates to copy into your config.

4. **Run the Pipeline**
   Run the processing loop. It will show a progress bar and save the results dynamically.

5. **Examine Outputs**
   - **Annotated Video**: Saved at your specified output path.
   - **Evidence Snapshots**: Saved in the `evidence/` directory.
   - **CSV Report**: Saved in the workspace (e.g., `occupancy_report.csv`).

---

## Logic & Behavior Analysis

### 1. Detection & Tracking
We run YOLO in tracking mode. This ensures that every vehicle receives a persistent `track_id`. Tracking helps us distinguish between a single vehicle staying in the lane for $100$ frames versus $100$ different vehicles briefly passing through the lane.

### 2. Point-in-Polygon Check
The vehicle's bottom-center point represents its contact point with the road surface. We check whether this point lies within the polygon defined by `ROI_POLYGON` using:
- **OpenCV's `cv2.pointPolygonTest`** (fast and simple), or
- **Shapely's `Polygon.contains(Point)`** (geometrically robust).

### 3. Alert Logic & False Alarm Mitigation
- **Transient Check**: If a car touches the emergency lane for a single frame (e.g., swerving slightly), we don't trigger a violation immediately. A counter counts the consecutive frames the vehicle is detected inside the ROI. Once this exceeds `MIN_VIOLATION_FRAMES` (e.g., 15-30 frames, or ~1 second of video), it is marked as a **confirmed violation**.
- **Alert State**: When a violation is confirmed, an alert is printed, the ROI overlay turns red, and the snapshot is captured.
- **Reporting**: The entry timestamp is recorded when the violation is first confirmed, and the departure timestamp is logged when the vehicle leaves the ROI or the video ends.
