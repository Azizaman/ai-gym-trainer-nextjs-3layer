import cv2
import mediapipe as mp
import numpy as np
import math

mp_pose = mp.solutions.pose

def calculate_angle(a, b, c):
    """
    Calculate the angle in degrees between three points (a, b, c).
    b is the vertex.
    Points are typically tuples/lists [x, y, z] or [x, y].
    """
    a = np.array(a[:2])
    b = np.array(b[:2])
    c = np.array(c[:2])

    ba = a - b
    bc = c - b

    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    # Handle floating point inaccuracies
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    angle = np.arccos(cosine_angle)
    return np.degrees(angle)

def analyze_video(video_path, exercise_type='squat'):
    """
    Analyzes an exercise video, extracts pose landmarks, tracks movement phases,
    detects form mistakes, and calculates the exact JSON report required.
    """
    cap = cv2.VideoCapture(video_path)
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0 or math.isnan(fps):
        fps = 30.0 # fallback
        
    frame_count = 0
    
    # State tracking
    reps = 0
    phase = "start" # start, descent, bottom, ascent
    
    # Metrics aggregators
    form_score = 100
    problems_detected = []
    
    knee_angles_bottom = []
    back_angles = []
    
    # Mistake flags for current rep
    rep_mistakes = {
        "knee_valgus": False,
        "shallow_depth": False,
        "back_rounding": False,
        "hip_sag": False,
        "half_rep": True, # assume half rep until depth reached
        "elbow_flaring": False,
        "butt_too_high": False,
        "hip_drop": False
    }

    # Tracking lowest hip per rep
    current_rep_lowest_hip_y = 0.0
    current_rep_lowest_knee_angle = 180.0
    current_rep_lowest_elbow_angle = 180.0
    
    # Global tracking to validate exercise type
    global_min_knee_angle = 180.0
    global_max_knee_angle = 0.0
    global_min_elbow_angle = 180.0
    global_max_elbow_angle = 0.0
    
    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            frame_count += 1
            
            # Recolor image to RGB
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            
            # Make detection
            results = pose.process(image)
            
            if not results.pose_landmarks:
                continue
                
            landmarks = results.pose_landmarks.landmark
            
            # Get coordinates
            l_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            r_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
            
            l_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
            r_hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
            
            l_knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
            r_knee = [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y]
            
            l_ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
            r_ankle = [landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y]
            
            l_elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
            r_elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
            
            l_wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
            r_wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]
            
            # Averages for symmetrical angles
            shoulder = [(l_shoulder[0] + r_shoulder[0])/2, (l_shoulder[1] + r_shoulder[1])/2]
            hip = [(l_hip[0] + r_hip[0])/2, (l_hip[1] + r_hip[1])/2]
            knee = [(l_knee[0] + r_knee[0])/2, (l_knee[1] + r_knee[1])/2]
            ankle = [(l_ankle[0] + r_ankle[0])/2, (l_ankle[1] + r_ankle[1])/2]
            
            # Calculate required angles
            # Knee (hip-knee-ankle)
            l_knee_angle = calculate_angle(l_hip, l_knee, l_ankle)
            r_knee_angle = calculate_angle(r_hip, r_knee, r_ankle)
            avg_knee_angle = (l_knee_angle + r_knee_angle) / 2
            
            # Back (shoulder-hip-knee)
            avg_back_angle = calculate_angle(shoulder, hip, knee)
            back_angles.append(avg_back_angle)
            
            # Body line (shoulder-hip-ankle)
            body_line_angle = calculate_angle(shoulder, hip, ankle)
            
            # Elbow (shoulder-elbow-wrist)
            l_elbow_angle = calculate_angle(l_shoulder, l_elbow, l_wrist)
            r_elbow_angle = calculate_angle(r_shoulder, r_elbow, r_wrist)
            avg_elbow_angle = (l_elbow_angle + r_elbow_angle) / 2
            
            # Track global min/max for validation
            global_min_knee_angle = min(global_min_knee_angle, avg_knee_angle)
            global_max_knee_angle = max(global_max_knee_angle, avg_knee_angle)
            global_min_elbow_angle = min(global_min_elbow_angle, avg_elbow_angle)
            global_max_elbow_angle = max(global_max_elbow_angle, avg_elbow_angle)
            
            if exercise_type.lower() == 'squat':
                hip_y = hip[1] # y increases downwards
                
                # Check phase
                if phase == "start":
                    if avg_knee_angle < 155:
                        phase = "descent"
                        current_rep_lowest_hip_y = hip_y
                        current_rep_lowest_knee_angle = avg_knee_angle
                        # Reset mistakes for new rep
                        rep_mistakes = {k: False for k in rep_mistakes}
                
                elif phase == "descent":
                    if hip_y > current_rep_lowest_hip_y:
                        current_rep_lowest_hip_y = hip_y
                    else:
                        # Hip stopped moving down
                        phase = "bottom"
                        
                    if avg_knee_angle < current_rep_lowest_knee_angle:
                        current_rep_lowest_knee_angle = avg_knee_angle
                        
                    # Check knee valgus logic (knees closer than ankles)
                    knee_dist_x = abs(l_knee[0] - r_knee[0])
                    ankle_dist_x = abs(l_ankle[0] - r_ankle[0])
                    if knee_dist_x < ankle_dist_x * 0.8:
                        rep_mistakes["knee_valgus"] = True
                        
                elif phase == "bottom":
                    knee_angles_bottom.append(avg_knee_angle)
                    if avg_knee_angle > 75:
                        rep_mistakes["shallow_depth"] = True
                    if avg_back_angle < 150:
                        rep_mistakes["back_rounding"] = True
                    phase = "ascent"
                    
                elif phase == "ascent":
                    if avg_knee_angle > 165:
                        phase = "start"
                        reps += 1
                        
                        # Apply score deductions
                        if rep_mistakes["knee_valgus"] and "Knee Valgus" not in problems_detected:
                            problems_detected.append("Knee Valgus")
                            form_score -= 10
                        if rep_mistakes["shallow_depth"] and "Shallow Depth" not in problems_detected:
                            problems_detected.append("Shallow Depth")
                            form_score -= 10
                        if rep_mistakes["back_rounding"] and "Back Rounding" not in problems_detected:
                            problems_detected.append("Back Rounding")
                            form_score -= 10
            
            elif exercise_type.lower() == 'pushup':
                if phase == "start":
                    if avg_elbow_angle < 160:
                        phase = "descent"
                        rep_mistakes = {k: False for k in rep_mistakes}
                        rep_mistakes["half_rep"] = True
                        current_rep_lowest_elbow_angle = avg_elbow_angle
                
                elif phase == "descent":
                    if avg_elbow_angle < current_rep_lowest_elbow_angle:
                        current_rep_lowest_elbow_angle = avg_elbow_angle
                    else:
                        phase = "bottom"
                        
                    if body_line_angle < 160:
                        rep_mistakes["hip_sag"] = True
                        
                    elbow_dist_x = abs(l_elbow[0] - r_elbow[0])
                    shoulder_dist_x = abs(l_shoulder[0] - r_shoulder[0])
                    if elbow_dist_x > shoulder_dist_x * 1.5:
                        rep_mistakes["elbow_flaring"] = True
                        
                elif phase == "bottom":
                    if current_rep_lowest_elbow_angle < 90:
                        rep_mistakes["half_rep"] = False
                    phase = "ascent"
                    
                elif phase == "ascent":
                    if avg_elbow_angle > 160:
                        phase = "start"
                        reps += 1
                        if rep_mistakes["half_rep"] and "Half Rep" not in problems_detected:
                            problems_detected.append("Half Rep")
                            form_score -= 10
                        if rep_mistakes["hip_sag"] and "Hip Sag" not in problems_detected:
                            problems_detected.append("Hip Sag")
                            form_score -= 10
                        if rep_mistakes["elbow_flaring"] and "Elbow Flaring" not in problems_detected:
                            problems_detected.append("Elbow Flaring")
                            form_score -= 5
                            
            elif exercise_type.lower() == 'plank':
                reps = 1 # duration based
                if hip[1] < shoulder[1] - 0.05: # hip higher (smaller y)
                    if "Butt Too High" not in problems_detected:
                        problems_detected.append("Butt Too High")
                        form_score -= 10
                elif hip[1] > shoulder[1] + 0.1: # hip drop
                    if "Hip Drop" not in problems_detected:
                        problems_detected.append("Hip Drop")
                        form_score -= 10

    cap.release()
    
    # Validation step: Check if the video actually shows the requested exercise
    knee_range = global_max_knee_angle - global_min_knee_angle
    elbow_range = global_max_elbow_angle - global_min_elbow_angle
    
    is_wrong_exercise = False
    if exercise_type.lower() == 'squat':
        # Need at least 40 degrees of knee movement, or if elbow movement heavily dominates
        if knee_range < 30:
            is_wrong_exercise = True
    elif exercise_type.lower() == 'pushup':
        # Need at least 40 degrees of elbow movement
        if elbow_range < 30:
            is_wrong_exercise = True

    if is_wrong_exercise:
        form_score = 0
        problems_detected = ["Wrong Exercise: The video does not appear to show the selected exercise."]
        reps = 0

    duration_seconds = int(frame_count / fps)
    
    metrics = {
        "avg_knee_angle_bottom": float(np.mean(knee_angles_bottom)) if knee_angles_bottom else 0.0,
        "avg_back_angle": float(np.mean(back_angles)) if back_angles else 0.0,
        "hip_depth_ratio": 0.0 # Placeholder calculation
    }
    
    # Ensure form score bounds
    form_score = max(0, min(100, form_score))
    
    return {
        "exercise": exercise_type.lower(),
        "reps": reps,
        "duration_seconds": duration_seconds,
        "form_score": form_score,
        "problems_detected": problems_detected,
        "metrics": metrics
    }
