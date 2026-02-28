import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/job/:jobId/result', async (req: Request, res: Response): Promise<void> => {
    try {
        const jobId = String(req.params.jobId);

        const record = await prisma.workoutAnalysis.findUnique({
            where: { jobId }
        });

        if (!record) {
            // It might still be in the queue and hasn't written a db record yet
            res.status(202).json({ status: 'pending', message: 'Job is queued. Still processing...' });
            return;
        }

        if (record.status === 'pending') {
            res.status(202).json({ status: 'pending', message: 'Analyzing video. Still processing...' });
            return;
        }

        if (record.status === 'failed') {
            res.status(500).json({ status: 'failed', error: 'Analysis failed. Please retry with a clearer video.' });
            return;
        }

        // Success response
        res.status(200).json({
            status: 'done',
            analysis_report: JSON.parse(record.rawReport),
            coach_feedback: record.coachFeedback,
        });
    } catch (error: any) {
        console.error('Error fetching job result:', error);

        // Handle Neon/Vercel transient cold starts and connection drops
        if (error.code === 'EAI_AGAIN' || error.name === 'PrismaClientKnownRequestError' || error.message?.includes('fetch failed')) {
            console.warn('[Polling] Database connection transiently unavailable, returning 202');
            res.status(202).json({ status: 'pending', message: 'Database connecting. Still processing...' });
            return;
        }

        res.status(500).json({ error: 'server_error' });
    }
});

export default router;
