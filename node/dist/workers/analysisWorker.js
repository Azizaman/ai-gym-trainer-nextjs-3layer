"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analysisWorker = void 0;
const bullmq_1 = require("bullmq");
const visionClient_1 = require("../services/visionClient");
const llmClient_1 = require("../services/llmClient");
const prisma_1 = require("../lib/prisma");
const fileManager_1 = require("../services/fileManager");
const jobQueue_1 = require("../services/jobQueue");
exports.analysisWorker = new bullmq_1.Worker('analysis', async (job) => {
    const { jobId, filePath, exercise, userId } = job.data;
    try {
        console.log(`[Job ${jobId}] Starting analysis for ${exercise}`);
        // Step 1: Call Python vision service
        const report = await visionClient_1.visionClient.analyze(filePath, exercise);
        console.log(`[Job ${jobId}] Vision analysis complete. Form score: ${report.form_score}`);
        // Step 2: Call LLM — ONLY send JSON, never filePath
        const coachFeedback = await llmClient_1.llmClient.generateFeedback(report);
        console.log(`[Job ${jobId}] LLM coaching feedback complete.`);
        // Step 3: Persist to DB
        await prisma_1.prisma.workoutAnalysis.upsert({
            where: { jobId },
            create: {
                jobId,
                userId: userId === 'anonymous' ? null : userId,
                exercise,
                reps: report.reps,
                durationSeconds: report.duration_seconds,
                formScore: report.form_score,
                problemsDetected: JSON.stringify(report.problems_detected),
                metrics: JSON.stringify(report.metrics),
                rawReport: JSON.stringify(report),
                coachFeedback,
                status: 'done',
            },
            update: {
                coachFeedback,
                rawReport: JSON.stringify(report),
                status: 'done'
            }
        });
        console.log(`[Job ${jobId}] Successfully saved to Database.`);
    }
    catch (err) {
        console.error(`[Job ${jobId}] Analysis job failed:`, err.message);
        await prisma_1.prisma.workoutAnalysis.upsert({
            where: { jobId },
            create: {
                jobId,
                userId: userId === 'anonymous' ? null : userId,
                exercise,
                reps: 0,
                durationSeconds: 0,
                formScore: 0,
                problemsDetected: '[]',
                metrics: '{}',
                rawReport: '{}',
                coachFeedback: '',
                status: 'failed'
            },
            update: { status: 'failed' }
        });
        throw err;
    }
    finally {
        // Always clean up the temp file
        if (filePath) {
            await fileManager_1.fileManager.deleteFile(filePath);
            console.log(`[Job ${jobId}] Cleaned up temporary video file.`);
        }
    }
}, { connection: jobQueue_1.redisConnection, concurrency: 3 });
// Handle worker error events
exports.analysisWorker.on('failed', (job, err) => {
    console.error(`[Queue] Job ${job?.id} has failed with ${err.message}`);
});
