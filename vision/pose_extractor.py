import cv2
import mediapipe as mp
import logging

mp_pose = mp.solutions.pose
logger = logging.getLogger(__name__)

VISIBILITY_THRESHOLD = 0.5
FAILURE_RATE_LIMIT   = 0.70  # if >70% frames fail, abort

def extract_pose_data(file_path: str) -> list | None:
    """
    Extracts pose landmarks frame by frame.
    Gracefully handles missing landmarks and total failure limits.
    """
    cap = cv2.VideoCapture(file_path)
    if not cap.isOpened():
        logger.error(f"Cannot open video file: {file_path}")
        return None

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    if total_frames <= 0:
        total_frames = 1 # Prevent ZeroDivisionError 
    
    failed_frames = 0
    frame_data = []

    with mp_pose.Pose(min_detection_confidence=0.5,
                      min_tracking_confidence=0.5) as pose:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: 
                break

            # Recolor image to RGB for MediaPipe
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb.flags.writeable = False
            
            # Make detection
            results = pose.process(rgb)

            if results.pose_landmarks is None:
                failed_frames += 1
                continue  # skip frame, do not crash

            frame_data.append(results.pose_landmarks)

    cap.release()
    
    if len(frame_data) == 0:
        return None
        
    actual_frames_processed = len(frame_data) + failed_frames
    if actual_frames_processed > 0 and (failed_frames / actual_frames_processed) > FAILURE_RATE_LIMIT:
        logger.warning(f"Pose extraction failed on {failed_frames}/{actual_frames_processed} frames (>{FAILURE_RATE_LIMIT*100}%)")
        return None
        
    return {
        'frames': frame_data,
        'fps': fps,
        'duration_seconds': int(actual_frames_processed / fps) if fps > 0 else 0
    }
