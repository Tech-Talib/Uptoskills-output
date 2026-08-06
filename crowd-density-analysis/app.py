import cv2
from ultralytics import YOLO

# Load YOLOv8 model
model = YOLO("yolov8n.pt")

# Open video
cap = cv2.VideoCapture("input/videos/crowd.mp4")

if not cap.isOpened():
    print("Error: Could not open video!")
    exit()

while True:
    success, frame = cap.read()

    if not success:
        break

    # Detect only people
    results = model(
        frame,
        classes=[0],
        conf=0.20,
        imgsz=1280,
        verbose=False
    )

    # Draw bounding boxes
    annotated_frame = results[0].plot()

    # Count detected people
    people_count = len(results[0].boxes)

    # -------------------------------
    # Crowd Density Calculation
    # -------------------------------
    if people_count < 10:
        density = "LOW"
        color = (0, 255, 0)      # Green

    elif people_count < 20:
        density = "MEDIUM"
        color = (0, 255, 255)    # Yellow

    else:
        density = "HIGH"
        color = (0, 0, 255)      # Red

    # Display People Count
    cv2.putText(
        annotated_frame,
        f"People Count : {people_count}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (255, 255, 255),
        2
    )

    # Display Density
    cv2.putText(
        annotated_frame,
        f"Density : {density}",
        (20, 80),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        color,
        2
    )

    # High Density Alert
    if density == "HIGH":
        cv2.putText(
            annotated_frame,
            "ALERT : OVERCROWDED AREA!",
            (20, 120),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 0, 255),
            3
        )

    # Show Video
    cv2.imshow("Crowd Density Analysis", annotated_frame)

    # Press Q to Exit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()