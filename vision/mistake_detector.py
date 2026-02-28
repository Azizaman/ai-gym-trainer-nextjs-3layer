class MistakeDetector:
    def __init__(self, exercise: str):
        self.exercise = exercise.lower()
        self.mistake_history = []
        
        # Track 3 consecutive frames of mistakes for hysteresis
        self._consecutive_frames = {
            'squat_back_rounding': 0,
            'pushup_hip_sag': 0
        }

    def detect(self, angles: dict, coords: dict, phase: str = None) -> list[dict]:
        """
        Runs threshold-based rules depending on exercise type.
        Applies hysteresis to require 3 consecutive frames for certain mistakes.
        """
        mistakes_found = []

        if self.exercise == 'squat':
            # Knee Valgus: Major, -10
            # knee_x deviates > 0.05 norm units inside foot_x
            l_knee, r_knee = coords.get('l_knee'), coords.get('r_knee')
            l_ankle, r_ankle = coords.get('l_ankle'), coords.get('r_ankle')
            
            if l_knee is not None and r_knee is not None and l_ankle is not None and r_ankle is not None:
                # Assuming x increases to the right. Left knee is larger x, Right knee is smaller x (or vice-versa depending on camera).
                # We measure distance between knees vs distance between ankles.
                knee_dist = abs(l_knee[0] - r_knee[0])
                ankle_dist = abs(l_ankle[0] - r_ankle[0])
                if knee_dist < (ankle_dist - 0.05):
                    mistakes_found.append({'type': 'knee_valgus', 'severity': 'major', 'desc': 'Knees collapsed inward'})

            # Shallow Depth: Minor, -5 (only check at BOTTOM phase)
            avg_knee = angles.get('avg_knee')
            if phase == 'bottom' and avg_knee is not None:
                if avg_knee > 75:
                    mistakes_found.append({'type': 'shallow_depth', 'severity': 'minor', 'desc': 'Squat depth was too shallow'})

            # Back Rounding: Major, -10 (requires 3 consecutive frames)
            avg_back = angles.get('avg_back')
            if avg_back is not None and avg_back < 150:
                self._consecutive_frames['squat_back_rounding'] += 1
                if self._consecutive_frames['squat_back_rounding'] >= 3:
                    mistakes_found.append({'type': 'back_rounding', 'severity': 'major', 'desc': 'Lower back rounded during movement'})
            else:
                self._consecutive_frames['squat_back_rounding'] = 0

        elif self.exercise == 'pushup':
            # Hip Sag: Major, -10
            body_line = angles.get('body_line')
            if body_line is not None and body_line < 160:
                self._consecutive_frames['pushup_hip_sag'] += 1
                if self._consecutive_frames['pushup_hip_sag'] >= 3:
                    mistakes_found.append({'type': 'hip_sag', 'severity': 'major', 'desc': 'Hips dropping out of alignment'})
            else:
                self._consecutive_frames['pushup_hip_sag'] = 0

            # Half Rep: Minor, -5 (check bottom phase)
            avg_elbow = angles.get('avg_elbow')
            if phase == 'bottom' and avg_elbow is not None:
                if avg_elbow >= 90:
                    mistakes_found.append({'type': 'half_rep', 'severity': 'minor', 'desc': 'Elbows did not reach 90 degrees minimum'})

            # Elbow Flaring: Minor, -5
            l_elbow, r_elbow = coords.get('l_elbow'), coords.get('r_elbow')
            l_shoulder, r_shoulder = coords.get('l_shoulder'), coords.get('r_shoulder')
            if l_elbow is not None and r_elbow is not None and l_shoulder is not None and r_shoulder is not None:
                elbow_dist = abs(l_elbow[0] - r_elbow[0])
                shoulder_dist = abs(l_shoulder[0] - r_shoulder[0])
                if elbow_dist > (shoulder_dist + 0.05):
                    mistakes_found.append({'type': 'elbow_flaring', 'severity': 'minor', 'desc': 'Elbows flared too wide'})

        elif self.exercise == 'plank':
            hip_y = coords.get('hip_y')
            shoulder_y = coords.get('shoulder_y')
            # y increases downwards in image coordinates
            
            if hip_y is not None and shoulder_y is not None:
                # Butt Too High: Minor, -5
                if hip_y < (shoulder_y - 0.08): 
                    mistakes_found.append({'type': 'butt_too_high', 'severity': 'minor', 'desc': 'Hips are raised too high'})
                # Hip Drop: Major, -10
                elif hip_y > (shoulder_y + 0.08):
                    mistakes_found.append({'type': 'hip_drop', 'severity': 'major', 'desc': 'Hips are sagging toward floor'})

        elif self.exercise == 'bicep-curl':
            # Cheating with momentum: Shoulder moving back significantly
            # We track shoulder_y or elbow swinging relative to shoulder
            l_elbow, r_elbow = coords.get('l_elbow'), coords.get('r_elbow')
            l_shoulder, r_shoulder = coords.get('l_shoulder'), coords.get('r_shoulder')
            
            if l_elbow is not None and l_shoulder is not None and r_elbow is not None and r_shoulder is not None:
                # If elbows track too far behind or forward from shoulders in x/y, they are swinging the weight
                # Since we don't have side profile guarantee, we check if elbows are moving horizontally more than small threshold
                # A simpler heuristic for bicep curl mistakes: Not extending fully (Half rep)
                avg_elbow = angles.get('avg_elbow')
                if phase == 'bottom' and avg_elbow is not None:
                    if avg_elbow < 130:
                        mistakes_found.append({'type': 'half_rep', 'severity': 'minor', 'desc': 'Did not fully extend arms at the bottom of the curl'})
                
                if phase == 'top' and avg_elbow is not None:
                    if avg_elbow > 90:
                        mistakes_found.append({'type': 'half_rep', 'severity': 'minor', 'desc': 'Did not curl weight all the way up'})

        elif self.exercise == 'tricep-pushdown':
            # Mistake: Upper arm swinging (should be pinned to side)
            avg_elbow = angles.get('avg_elbow')
            if phase == 'top' and avg_elbow is not None:
                if avg_elbow < 90:
                    mistakes_found.append({'type': 'half_rep', 'severity': 'minor', 'desc': 'Did not bring weight up enough to stretch tricep'})
            if phase == 'bottom' and avg_elbow is not None:
                if avg_elbow < 140:
                    mistakes_found.append({'type': 'half_rep', 'severity': 'minor', 'desc': 'Did not fully lock out arms at the bottom'})

        elif self.exercise == 'bench-press':
            # Very similar to pushups mistakes (Half reps)
            avg_elbow = angles.get('avg_elbow')
            if phase == 'bottom' and avg_elbow is not None:
                if avg_elbow > 90:
                    mistakes_found.append({'type': 'half_rep', 'severity': 'minor', 'desc': 'Elbows did not reach 90 degrees minimum for full stretch'})
                    
        elif self.exercise == 'shoulder-press':
            avg_elbow = angles.get('avg_elbow')
            if phase == 'bottom' and avg_elbow is not None:
                if avg_elbow > 90:
                    mistakes_found.append({'type': 'half_rep', 'severity': 'minor', 'desc': 'Bring the weight lower to stretch the shoulders'})
            if phase == 'high' and avg_elbow is not None:
                if avg_elbow < 150:
                    mistakes_found.append({'type': 'half_rep', 'severity': 'minor', 'desc': 'Lock out arms more at the top of the press'})

        self._record_mistakes(mistakes_found)
        return mistakes_found

    def _record_mistakes(self, mistakes):
        for m in mistakes:
            if not any(existing['type'] == m['type'] for existing in self.mistake_history):
                self.mistake_history.append(m)
                
    def get_all_mistakes(self):
        """Returns summarized mistakes with generic placeholders for rep counts."""
        # For simplicity in Phase 1, we return the distinct types found during the video
        return [
            {
                "type": m['type'],
                "severity": m['severity'],
                "rep_count": 0, # To be aggregated properly if needed later, 0 implies "happened during exercise" for general forms or planks
                "description": m['desc']
            }
            for m in self.mistake_history
        ]
