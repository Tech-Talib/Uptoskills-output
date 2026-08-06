"""
01_download_dataset.py
Downloads the QueueIQ dataset from Roboflow into Datasets/ folder.
Run this ONCE before training.
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import DATASETS_DIR, create_output_dirs

create_output_dirs()

# ── Download from Roboflow ────────────────────────────────────────────
from roboflow import Roboflow

rf = Roboflow(api_key="AJ58FX0nomBK3iGOhzfp")

print("Downloading Queue Management dataset...")
project = rf.workspace("linemanagement").project("queue-management")
version = project.version(3)
dataset = version.download("yolov8", location=os.path.join(DATASETS_DIR, "Queue-Management-3"))
print("✅ Dataset 1 downloaded:", dataset.location)

print("\nDownloading QueueIQ dataset...")
project2 = rf.workspace("queueiq").project("queueiq")
version2 = project2.version(5)
dataset2 = version2.download("yolov8", location=os.path.join(DATASETS_DIR, "QueueIQ-5"))
print("✅ Dataset 2 downloaded:", dataset2.location)

print("\nDownloading Queue Length Detection dataset...")
project3 = rf.workspace("playerdetection74-op0pe").project("queue-length-detection-7nvhe")
version3 = project3.version(3)
dataset3 = version3.download("yolov8", location=os.path.join(DATASETS_DIR, "Queue-Length-3"))
print("✅ Dataset 3 downloaded:", dataset3.location)

print("\n✅ All datasets downloaded to:", DATASETS_DIR)
