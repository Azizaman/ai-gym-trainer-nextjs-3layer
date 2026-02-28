import axios from 'axios';

const VISION_SERVICE_URL = process.env.VISION_SERVICE_URL || 'http://localhost:5000';

export interface VisionReport {
    exercise: string;
    reps: number;
    duration_seconds: number;
    form_score: number;
    problems_detected: any[];
    metrics: Record<string, number>;
}

export const visionClient = {
    analyze: async (filePath: string, exercise: string): Promise<VisionReport> => {
        try {
            const response = await axios.post(`${VISION_SERVICE_URL}/analyze`, {
                file_path: filePath,
                exercise: exercise
            }, {
                timeout: 120000 // 2 minutes timeout for video processing
            });
            return response.data as VisionReport;
        } catch (error) {
            console.error('Error calling vision service:', error);
            throw new Error('Vision analysis failed');
        }
    }
};
