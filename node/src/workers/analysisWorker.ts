import { Worker, Job } from 'bullmq';
import { visionClient } from '../services/visionClient';
import { llmClient } from '../services/llmClient';
import { prisma } from '../lib/prisma';
import { fileManager } from '../services/fileManager';
import { redisConnection } from '../services/jobQueue';

export const analysisWorker = new Worker('analysis', async (job: Job) => {
    const { jobId, filePath, exercise, userId } = job.data;

    try {
        console.log(`[Job ${jobId}] Starting analysis for ${exercise}`);

        // Step 1: Call Python vision service
        const report = await visionClient.analyze(filePath, exercise);
        console.log(`[Job ${jobId}] Vision analysis complete. Form score: ${report.form_score}`);

        // Step 2: Call LLM — ONLY send JSON, never filePath
        const coachFeedback = await llmClient.generateFeedback(report, exercise);
        console.log(`[Job ${jobId}] LLM coaching feedback complete.`);

        // Helper function for DB retry
        const saveToDbWithRetry = async (retries = 3, delayMs = 1000) => {
            for (let i = 0; i < retries; i++) {
                try {
                    await prisma.workoutAnalysis.upsert({
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
                    return; // Success
                } catch (err: any) {
                    if (i === retries - 1) throw err; // Throw on last attempt
                    console.warn(`[Job ${jobId}] DB save attempt ${i + 1} failed (${err.code || err.message}), retrying in ${delayMs}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    delayMs *= 2; // Exponential backoff
                }
            }
        };

        // Step 3: Persist to DB with retry
        await saveToDbWithRetry();

        console.log(`[Job ${jobId}] Successfully saved to Database.`);

    } catch (err: any) {
        console.error(`[Job ${jobId}] Analysis job failed:`, err.message);
        try {
            // Also attempt to save the failed state gracefully without completely blowing up
            await prisma.workoutAnalysis.upsert({
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
        } catch (dbErr: any) {
            console.error(`[Job ${jobId}] Critical DB error while saving failed state:`, dbErr.message);
        }
        throw err;
    } finally {
        // Always clean up the temp file
        if (filePath) {
            await fileManager.deleteFile(filePath);
            console.log(`[Job ${jobId}] Cleaned up temporary video file.`);
        }
    }
}, { connection: redisConnection, concurrency: 3 });

// Handle worker error events
analysisWorker.on('failed', (job, err) => {
    console.error(`[Queue] Job ${job?.id} has failed with ${err.message}`);
});
