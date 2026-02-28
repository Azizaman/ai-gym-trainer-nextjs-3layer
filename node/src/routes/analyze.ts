import { Router, Request, Response } from 'express';
import { upload } from '../middleware/upload';
import { validateVideo } from '../middleware/validateVideo';
import { analysisQueue } from '../services/jobQueue';

const router = Router();

router.post('/analyze-workout', upload.single('video'), validateVideo, async (req: Request, res: Response): Promise<void> => {
    try {
        const file = req.file;
        const { exercise, userId } = req.body;

        // The jobId was injected in req.body by the multer configuration
        const jobId = req.body.jobId;

        if (!file) {
            res.status(400).json({ error: 'no_file_uploaded' });
            return;
        }

        // Add exactly this job structure to the queue
        await analysisQueue.add('analyze-video', {
            jobId,
            filePath: file.path,
            exercise: exercise || 'squat',
            userId: userId || 'anonymous'
        });

        // Return the jobId immediately so the client can begin polling
        res.status(202).json({
            jobId,
            status: 'pending',
            message: 'Video uploaded successfully. Analysis in progress.'
        });
    } catch (error) {
        console.error('Error queuing analysis job:', error);
        res.status(500).json({ error: 'server_error' });
    }
});

export default router;
