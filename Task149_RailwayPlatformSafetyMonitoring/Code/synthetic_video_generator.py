import cv2
import numpy as np
import os
import config

def create_background():
    # Create empty image
    bg = np.zeros((config.FRAME_HEIGHT, config.FRAME_WIDTH, 3), dtype=np.uint8)
    
    # 1. Platform Area (Left side) - Light Gray
    bg[:, :750] = [180, 180, 180]
    
    # Platform tiles pattern (grid lines)
    for x in range(100, 750, 100):
        cv2.line(bg, (x, 0), (x, config.FRAME_HEIGHT), (160, 160, 160), 1)
    for y in range(100, config.FRAME_HEIGHT, 100):
        cv2.line(bg, (0, y), (750, y), (160, 160, 160), 1)
        
    # 2. Track Bed (Right side) - Dark Brownish Gray
    bg[:, 750:] = [45, 50, 55]
    
    # Railroad ties (wooden planks)
    for y in range(20, config.FRAME_HEIGHT, 40):
        cv2.rectangle(bg, (800, y), (1200, y + 15), (30, 40, 50), -1)
        
    # Steel rails (two vertical steel beams)
    cv2.line(bg, (880, 0), (880, config.FRAME_HEIGHT), (120, 120, 130), 8)
    cv2.line(bg, (1120, 0), (1120, config.FRAME_HEIGHT), (120, 120, 130), 8)
    
    # 3. Yellow Safety Line (Border between platform and track bed)
    # Drawing it at x = 750, yellow color (0, 255, 255)
    cv2.line(bg, (750, 0), (750, config.FRAME_HEIGHT), (0, 215, 255), 10)
    
    # Text marking platform and track area
    cv2.putText(bg, "PASSENGER PLATFORM", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (80, 80, 80), 2)
    cv2.putText(bg, "TRACK ZONE (DANGER)", (800, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 200), 2)
    
    return bg

def draw_person(img, center, color, label):
    cx, cy = center
    #torso (ellipse)
    cv2.ellipse(img, (cx, cy + 20), (20, 30), 0, 0, 360, color, -1)
    # head
    cv2.circle(img, (cx, cy - 20), 15, (220, 200, 180), -1) # skin tone
    # hair / cap
    cv2.circle(img, (cx, cy - 25), 15, color, -1, cv2.LINE_AA)
    # Draw label text above head
    cv2.putText(img, label, (cx - 25, cy - 45), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)
    cv2.putText(img, label, (cx - 25, cy - 45), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

def generate_video(output_path, num_frames=300):
    print(f"Generating synthetic video at: {output_path}")
    bg_base = create_background()
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, 30.0, (config.FRAME_WIDTH, config.FRAME_HEIGHT))
    
    # Define movement paths for simulated people
    # P1 (Safe Walker): Walks in safe area (x: 200 -> 450 -> 200)
    # P2 (Line Crosser): Walks from (300, 350) -> crosses line -> (950, 380) -> walks back
    # P3 (Standing Near Edge): Stands at (710, 200), pacing slightly
    # P4 (Fast Crosser): Enters later, runs across line, runs back
    
    for frame_idx in range(num_frames):
        img = bg_base.copy()
        
        # Calculate positions
        # P1 (Safe)
        p1_x = int(300 + 150 * np.sin(2 * np.pi * frame_idx / 150))
        p1_y = int(250 + 50 * np.cos(2 * np.pi * frame_idx / 150))
        draw_person(img, (p1_x, p1_y), (200, 50, 50), "P1 (Safe)")
        
        # P2 (Crosser)
        # Starts walking towards tracks, crosses around frame 60, stays, starts returning around frame 200
        if frame_idx < 90:
            # Walking to tracks
            alpha = frame_idx / 90.0
            p2_x = int(300 + alpha * (900 - 300))
            p2_y = int(450 + alpha * (480 - 450))
        elif frame_idx < 210:
            # Standing in track area (Danger Zone)
            p2_x = int(900 + 10 * np.sin(2 * np.pi * frame_idx / 30))
            p2_y = int(480 + 5 * np.cos(2 * np.pi * frame_idx / 30))
        else:
            # Returning to platform
            alpha = (frame_idx - 210) / (num_frames - 210)
            p2_x = int(900 - alpha * (900 - 400))
            p2_y = int(480 - alpha * (480 - 420))
        draw_person(img, (p2_x, p2_y), (50, 180, 50), "P2 (Crosser)")
        
        # P3 (Edge Stander - Close but Safe)
        p3_x = int(710 + 15 * np.sin(2 * np.pi * frame_idx / 80))
        p3_y = int(180 + 10 * np.cos(2 * np.pi * frame_idx / 80))
        draw_person(img, (p3_x, p3_y), (50, 50, 200), "P3 (Edge)")
        
        # P4 (Fast Crosser - enters at frame 100, crosses at 130, exits at 220)
        if 100 <= frame_idx < 250:
            t = frame_idx - 100
            if t < 50: # moving right fast
                p4_x = int(500 + (t / 50.0) * 350)
            elif t < 100: # stands on tracks
                p4_x = 850
            else: # moving left fast
                p4_x = int(850 - ((t - 100) / 50.0) * 350)
            p4_y = 600
            draw_person(img, (p4_x, p4_y), (150, 50, 150), "P4 (Fast)")
            
        out.write(img)
        
    out.release()
    print("Synthetic video generated successfully!")

if __name__ == "__main__":
    generate_video(config.DEFAULT_VIDEO_INPUT)
