from rep_counter import SquatRepCounter
import math

def test_squat_rep_counter():
    counter = SquatRepCounter()
    
    # 5 frames standing
    for _ in range(5):
        reps = counter.update(knee_angle=170.0, hip_y=0.5)
        
    assert counter.phase.value == 'standing'
    assert reps == 0
    
    # 5 frames descent
    for _ in range(5):
        reps = counter.update(knee_angle=130.0, hip_y=0.6)
        
    assert counter.phase.value == 'descending'
    
    # 5 frames bottom
    for _ in range(5):
        reps = counter.update(knee_angle=90.0, hip_y=0.8)
        
    assert counter.phase.value == 'bottom'
    
    # 5 frames ascent
    for _ in range(5):
        reps = counter.update(knee_angle=130.0, hip_y=0.6)
        
    assert counter.phase.value == 'ascending'
    assert reps == 0
    
    # 5 frames finish standing
    for _ in range(5):
        reps = counter.update(knee_angle=170.0, hip_y=0.5)
        
    assert counter.phase.value == 'standing'
    assert reps == 1
