import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, isExerciseAllowed, shouldResetUsage, getRemainingAnalyses } from "@/lib/plans";
import type { PlanType } from "@/lib/plans";

// Allow long-running analysis polling up to 5 minutes
export const maxDuration = 300;

export async function POST(request: Request) {
    try {
        // Auth check
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Please sign in to analyze videos" },
                { status: 401 }
            );
        }

        // ── Subscription check ──────────────────────────────────
        let subscription = await prisma.subscription.findUnique({
            where: { userId: session.user.id },
        });

        if (!subscription) {
            subscription = await prisma.subscription.create({
                data: { userId: session.user.id, plan: "starter", status: "active" },
            });
        }

        let plan = (subscription.plan || "starter").toLowerCase().trim() as PlanType;
        if (!PLAN_LIMITS[plan]) {
            plan = "starter";
        }
        const limits = PLAN_LIMITS[plan];

        // Auto-reset usage if new billing period
        if (shouldResetUsage(subscription.currentPeriodStart)) {
            subscription = await prisma.subscription.update({
                where: { id: subscription.id },
                data: { analysesUsedThisMonth: 0, currentPeriodStart: new Date() },
            });
        }

        // Check monthly analysis limit
        const remaining = getRemainingAnalyses(plan, subscription.analysesUsedThisMonth);
        if (remaining <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: `You've used all ${limits.analysesPerMonth} analyses this month on the ${limits.name} plan. Upgrade for more.`,
                    code: "LIMIT_REACHED",
                },
                { status: 403 }
            );
        }
        // ── End subscription check ──────────────────────────────

        const formData = await request.formData();
        const video = formData.get("video") as File | null;
        const exerciseType = (formData.get("exerciseType") as string) || "general";
        const fitnessLevel = (formData.get("fitnessLevel") as string) || "intermediate";

        if (!video) {
            return NextResponse.json(
                { success: false, error: "No video file provided" },
                { status: 400 }
            );
        }

        // Check exercise type allowed for plan
        if (!isExerciseAllowed(plan, exerciseType)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `${exerciseType.replace("-", " ")} is not available on the ${limits.name} plan. Upgrade to Pro for all exercises.`,
                    code: "EXERCISE_LOCKED",
                },
                { status: 403 }
            );
        }

        // Validate MIME type
        if (!config.SUPPORTED_MIME_TYPES.includes(video.type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Unsupported file type: ${video.type}. Supported: ${config.SUPPORTED_MIME_TYPES.join(", ")}`,
                },
                { status: 400 }
            );
        }

        // Validate file size against plan limit
        const planMaxBytes = limits.maxVideoSizeMB * 1024 * 1024;
        const globalMaxBytes = config.MAX_FILE_SIZE_MB * 1024 * 1024;
        const maxBytes = Math.min(planMaxBytes, globalMaxBytes);
        if (video.size > maxBytes) {
            return NextResponse.json(
                {
                    success: false,
                    error: `File too large. Max size for ${limits.name} plan: ${limits.maxVideoSizeMB} MB`,
                },
                { status: 400 }
            );
        }

        // 1. Submit to Node Worker
        const nodeApiUrl = process.env.NODE_API_URL || "http://127.0.0.1:3001";
        const nodeFormData = new FormData();
        nodeFormData.append("video", video);
        nodeFormData.append("exercise", exerciseType);
        nodeFormData.append("userId", session.user.id);

        const uploadRes = await fetch(`${nodeApiUrl}/api/analyze-workout`, {
            method: "POST",
            body: nodeFormData,
        });

        if (!uploadRes.ok) {
            throw new Error(`Worker upload failed: ${uploadRes.statusText}`);
        }

        const uploadData = await uploadRes.json();
        const jobId = uploadData.jobId;

        // 2. Poll until complete
        const MAX_WAIT_MS = 5 * 60 * 1000;
        const POLL_INTERVAL_MS = 3000;
        const start = Date.now();
        let jobResult: any = null;

        while (Date.now() - start < MAX_WAIT_MS) {
            const pollRes = await fetch(`${nodeApiUrl}/api/job/${jobId}/result`);

            if (pollRes.status === 200) {
                jobResult = await pollRes.json();
                break;
            } else if (pollRes.status === 202) {
                await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
            } else if (pollRes.status === 500) {
                const errData = await pollRes.json();
                throw new Error(errData.error || "Analysis job failed");
            } else {
                throw new Error(`Unexpected polling status: ${pollRes.status}`);
            }
        }

        if (!jobResult) {
            throw new Error("Timed out waiting for analysis to complete.");
        }

        // 3. Map to ExerciseFeedback
        // coach_feedback should now contain the exact JSON string we need from the LLM.
        let feedback: any;
        try {
            feedback = JSON.parse(jobResult.coach_feedback);
            // Just in case LLM missed these fields
            if (!feedback.summary) feedback.summary = "Analysis complete.";
            if (typeof feedback.isFormCorrect !== 'boolean') feedback.isFormCorrect = feedback.score >= 80;
        } catch (e) {
            console.error("Failed to parse coach feedback:", e);
            // Fallback mapping if LLM failed to return valid JSON
            const report = jobResult.analysis_report || {};
            const score = report.form_score || 0;

            feedback = {
                score: score,
                isFormCorrect: score >= 80,
                exerciseDetected: exerciseType,
                repCount: report.reps || null,
                summary: jobResult.coach_feedback || "Analysis complete.",
                goodPoints: [],
                issues: (report.problems_detected || []).map((p: any) => ({
                    severity: p.severity || "moderate",
                    body_part: p.body_part || "body",
                    description: p.issue || p.description || "Form issue detected"
                })),
                corrections: [],
                safetyWarnings: [],
                recommendedDrills: []
            };
        }

        // Save to database & increment usage
        try {
            await prisma.analysisHistory.create({
                data: {
                    userId: session.user.id,
                    exerciseType,
                    fitnessLevel,
                    score: feedback.score,
                    isFormCorrect: feedback.isFormCorrect,
                    exerciseDetected: feedback.exerciseDetected,
                    repCount: feedback.repCount || null,
                    summary: feedback.summary,
                    goodPoints: JSON.stringify(feedback.goodPoints),
                    issues: JSON.stringify(feedback.issues),
                    corrections: JSON.stringify(feedback.corrections),
                    safetyWarnings: JSON.stringify(feedback.safetyWarnings),
                    recommendedDrills: JSON.stringify(feedback.recommendedDrills),
                    fileSizeMB: video.size / 1024 / 1024,
                },
            });

            await prisma.subscription.update({
                where: { id: subscription!.id },
                data: { analysesUsedThisMonth: { increment: 1 } },
            });
        } catch (dbError) {
            console.warn("Failed to save analysis to DB:", dbError);
            // Don't fail the request if DB save fails
        }

        return NextResponse.json({
            success: true,
            data: feedback,
            meta: {
                analysesRemaining: remaining - 1,
                plan,
            },
        });
    } catch (error) {
        console.error("Analysis error:", error);
        const message =
            error instanceof Error ? error.message : "Analysis failed";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
