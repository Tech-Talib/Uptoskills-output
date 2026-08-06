import streamlit as st
import cv2
import pandas as pd
import numpy as np
import os
import time
import datetime
import tempfile
import importlib
import config
import safety_monitor
importlib.reload(safety_monitor)
from safety_monitor import SafetyMonitor, CentroidTracker

# Set page config
st.set_page_config(
    page_title="Railway Platform Safety Monitor",
    page_icon="🚉",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for premium styling
st.markdown("""
<style>
    .main {
        background-color: #0e1117;
        color: #ffffff;
    }
    .metric-card {
        background-color: #1f2937;
        padding: 20px;
        border-radius: 10px;
        border: 1px solid #374151;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        text-align: center;
    }
    .alert-header {
        font-weight: bold;
        color: #ef4444;
        animation: blinker 1.5s linear infinite;
    }
    @keyframes blinker {
        50% { opacity: 0; }
    }
</style>
""", unsafe_allow_html=True)

# App Title & Subtitle
st.title("🚉 Railway Platform Safety Monitoring System")
st.markdown("### *AI-Based Computer Vision & Safety Line Violation Detection*")
st.markdown("---")

# Initialize session states
if "streaming" not in st.session_state:
    st.session_state.streaming = False
if "alerts" not in st.session_state:
    st.session_state.alerts = []

# Sidebar configuration
st.sidebar.header("🛠️ System Configuration")

# Video source selection
video_source_type = st.sidebar.radio(
    "Select Video Source",
    ["Synthetic Test Video", "Upload Custom Video"]
)

video_path = None
if video_source_type == "Synthetic Test Video":
    video_path = config.DEFAULT_VIDEO_INPUT
    # Generate synthetic video if not existing
    if not os.path.exists(video_path):
        with st.sidebar.status("Generating synthetic test video..."):
            from synthetic_video_generator import generate_video
            generate_video(video_path)
else:
    uploaded_file = st.sidebar.file_uploader("Upload video file (MP4, AVI)", type=["mp4", "avi", "mov"])
    if uploaded_file is not None:
        tfile = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
        tfile.write(uploaded_file.read())
        video_path = tfile.name
        tfile.close()

# Tracker selection
tracker_type = st.sidebar.selectbox(
    "Object Tracking Model",
    [
        "YOLOv8 Small (yolov8s.pt - High Person Detection Accuracy)",
        "YOLOv8 Nano (yolov8n.pt - Lightweight Deep Learning)",
        "Fallback Contour Tracker (Lightweight CV)"
    ]
)
use_yolo = "YOLOv8" in tracker_type
yolo_model_file = "yolov8s.pt" if "Small" in tracker_type else "yolov8n.pt"

# Confidence threshold (only for YOLO)
if use_yolo:
    conf_threshold = st.sidebar.slider("YOLO Detection Confidence Threshold", 0.05, 1.0, float(config.CONFIDENCE_THRESHOLD), 0.05, help="Lower value (e.g. 0.15 - 0.25) increases detection sensitivity for small/distant people in CCTV videos.")
else:
    conf_threshold = 0.25 # Default dummy

# Safety Line Coordinates config
st.sidebar.subheader("📐 Safety Line Position")
line_orientation = st.sidebar.selectbox("Line Orientation", ["Vertical Boundary", "Horizontal Boundary", "Custom Angled Line"])

if line_orientation == "Vertical Boundary":
    line_x = st.sidebar.slider("Line X position", 50, config.FRAME_WIDTH - 50, int(config.DEFAULT_LINE_COORDS[0][0]), 10)
    line_coords = ((line_x, 0), (line_x, config.FRAME_HEIGHT))
    safe_direction = st.sidebar.selectbox("Safe Side", ["left", "right"], index=0 if config.SAFE_SIDE == "left" else 1)
elif line_orientation == "Horizontal Boundary":
    line_y = st.sidebar.slider("Line Y position", 50, config.FRAME_HEIGHT - 50, int(config.FRAME_HEIGHT // 2), 10)
    line_coords = ((0, line_y), (config.FRAME_WIDTH, line_y))
    safe_direction = st.sidebar.selectbox("Safe Side", ["top", "bottom"], index=0)
else: # Custom Angled Line
    col_l1, col_l2 = st.sidebar.columns(2)
    with col_l1:
        x1 = st.slider("Start X", 0, config.FRAME_WIDTH, 750, 10)
        y1 = st.slider("Start Y", 0, config.FRAME_HEIGHT, 0, 10)
    with col_l2:
        x2 = st.slider("End X", 0, config.FRAME_WIDTH, 750, 10)
        y2 = st.slider("End Y", 0, config.FRAME_HEIGHT, config.FRAME_HEIGHT, 10)
    line_coords = ((x1, y1), (x2, y2))
    safe_direction = st.sidebar.selectbox("Safe Side", ["left", "right", "top", "bottom"], index=0)

# Audio Alert Settings
st.sidebar.subheader("🔊 Alert Settings")
audio_alerts = st.sidebar.checkbox("Trigger Audio Beeps", value=config.AUDIO_ALERT_ENABLED)
config.AUDIO_ALERT_ENABLED = audio_alerts

# Main App Layout: Split into Tabs
tab1, tab2, tab3, tab4 = st.tabs([
    "🖥️ Live Stream Feed", 
    "📊 Analytics Dashboard", 
    "📷 Stored Evidence snapshots", 
    "📋 Detailed Event Logs"
])

# Utility function to load and parse events
def get_events_df():
    if os.path.exists(config.EVENT_LOG_PATH):
        try:
            return pd.read_csv(config.EVENT_LOG_PATH)
        except Exception:
            return pd.DataFrame()
    return pd.DataFrame()

# Tab 1: Live Stream Monitor
with tab1:
    col_left, col_right = st.columns([2, 1])
    
    with col_left:
        st.subheader("CCTV Live Monitor Feed")
        
        # Start/Stop buttons
        btn_col1, btn_col2 = st.columns(2)
        with btn_col1:
            if st.button("▶️ Start Monitoring Stream", use_container_width=True):
                st.session_state.streaming = True
        with btn_col2:
            if st.button("⏹️ Stop Stream", use_container_width=True):
                st.session_state.streaming = False
                
        # Image placeholder
        frame_placeholder = st.empty()
        
        if not st.session_state.streaming:
            preview_img = None
            if video_path is not None and os.path.exists(video_path):
                try:
                    cap_prev = cv2.VideoCapture(video_path)
                    ret_prev, frame_prev = cap_prev.read()
                    cap_prev.release()
                    if ret_prev and frame_prev is not None:
                        preview_img = cv2.resize(frame_prev, (config.FRAME_WIDTH, config.FRAME_HEIGHT))
                except Exception:
                    preview_img = None
            
            if preview_img is None:
                preview_img = np.zeros((config.FRAME_HEIGHT, config.FRAME_WIDTH, 3), dtype=np.uint8)
                preview_img[:, :] = [30, 30, 30]
                if video_source_type == "Upload Custom Video" and uploaded_file is None:
                    cv2.putText(preview_img, "PLEASE UPLOAD A VIDEO FILE FROM THE SIDEBAR", (180, 340), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (200, 200, 200), 2)
                else:
                    cv2.putText(preview_img, "STREAM OFF: CLICK START MONITORING", (250, 340), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
            
            # Draw safety line preview on actual video frame
            cv2.line(preview_img, line_coords[0], line_coords[1], (0, 215, 255), 4)
            cv2.circle(preview_img, line_coords[0], 6, (0, 255, 255), -1)
            cv2.circle(preview_img, line_coords[1], 6, (0, 255, 255), -1)
            
            # Labels
            cv2.putText(preview_img, f"Safety Line ({safe_direction.upper()} side is SAFE)", (30, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 215, 255), 2)
            
            frame_placeholder.image(preview_img, channels="BGR", use_container_width=True)
            
    with col_right:
        st.subheader("⚠️ Real-Time Alerts")
        alerts_container = st.empty()
        
        # Draw metric summaries
        st.subheader("Live Frame Info")
        stat_active = st.empty()
        stat_violations = st.empty()

    # Active Stream Processing
    if st.session_state.streaming and video_path is not None:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            st.error(f"Could not open video source: {video_path}")
            st.session_state.streaming = False
        else:
            is_synthetic = "Synthetic" in video_source_type
            monitor = SafetyMonitor(use_yolo=use_yolo, model_path=yolo_model_file, conf_thresh=conf_threshold, is_synthetic=is_synthetic)
            
            # FPS calculation helper
            fps = cap.get(cv2.CAP_PROP_FPS)
            if fps == 0:
                fps = 30.0
            
            st.session_state.alerts = [] # Clear live log on start
            
            while cap.isOpened() and st.session_state.streaming:
                ret, frame = cap.read()
                if not ret:
                    st.info("Video playback completed.")
                    st.session_state.streaming = False
                    break
                    
                # Process frame
                processed = monitor.process_frame(frame, line_coords=line_coords, safe_side=safe_direction)
                
                # Render video frame
                frame_placeholder.image(processed, channels="BGR", use_container_width=True)
                
                # Retrieve active details
                active_violations = sum(1 for state in monitor.track_states.values() if state["in_danger"])
                active_tracked = len(monitor.track_states)
                
                stat_active.metric("Active People Tracked", active_tracked)
                stat_violations.metric("Active Violations", active_violations, 
                                       delta=f"+{active_violations}" if active_violations > 0 else "0",
                                       delta_color="inverse")
                
                # Load latest logged events to show in alert feed
                df_events = get_events_df()
                if not df_events.empty:
                    # Get recent events (last 5)
                    recent_events = df_events.tail(6).to_dict('records')
                    recent_events.reverse()
                    
                    with alerts_container.container():
                        for event in recent_events:
                            ev_type = event["Event Type"]
                            tk_id = event["Track ID"]
                            t_stamp = event["Timestamp"].split(" ")[1] # Just show HH:MM:SS
                            dur = event["Duration in Danger Zone (s)"]
                            
                            if ev_type == "Line Crossing":
                                st.error(f"🚨 [{t_stamp}] ID {tk_id} crossed the safety line!")
                            elif ev_type == "Dwell Danger":
                                st.warning(f"⏳ [{t_stamp}] ID {tk_id} DWELL WARNING: In tracks for {dur}s!")
                            elif ev_type == "Safe Return":
                                st.success(f"✔️ [{t_stamp}] ID {tk_id} returned safely after {dur}s.")
                
                # Sleep to mimic real-time playback
                time.sleep(1.0 / fps)
                
            cap.release()

# Tab 2: Analytics Dashboard
with tab2:
    st.subheader("📈 Platform Violations Analytics")
    
    df_events = get_events_df()
    if df_events.empty:
        st.info("No safety events logged yet. Start monitoring to gather analytics.")
    else:
        # Group stats
        crossings = df_events[df_events["Event Type"] == "Line Crossing"]
        dwells = df_events[df_events["Event Type"] == "Dwell Danger"]
        returns = df_events[df_events["Event Type"] == "Safe Return"]
        
        unique_violators = df_events["Track ID"].nunique()
        total_violations = len(crossings)
        total_dwell_warnings = len(dwells)
        
        # Summary row
        col_m1, col_m2, col_m3, col_m4 = st.columns(4)
        with col_m1:
            st.metric("Total Line Crossings", total_violations)
        with col_m2:
            st.metric("Total Dwell Alarms", total_dwell_warnings)
        with col_m3:
            st.metric("Unique Violators Tracked", unique_violators)
        with col_m4:
            avg_dwell = returns["Duration in Danger Zone (s)"].mean()
            st.metric("Avg Dwell Time", f"{avg_dwell:.1f}s" if not np.isnan(avg_dwell) else "N/A")
            
        # Graphical views
        st.markdown("### Visualization")
        col_chart1, col_chart2 = st.columns(2)
        
        with col_chart1:
            st.write("#### Event Types Breakdown")
            event_counts = df_events["Event Type"].value_counts().reset_index()
            event_counts.columns = ["Event Type", "Count"]
            st.bar_chart(event_counts.set_index("Event Type"))
            
        with col_chart2:
            st.write("#### Violations by Passenger ID")
            if not crossings.empty:
                violator_counts = crossings["Track ID"].value_counts().reset_index()
                violator_counts.columns = ["Passenger ID", "Line Crossings"]
                # Convert ID to string for better display on chart axis
                violator_counts["Passenger ID"] = violator_counts["Passenger ID"].astype(str)
                st.bar_chart(violator_counts.set_index("Passenger ID"))
            else:
                st.text("No crossings to show.")

# Tab 3: Stored Evidence Explorer
with tab3:
    st.subheader("📸 Stored Evidence Snapshots")
    df_events = get_events_df()
    
    # Filter only events that generated snapshots
    snap_events = df_events[df_events["Snapshot Path"].notna() & (df_events["Snapshot Path"] != "")].copy()
    
    if snap_events.empty:
        st.info("No evidence snapshots captured yet.")
    else:
        # Reverse to show newest snapshots first
        snap_events = snap_events.iloc[::-1]
        
        # Grid layout for snapshots
        cols_per_row = 3
        snap_list = snap_events.to_dict('records')
        
        # Paginate or crop list to show last 12 snapshots to avoid UI bloat
        max_snaps = 12
        displayed_snaps = snap_list[:max_snaps]
        
        if len(snap_list) > max_snaps:
            st.warning(f"Showing newest {max_snaps} of {len(snap_list)} snapshots.")
            
        for i in range(0, len(displayed_snaps), cols_per_row):
            row_cols = st.columns(cols_per_row)
            for j in range(cols_per_row):
                idx = i + j
                if idx < len(displayed_snaps):
                    item = displayed_snaps[idx]
                    path = item["Snapshot Path"]
                    
                    with row_cols[j]:
                        if os.path.exists(path):
                            st.image(path, caption=f"ID {item['Track ID']} - {item['Event Type']} ({item['Timestamp']})", use_container_width=True)
                            
                            # Expand button for info
                            with st.expander("Details"):
                                st.write(f"**Timestamp:** {item['Timestamp']}")
                                st.write(f"**Track ID:** {item['Track ID']}")
                                st.write(f"**Event Type:** {item['Event Type']}")
                                st.write(f"**Time in tracks:** {item['Duration in Danger Zone (s)']}s")
                                st.write(f"**File Path:** `{path}`")
                        else:
                            st.error(f"Snapshot file not found: `{path}`")

# Tab 4: Detailed Event Logs
with tab4:
    st.subheader("📋 Platform Safety Event log")
    df_events = get_events_df()
    
    if df_events.empty:
        st.info("Event log is empty. Events will populate here after safety stream processes frame violations.")
    else:
        # Show table
        st.dataframe(df_events, use_container_width=True)
        
        # Export options
        csv_data = df_events.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="📥 Export Event Log CSV",
            data=csv_data,
            file_name=f"railway_safety_log_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            mime="text/csv",
            use_container_width=True
        )
        
        # Clear log option (destructive action)
        st.markdown("---")
        if st.button("🗑️ Clear Historical Event Database"):
            if os.path.exists(config.EVENT_LOG_PATH):
                os.remove(config.EVENT_LOG_PATH)
            # Remove all snapshots
            for filename in os.listdir(config.EVIDENCE_DIR):
                f_path = os.path.join(config.EVIDENCE_DIR, filename)
                if os.path.isfile(f_path):
                    try:
                        os.remove(f_path)
                    except Exception:
                        pass
            st.success("Event database and evidence snapshots have been wiped!")
            st.rerun()
