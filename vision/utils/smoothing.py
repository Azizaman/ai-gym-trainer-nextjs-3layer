def rolling_avg(history: list[float], window: int) -> float:
    """
    Calculates the rolling average of the most recent 'window' frames.
    Returns the average, or 0.0 if the history is empty.
    """
    if not history:
        return 0.0
    w = min(len(history), window)
    return sum(history[-w:]) / w
