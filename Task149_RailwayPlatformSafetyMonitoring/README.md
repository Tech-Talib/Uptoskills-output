# Railway Platform Safety Monitoring System

This project is a real-time, AI-based computer vision safety system designed to monitor railway platforms. It detects and tracks people, determines if they cross defined platform safety lines, generates real-time audio and visual alerts, captures evidence snapshots of violations, logs event details in a CSV report, and provides a Streamlit-based operator web dashboard.

---

## Key Features

1. **Dual Object Tracking Modes:**
   - **YOLOv8 ByteTrack (Deep Learning):** High-accuracy person tracking using YOLOv8 (with a monkeypatch to bypass PyTorch 2.6 `weights_only` compatibility issues).
   - **Contour & Centroid Fallback Tracker (Classical CV):** A lightweight tracker using MOG2 background subtraction and a centroid distance matching algorithm. This ensures the system runs perfectly even without internet, GPU, or PyTorch, making it extremely robust.
2. **Behavior Analysis:**
   - Detects when a tracked individual's contact point (bottom-center of bounding box) crosses the safety boundary.
   - Measures time spent in the danger zone and flags prolonged presence as a "Dwell Danger" violation.
   - Detects safe returns back to the platform.
3. **Auditory & Visual Alerts:**
   - Flashes a large warning banner on screen when active violations are detected.
   - Triggers asynchronous system beeps (`winsound.Beep` on Windows) upon violations to alert platform managers without lagging the video processing loop.
4. **Evidence Storage & CSV Logging:**
   - Automatically crops/captures violation frames and saves them as JPEGs in the `evidence/` directory.
   - Maintains a structured history of all events in `event_log.csv` (Timestamps, Track ID, Event Type, Duration in Danger, Snapshot Paths).
5. **Interactive Web Dashboard:**
   - Built with Streamlit, providing real-time feed rendering, interactive safety line adjustments, live alert feeds, a historical event viewer with export/clear features, and an evidence explorer to view snapshot cards.

---

## File Structure

- [config.py](file:///d:/Internship/Railway%20platform%20saftey%20monitoring/config.py): Holds global configurations including default safety line coords, thresholds, alert cooldowns, and directory paths.
- [synthetic_video_generator.py](file:///d:/Internship/Railway%20platform%20saftey%20monitoring/synthetic_video_generator.py): Generates a synthetic CCTV video `railway_platform_test.mp4` with a platform, tracks, safety line, and moving humanoid shapes. Used to test and verify the safety pipeline.
- [safety_monitor.py](file:///d:/Internship/Railway%20platform%20saftey%20monitoring/safety_monitor.py): The core processing pipeline. Loads frames, tracks objects, detects line crossings, triggers beep alerts, saves evidence, and writes output video/CSV.
- [app.py](file:///d:/Internship/Railway%20platform%20saftey%20monitoring/app.py): Streamlit web app providing a premium operator control center dashboard.
- [railway_safety_monitor.ipynb](file:///d:/Internship/Railway%20platform%20saftey%20monitoring/railway_safety_monitor.ipynb): Interactive Jupyter Notebook containing all system components in one document for easy testing and walkthrough visualization.
- [requirements.txt](file:///d:/Internship/Railway%20platform%20saftey%20monitoring/requirements.txt): List of python dependencies.

---

## Setup & Running Instructions

### 1. Prerequisites
Ensure you have Python 3.10+ installed. Install the required dependencies:
```bash
pip install -r requirements.txt
```

### 2. Generate the Test Video
Before running the monitor, generate the simulated railway platform video:
```bash
python synthetic_video_generator.py
```
This produces `railway_platform_test.mp4` in the project directory.

### 3. Run the Command-line Safety Pipeline
You can process the video using either the YOLO tracker or the Fallback Tracker.

**To run with YOLOv8:**
```bash
python safety_monitor.py --tracker yolo
```

**To run with Fallback Tracker (Ideal for synthetic video):**
```bash
python safety_monitor.py --tracker fallback
```

This will run the video pipeline, create the `evidence/` directory with JPEG snapshots, log events to `event_log.csv`, and produce `output_video.mp4`.

### 4. Launch the Operator Web Dashboard
To open the real-time visual dashboard, run:
```bash
streamlit run app.py
```
This will spin up a local server and open the dashboard in your web browser. From the dashboard you can:
- Toggle between **YOLOv8** and the **Fallback tracker**.
- Drag sliders to shift the safety boundary line dynamically in real-time.
- View live alerts, download CSV logs, and browse captured evidence snapshots.

### 5. Run the Interactive Jupyter Notebook
Alternatively, you can run the entire system in a single document using the Jupyter Notebook:
```bash
jupyter notebook railway_safety_monitor.ipynb
```
or open it inside **VS Code**. It features inline frame visualization, allowing you to watch the processed CCTV frames render directly inside the notebook.
