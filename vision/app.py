from flask import Flask, request, jsonify
from pose_extractor import extract_pose_data
from report_builder import build_report
from angle_calculator import calculate_angle, get_landmark_coords
from rep_counter import SquatRepCounter, PushupRepCounter, PlankRepCounter
from mistake_detector import MistakeDetector
import logging
import os
import mediapipe as mp
import traceback

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mp_pose = mp.solutions.pose

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'no_json_body'}), 400
        
    file_path = data.get('file_path')
    exercise  = data.get('exercise', 'squat').lower()

    if not file_path or not os.path.exists(file_path):
        return jsonify({'error': 'file_not_found'}), 400

    try:
        extraction = extract_pose_data(file_path)
        if extraction is None:
            return jsonify({'error': 'pose_detection_failed',
                           'reps': 0, 'form_score': 0}), 422

        frame_data = extraction['frames']
        duration_seconds = extraction['duration_seconds']
        
        # Initialize Trackers based on exercise type
        if exercise == 'squat':
            rep_counter = SquatRepCounter()
        elif exercise == 'pushup':
            rep_counter = PushupRepCounter()
        elif exercise == 'bicep-curl' or exercise == 'tricep-pushdown':
            # We can reuse the elbow angle logic, but we need custom trackers if we define them,
            # or we can leverage a generic one. For now assume we create them in rep_counter.py
            from rep_counter import BicepCurlRepCounter, TricepPushdownRepCounter, BenchPressRepCounter, ShoulderPressRepCounter
            if exercise == 'bicep-curl':
                rep_counter = BicepCurlRepCounter()
            else:
                rep_counter = TricepPushdownRepCounter()
        elif exercise == 'bench-press':
            from rep_counter import BenchPressRepCounter
            rep_counter = BenchPressRepCounter()
        elif exercise == 'shoulder-press':
            from rep_counter import ShoulderPressRepCounter
            rep_counter = ShoulderPressRepCounter()
        else: # Default plank
            rep_counter = PlankRepCounter()
            
        mistake_detector = MistakeDetector(exercise)
        
        # Metrics aggregators for JSON schema output
        knee_angles_bottom = []
        back_angles = []
        hip_y_history = []
        
        reps = 0
        
        # Track global min/max for validation
        global_min_knee_angle = 180.0
        global_max_knee_angle = 0.0
        global_min_elbow_angle = 180.0
        global_max_elbow_angle = 0.0
        
        # Frame iteration loop to feed state machines
        for landmarks in frame_data:
            l_shoulder = get_landmark_coords(landmarks, mp_pose.PoseLandmark.LEFT_SHOULDER.value)
            r_shoulder = get_landmark_coords(landmarks, mp_pose.PoseLandmark.RIGHT_SHOULDER.value)
            l_hip = get_landmark_coords(landmarks, mp_pose.PoseLandmark.LEFT_HIP.value)
            r_hip = get_landmark_coords(landmarks, mp_pose.PoseLandmark.RIGHT_HIP.value)
            l_knee = get_landmark_coords(landmarks, mp_pose.PoseLandmark.LEFT_KNEE.value)
            r_knee = get_landmark_coords(landmarks, mp_pose.PoseLandmark.RIGHT_KNEE.value)
            l_ankle = get_landmark_coords(landmarks, mp_pose.PoseLandmark.LEFT_ANKLE.value)
            r_ankle = get_landmark_coords(landmarks, mp_pose.PoseLandmark.RIGHT_ANKLE.value)
            l_elbow = get_landmark_coords(landmarks, mp_pose.PoseLandmark.LEFT_ELBOW.value)
            r_elbow = get_landmark_coords(landmarks, mp_pose.PoseLandmark.RIGHT_ELBOW.value)
            l_wrist = get_landmark_coords(landmarks, mp_pose.PoseLandmark.LEFT_WRIST.value)
            r_wrist = get_landmark_coords(landmarks, mp_pose.PoseLandmark.RIGHT_WRIST.value)
            
            def avg_or_fallback(l, r):
                if l is not None and r is not None: return (l + r) / 2
                if l is not None: return l
                return r

            # Simple average points for center body lines if visible
            shoulder = avg_or_fallback(l_shoulder, r_shoulder)
            hip = avg_or_fallback(l_hip, r_hip)
            knee = avg_or_fallback(l_knee, r_knee)
            ankle = avg_or_fallback(l_ankle, r_ankle)
            
            angles = {}
            coords = {
                'l_knee': l_knee, 'r_knee': r_knee, 
                'l_ankle': l_ankle, 'r_ankle': r_ankle,
                'l_elbow': l_elbow, 'r_elbow': r_elbow,
                'l_shoulder': l_shoulder, 'r_shoulder': r_shoulder,
                'hip_y': hip[1] if hip is not None else None,
                'shoulder_y': shoulder[1] if shoulder is not None else None
            }
            
            if shoulder is not None and hip is not None and knee is not None:
                angles['avg_back'] = calculate_angle(shoulder, hip, knee)
                back_angles.append(angles['avg_back'])
                
            if shoulder is not None and hip is not None and ankle is not None:
                angles['body_line'] = calculate_angle(shoulder, hip, ankle)
                
            # Always calculate knee and elbow angles to validate the exercise type later
            if l_hip is not None and l_knee is not None and l_ankle is not None and r_hip is not None and r_knee is not None and r_ankle is not None:
                l_knee_angle = calculate_angle(l_hip, l_knee, l_ankle)
                r_knee_angle = calculate_angle(r_hip, r_knee, r_ankle)
                angles['avg_knee'] = (l_knee_angle + r_knee_angle) / 2
                global_min_knee_angle = min(global_min_knee_angle, angles['avg_knee'])
                global_max_knee_angle = max(global_max_knee_angle, angles['avg_knee'])
                
            if l_shoulder is not None and l_elbow is not None and l_wrist is not None and r_shoulder is not None and r_elbow is not None and r_wrist is not None:
                l_elbow_angle = calculate_angle(l_shoulder, l_elbow, l_wrist)
                r_elbow_angle = calculate_angle(r_shoulder, r_elbow, r_wrist)
                angles['avg_elbow'] = (l_elbow_angle + r_elbow_angle) / 2
                global_min_elbow_angle = min(global_min_elbow_angle, angles['avg_elbow'])
                global_max_elbow_angle = max(global_max_elbow_angle, angles['avg_elbow'])
                
            if exercise == 'squat':
                if 'avg_knee' in angles:
                    
                    if hip is not None:
                        hip_y_history.append(hip[1])
                        reps = rep_counter.update(angles['avg_knee'], hip[1])
                        mistake_detector.detect(angles, coords, phase=rep_counter.phase.value)
                        
                        if rep_counter.phase.value == 'bottom':
                            knee_angles_bottom.append(angles['avg_knee'])

            elif exercise == 'pushup' or exercise == 'bench-press' or exercise == 'bicep-curl' or exercise == 'tricep-pushdown' or exercise == 'shoulder-press':
                if 'avg_elbow' in angles:
                    reps = rep_counter.update(angles['avg_elbow'])
                    mistake_detector.detect(angles, coords, phase=rep_counter.phase.value)
            
            elif exercise == 'plank':
                reps = rep_counter.update()
                mistake_detector.detect(angles, coords, phase=None)

        # Aggregate Metrics Dictionary exactly per JSON Schema
        metrics = {
             "avg_knee_angle_bottom": float(sum(knee_angles_bottom)/len(knee_angles_bottom)) if knee_angles_bottom else 0.0,
             "avg_back_angle": float(sum(back_angles)/len(back_angles)) if back_angles else 0.0,
             "hip_depth_ratio": 0.0 # Standard placeholder or calculated if math is defined
        }
        
        problems_detected = mistake_detector.get_all_mistakes()

        # Validation step: Check if the video actually shows the requested exercise
        knee_range = global_max_knee_angle - global_min_knee_angle if global_max_knee_angle > 0 else 0
        elbow_range = global_max_elbow_angle - global_min_elbow_angle if global_max_elbow_angle > 0 else 0
        
        is_wrong_exercise = False
        if exercise == 'squat':
            # Squats should have significant knee movement (>30 deg)
            if knee_range < 30:
                is_wrong_exercise = True
        elif exercise in ['pushup', 'bench-press', 'tricep-pushdown', 'bicep-curl', 'shoulder-press']:
            # All these upper body exercises involve significant elbow movement (>30 deg)
            if elbow_range < 30:
                is_wrong_exercise = True

        if is_wrong_exercise:
            problems_detected = [{"type": "wrong_exercise", "severity": "critical", "rep_count": 0, "description": "The video does not appear to show the selected exercise."}]
            reps = 0

        # Build final report
        report = build_report(
            reps=reps, 
            duration_seconds=duraton_seconds if locals().get('duraton_seconds') else int(duration_seconds),
            exercise=exercise, 
            problems=problems_detected, 
            metrics=metrics
        )
        return jsonify(report), 200

    except Exception as e:
        logger.exception('Vision analysis error')
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/ स्वास्थ्य', methods=['GET'])
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
