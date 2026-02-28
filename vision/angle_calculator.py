import numpy as np
import math

def calculate_angle(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    """
    Calculate angle at joint B formed by vectors BA and BC.
    Uses arctan2 for numerical stability over arccos.
    Returns angle in degrees [0, 180].
    """
    ba = a - b
    bc = c - b
    
    # Using arctan2 instead of arccos
    cross = np.cross(ba, bc)
    dot = np.dot(ba, bc)
    
    # For 2D / 3D arrays, np.linalg.norm(cross) handles magnitude of cross product
    cross_mag = np.linalg.norm(cross) if isinstance(cross, np.ndarray) else np.abs(cross)
    
    angle = np.degrees(np.arctan2(cross_mag, dot))
    return float(np.clip(angle, 0, 180))

def get_landmark_coords(landmarks, idx: int) -> np.ndarray | None:
    """Safe landmark access — returns None if visibility < threshold."""
    lm = landmarks.landmark[idx]
    if lm.visibility < 0.5:
        return None
    return np.array([lm.x, lm.y, lm.z])
