def calculate_form_score(problems: list) -> int:
    score = 100
    for problem in problems:
        if problem.get('severity') == 'major':
            score -= 10
        elif problem.get('severity') == 'minor':
            score -= 5
    return max(0, score)

def build_report(reps: int, duration_seconds: int, exercise: str, problems: list, metrics: dict) -> dict:
    """
    Constructs the exact JSON report schema required by Layer 2.
    """
    return {
        "exercise": exercise.lower(),
        "reps": reps,
        "duration_seconds": duration_seconds,
        "form_score": calculate_form_score(problems),
        "problems_detected": problems,
        "metrics": metrics
    }
