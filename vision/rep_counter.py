from enum import Enum
from utils.smoothing import rolling_avg

class SquatPhase(Enum):
    STANDING   = 'standing'
    DESCENDING = 'descending'
    BOTTOM     = 'bottom'
    ASCENDING  = 'ascending'

class SquatRepCounter:
    STANDING_THRESHOLD = 155   # knee angle > this = standing
    BOTTOM_THRESHOLD   = 115   # knee angle < this = at bottom
    SMOOTHING_WINDOW   = 5     # rolling avg frames

    def __init__(self):
        self.phase = SquatPhase.STANDING
        self.reps = 0
        self.hip_y_history = []
        self.knee_angle_history = []

    def update(self, knee_angle: float, hip_y: float) -> int:
        self.hip_y_history.append(hip_y)
        self.knee_angle_history.append(knee_angle)
        smoothed_knee = rolling_avg(self.knee_angle_history, self.SMOOTHING_WINDOW)

        if self.phase == SquatPhase.STANDING:
            if smoothed_knee < 150:
                self.phase = SquatPhase.DESCENDING
        elif self.phase == SquatPhase.DESCENDING:
            if smoothed_knee < self.BOTTOM_THRESHOLD:
                self.phase = SquatPhase.BOTTOM
        elif self.phase == SquatPhase.BOTTOM:
            if smoothed_knee > self.BOTTOM_THRESHOLD + 10:
                self.phase = SquatPhase.ASCENDING
        elif self.phase == SquatPhase.ASCENDING:
            if smoothed_knee > self.STANDING_THRESHOLD:
                self.reps += 1
                self.phase = SquatPhase.STANDING

        return self.reps

class PushupPhase(Enum):
    HIGH = 'high'
    DESCENDING = 'descending'
    BOTTOM = 'bottom'
    ASCENDING = 'ascending'

class PushupRepCounter:
    HIGH_THRESHOLD = 150
    BOTTOM_THRESHOLD = 110
    SMOOTHING_WINDOW = 5

    def __init__(self):
        self.phase = PushupPhase.HIGH
        self.reps = 0
        self.elbow_angle_history = []

    def update(self, elbow_angle: float) -> int:
        self.elbow_angle_history.append(elbow_angle)
        smoothed_elbow = rolling_avg(self.elbow_angle_history, self.SMOOTHING_WINDOW)
        
        if self.phase == PushupPhase.HIGH:
            if smoothed_elbow < 140:
                self.phase = PushupPhase.DESCENDING
        elif self.phase == PushupPhase.DESCENDING:
            if smoothed_elbow < self.BOTTOM_THRESHOLD:
                self.phase = PushupPhase.BOTTOM
        elif self.phase == PushupPhase.BOTTOM:
            if smoothed_elbow > self.BOTTOM_THRESHOLD + 10:
                self.phase = PushupPhase.ASCENDING
        elif self.phase == PushupPhase.ASCENDING:
            if smoothed_elbow > self.HIGH_THRESHOLD:
                self.reps += 1
                self.phase = PushupPhase.HIGH
                
        return self.reps

class PlankRepCounter:
    def __init__(self):
        self.reps = 0
        self.has_started = False
        
    def update(self) -> int:
        # Planks don't have reps, but we mark it as 1 rep completed if they held it
        if not self.has_started:
            self.has_started = True
        self.reps = 1
        return self.reps

class BicepCurlPhase(Enum):
    BOTTOM = 'bottom' # arm straight
    ASCENDING = 'ascending'
    TOP = 'top' # arm curled
    DESCENDING = 'descending'

class BicepCurlRepCounter:
    BOTTOM_THRESHOLD = 150
    TOP_THRESHOLD = 60
    SMOOTHING_WINDOW = 5

    def __init__(self):
        self.phase = BicepCurlPhase.BOTTOM
        self.reps = 0
        self.elbow_angle_history = []

    def update(self, elbow_angle: float) -> int:
        self.elbow_angle_history.append(elbow_angle)
        smoothed = rolling_avg(self.elbow_angle_history, self.SMOOTHING_WINDOW)
        
        if self.phase == BicepCurlPhase.BOTTOM:
            if smoothed < 140:
                self.phase = BicepCurlPhase.ASCENDING
        elif self.phase == BicepCurlPhase.ASCENDING:
            if smoothed < self.TOP_THRESHOLD:
                self.phase = BicepCurlPhase.TOP
        elif self.phase == BicepCurlPhase.TOP:
            if smoothed > self.TOP_THRESHOLD + 20:
                self.phase = BicepCurlPhase.DESCENDING
        elif self.phase == BicepCurlPhase.DESCENDING:
            if smoothed > self.BOTTOM_THRESHOLD:
                self.reps += 1
                self.phase = BicepCurlPhase.BOTTOM
                
        return self.reps

class TricepPushdownRepCounter:
    # Top phase is arm bent, Bottom phase is arm straight
    TOP_THRESHOLD = 70
    BOTTOM_THRESHOLD = 150
    SMOOTHING_WINDOW = 5

    def __init__(self):
        self.phase = BicepCurlPhase.TOP # reuse same enum basically or create new. Using TOP meaning arm bent
        self.reps = 0
        self.elbow_angle_history = []

    def update(self, elbow_angle: float) -> int:
        self.elbow_angle_history.append(elbow_angle)
        smoothed = rolling_avg(self.elbow_angle_history, self.SMOOTHING_WINDOW)
        
        if self.phase == BicepCurlPhase.TOP:
            if smoothed > 90:
                self.phase = BicepCurlPhase.DESCENDING
        elif self.phase == BicepCurlPhase.DESCENDING:
            if smoothed > self.BOTTOM_THRESHOLD:
                self.phase = BicepCurlPhase.BOTTOM
        elif self.phase == BicepCurlPhase.BOTTOM:
            if smoothed < self.BOTTOM_THRESHOLD - 20:
                self.phase = BicepCurlPhase.ASCENDING
        elif self.phase == BicepCurlPhase.ASCENDING:
            if smoothed < self.TOP_THRESHOLD:
                self.reps += 1
                self.phase = BicepCurlPhase.TOP
                
        return self.reps

class BenchPressRepCounter(PushupRepCounter):
    # Bench press elbow logic is nearly identical to pushups (High=Straight, Bottom=Bent)
    pass

class ShoulderPressRepCounter(PushupRepCounter):
    # Shoulder press elbow logic is also similar (High=Straight overhead, Bottom=Bent at shoulders)
    pass
