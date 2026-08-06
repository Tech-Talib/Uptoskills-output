<img width="1280" height="720" alt="image" src="https://github.com/user-attachments/assets/d14f923c-3ace-4447-a6ea-4f868f195449" /># AI-Based-Traffic-Congestion-Level-Estimation-System

# 🚦 AI-Based Traffic Congestion Level Estimation System

**Real-time traffic congestion estimation from CCTV video** using **YOLOv8 + ByteTrack**.

| Feature | Implementation |
|---|---|
| Detection | YOLOv8s (Ultralytics) — Car, Bus, Truck, Motorcycle, Bicycle only |
| Tracking | ByteTrack (via `supervision`) — persistent unique IDs, occlusion handling |
| ROI | User-defined polygon — only vehicles inside ROI are analyzed |
| Congestion | 3 levels: 🟢 LOW / 🟡 MEDIUM / 🔴 HIGH (configurable thresholds) |
| Alerts | HIGH-congestion alerts with de-duplication + evidence snapshots |
| Outputs | Annotated MP4 · CSV report · Evidence JPGs · Console summary |

**How to use:**
1. Run all cells top-to-bottom (`Runtime → Run all`).
2. Upload your CCTV `.mp4` when prompted (or a sample video is downloaded automatically).
3. Optionally adjust the ROI polygon and congestion thresholds in the **Configuration** cell.
4. Collect results from the `Project/Outputs/` folder.

> 💡 For best speed: `Runtime → Change runtime type → GPU (T4)`.
> [Uploading image.png…]()


---
## ✅ Verification Checklist

| Requirement | Where implemented |
|---|---|
| CCTV video input (upload / sample / webcam) | Section 4 |
| YOLOv8s detection — 5 vehicle classes only | `detect_objects()` |
| ByteTrack tracking — unique IDs, occlusion buffer, no duplicate counts | `track_objects()` + unique-ID sets |
| ROI polygon filtering + on-video display | `filter_roi()`, `draw_roi()` |
| Per-class + total + in-ROI vehicle counting | Section 10, step 4 |
| Congestion levels (configurable 0–15 / 16–30 / >30) | `estimate_congestion()` |
| Live analytics (density, FPS, timestamp, frame no.) | `draw_dashboard()` |
| HIGH-congestion alerts, de-duplicated per event | `AlertManager` |
| Evidence snapshots with metadata → `Evidence/` | `save_snapshot()` |
| CSV report with all required columns | `save_csv()` |
| Annotated MP4 at input resolution | `write_output_video()` |
| GPU/CUDA auto-detect + FP16 + frame skipping | Sections 2 & 5 |
| Error handling (missing video/model, bad format, corrupt frames, empty detections) | throughout |
| Final console summary | `main()` |
