from mistake_detector import MistakeDetector
from report_builder import calculate_form_score

def test_squat_knee_valgus():
    detector = MistakeDetector('squat')
    
    angles = {}
    coords = {
        'l_knee': [0.45, 0.8, 0], 'r_knee': [0.55, 0.8, 0], # Distance 0.1
        'l_ankle': [0.4, 1.0, 0], 'r_ankle': [0.6, 1.0, 0]  # Distance 0.2
    }
    
    # Distance between knees (0.1) is LESS than distance between ankles (0.2) - 0.05
    # So 0.1 < 0.15 is True
    mistakes = detector.detect(angles, coords, phase='bottom')
    
    assert any(m['type'] == 'knee_valgus' for m in mistakes)
    assert any(m['severity'] == 'major' for m in mistakes)
    
    score = calculate_form_score(mistakes)
    assert score == 90
    
def test_squat_shallow_depth():
    detector = MistakeDetector('squat')
    
    angles = {'avg_knee': 85.0} # > 75 degrees is too shallow
    coords = {}
    
    mistakes = detector.detect(angles, coords, phase='bottom')
    
    assert any(m['type'] == 'shallow_depth' for m in mistakes)
    assert any(m['severity'] == 'minor' for m in mistakes)
    
    score = calculate_form_score(mistakes)
    assert score == 95
