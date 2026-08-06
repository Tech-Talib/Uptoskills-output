"""
02_visualize_dataset.py
Shows sample images from the dataset with bounding boxes drawn.
Run after 01_download_dataset.py
"""

import os
import sys
import random
import cv2
import matplotlib.pyplot as plt

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from config import DATASETS_DIR

dataset_path = os.path.join(DATASETS_DIR, "Queue-Management-3")
images_path  = os.path.join(dataset_path, "train", "images")
labels_path  = os.path.join(dataset_path, "train", "labels")

if not os.path.exists(images_path):
    print("❌ Dataset not found. Run 01_download_dataset.py first.")
    exit()

all_images   = os.listdir(images_path)
sample_imgs  = random.sample(all_images, min(6, len(all_images)))

plt.figure(figsize=(15, 10))

for idx, img_name in enumerate(sample_imgs):
    img_path   = os.path.join(images_path, img_name)
    label_path = os.path.join(labels_path, img_name.rsplit(".", 1)[0] + ".txt")

    img = cv2.imread(img_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    h, w, _ = img.shape

    if os.path.exists(label_path):
        with open(label_path, "r") as f:
            for line in f.readlines():
                cls, x, y, bw, bh = map(float, line.strip().split())
                x1 = int((x - bw / 2) * w)
                y1 = int((y - bh / 2) * h)
                x2 = int((x + bw / 2) * w)
                y2 = int((y + bh / 2) * h)
                cv2.rectangle(img, (x1, y1), (x2, y2), (255, 0, 0), 2)
                cv2.putText(img, str(int(cls)), (x1, y1 - 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

    plt.subplot(2, 3, idx + 1)
    plt.imshow(img)
    plt.axis("off")
    plt.title(img_name[:25])

plt.tight_layout()
plt.savefig(os.path.join(DATASETS_DIR, "dataset_samples.png"))
plt.show()
print("✅ Sample visualization saved to Datasets/dataset_samples.png")
