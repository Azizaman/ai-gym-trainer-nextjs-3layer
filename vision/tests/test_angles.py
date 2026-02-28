import numpy as np
from angle_calculator import calculate_angle

def test_right_angle():
    a = np.array([1, 0, 0])
    b = np.array([0, 0, 0])
    c = np.array([0, 1, 0])
    assert abs(calculate_angle(a, b, c) - 90.0) < 0.01

def test_straight_line():
    a = np.array([1, 0, 0])
    b = np.array([0, 0, 0])
    c = np.array([-1, 0, 0])
    assert abs(calculate_angle(a, b, c) - 180.0) < 0.01

def test_acute_angle():
    a = np.array([1, 0, 0])
    b = np.array([0, 0, 0])
    c = np.array([1, 1, 0])
    assert abs(calculate_angle(a, b, c) - 45.0) < 0.5
