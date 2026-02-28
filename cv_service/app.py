from flask import Flask, request, jsonify
import os
from analyzer import analyze_video

app = Flask(__name__)

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    if not data or 'video_path' not in data:
        return jsonify({"error": "Missing video_path in request"}), 400
        
    video_path = data['video_path']
    exercise_type = data.get('exercise_type', 'squat')
    
    if not os.path.exists(video_path):
        return jsonify({"error": f"Video file not found: {video_path}"}), 404
        
    try:
        report = analyze_video(video_path, exercise_type)
        return jsonify(report), 200
    except Exception as e:
        print(f"Analysis error: {e}")
        return jsonify({"error": "Failed to analyze video", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
