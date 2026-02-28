"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_1 = require("../middleware/upload");
const validateVideo_1 = require("../middleware/validateVideo");
const jobQueue_1 = require("../services/jobQueue");
const router = (0, express_1.Router)();
router.post('/analyze-workout', upload_1.upload.single('video'), validateVideo_1.validateVideo, async (req, res) => {
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
        await jobQueue_1.analysisQueue.add('analyze-video', {
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
    }
    catch (error) {
        console.error('Error queuing analysis job:', error);
        res.status(500).json({ error: 'server_error' });
    }
});
exports.default = router;
