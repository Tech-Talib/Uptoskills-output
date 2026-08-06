"""
03_train_model.py
Trains YOLOv8 on the QueueIQ dataset.
Saves best.pt to Models/ folder.
Run after 01_download_dataset.py
"""

import os
import sys
import shutil

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from config import (DATASETS_DIR, MODELS_DIR, TRAIN_EPOCHS,
                    TRAIN_IMGSZ, TRAIN_BATCH, TRAIN_DEVICE, create_output_dirs)

create_output_dirs()

from ultralytics import YOLO

data_yaml = os.path.join(DATASETS_DIR, "QueueIQ-5", "data.yaml")

if not os.path.exists(data_yaml):
    print("❌ Dataset not found. Run 01_download_dataset.py first.")
    exit()

print("Starting YOLOv8 Training...")
print(f"  Epochs : {TRAIN_EPOCHS}")
print(f"  Image  : {TRAIN_IMGSZ}")
print(f"  Batch  : {TRAIN_BATCH}")
print(f"  Device : {TRAIN_DEVICE}")

model = YOLO("yolov8n.pt")

results = model.train(
    data=data_yaml,
    epochs=TRAIN_EPOCHS,
    imgsz=TRAIN_IMGSZ,
    batch=TRAIN_BATCH,
    patience=10,
    pretrained=True,
    device=TRAIN_DEVICE,
    project=os.path.join(MODELS_DIR, "training_runs"),
    name="queueiq_run",
)

# Copy best weights to Models/best.pt for easy access
best_weights = os.path.join(
    MODELS_DIR, "training_runs", "queueiq_run", "weights", "best.pt"
)
dest = os.path.join(MODELS_DIR, "best.pt")

if os.path.exists(best_weights):
    shutil.copy(best_weights, dest)
    print(f"\n✅ Training complete!")
    print(f"   Best model saved to: {dest}")
else:
    print("\n⚠️  Training done but best.pt not found at expected path.")
    print(f"   Check: {MODELS_DIR}/training_runs/")
