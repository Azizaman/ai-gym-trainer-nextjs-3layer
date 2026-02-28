"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
router.get('/job/:jobId/result', async (req, res) => {
    try {
        const { jobId } = req.params;
        const record = await prisma_1.prisma.workoutAnalysis.findUnique({
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
    }
    catch (error) {
        console.error('Error fetching job result:', error);
        res.status(500).json({ error: 'server_error' });
    }
});
exports.default = router;
