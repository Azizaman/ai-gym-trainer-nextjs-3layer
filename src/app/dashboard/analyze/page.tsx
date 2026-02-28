"use client";

import { useRef, useState, useEffect } from "react";
import { Upload, Video, Loader2, CheckCircle2, AlertTriangle, ArrowLeft, RefreshCw, Lock, Crown, ArrowRight, Activity, Zap, Flame, MoveRight, ChevronRight, Award, Trophy } from "lucide-react";
import Link from "next/link";
import type { ExerciseFeedback } from "@/types";

const EXERCISES = [
    { id: "squat", name: "Squat" },
    { id: "bench-press", name: "Bench Press" },
    { id: "deadlift", name: "Deadlift" },
    { id: "overhead-press", name: "Overhead Press" },
    { id: "shoulder-press", name: "Shoulder Press" },
    { id: "pull-up", name: "Pull-Up" },
    { id: "push-up", name: "Push-Up" },
    { id: "bicep-curl", name: "Bicep Curl" },
    { id: "tricep-pushdown", name: "Tricep Pushdown" },
    { id: "lunge", name: "Lunge" },
    { id: "romanian-deadlift", name: "Romanian Deadlift" },
    { id: "hip-thrust", name: "Hip Thrust" },
    { id: "kettlebell-swing", name: "Kettlebell Swing" },
    { id: "plank", name: "Plank" },
];

const FITNESS_LEVELS = [
    { id: "beginner", label: "Beginner" },
    { id: "intermediate", label: "Intermediate" },
    { id: "advanced", label: "Advanced" },
];

type AnalyzeState = "select" | "uploading" | "analyzing" | "done" | "error";

interface SubData {
    plan: string;
    planName: string;
    usage: { used: number; limit: number; remaining: number };
    limits: {
        maxVideoSizeMB: number;
        allowedExercises: string[] | "all";
        features: { fullReport: boolean };
    };
}

export default function AnalyzePage() {
    const [state, setState] = useState<AnalyzeState>("select");
    const [exerciseType, setExerciseType] = useState("squat");
    const [fitnessLevel, setFitnessLevel] = useState("intermediate");
    const [file, setFile] = useState<File | null>(null);
    const [feedback, setFeedback] = useState<ExerciseFeedback | null>(null);
    const [error, setError] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);
    const [sub, setSub] = useState<SubData | null>(null);

    useEffect(() => {
        fetch("/api/subscription")
            .then((r) => r.json())
            .then((d) => { if (d.success) setSub(d.data); })
            .catch(() => { });
    }, []);

    const isExerciseLocked = (exId: string) => {
        if (!sub) return false;
        if (sub.limits.allowedExercises === "all") return false;
        return !(sub.limits.allowedExercises as string[]).includes(exId);
    };

    const limitReached = sub ? sub.usage.remaining <= 0 : false;

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setState("uploading");
        setError("");

        try {
            const formData = new FormData();
            formData.append("video", file);
            formData.append("exerciseType", exerciseType);
            formData.append("fitnessLevel", fitnessLevel);

            setState("analyzing");

            const response = await fetch("/api/analyze", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Analysis failed");
            }

            setFeedback(data.data);
            setState("done");

            if (sub && data.meta) {
                setSub({
                    ...sub,
                    usage: {
                        ...sub.usage,
                        used: sub.usage.used + 1,
                        remaining: data.meta.analysesRemaining,
                    },
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong. Please check your network and try again.");
            setState("error");
        }
    };

    const reset = () => {
        setState("select");
        setFile(null);
        setFeedback(null);
        setError("");
    };

    const scoreColor = (score: number) =>
        score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-rose-400";

    const getScoreGradient = (score: number) => {
        if (score >= 85) return "from-emerald-400 to-teal-500 shadow-emerald-500/40";
        if (score >= 60) return "from-amber-400 to-orange-500 shadow-amber-500/40";
        return "from-rose-400 to-red-500 shadow-rose-500/40";
    };

    const severityConfigs = {
        critical: { icon: AlertTriangle, bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", badge: "bg-rose-500/20" },
        moderate: { icon: Activity, bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", badge: "bg-amber-500/20" },
        minor: { icon: CheckCircle2, bg: "bg-sky-500/10", border: "border-sky-500/30", text: "text-sky-400", badge: "bg-sky-500/20" }
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#0A0A0A]">
            {/* Immersive Background Gradients */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-[40rem] w-[40rem] rounded-full bg-indigo-600/10 blur-[120px]" />
                <div className="absolute top-1/2 left-1/4 h-[30rem] w-[30rem] -translate-y-1/2 rounded-full bg-sky-500/10 blur-[100px]" />
                <div className="absolute top-0 right-0 h-[25rem] w-[25rem] rounded-full bg-fuchsia-600/5 blur-[100px]" />
            </div>

            <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">

                {/* Header Section */}
                <div className="mb-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="group rounded-xl border border-white/10 bg-white/5 p-2.5 transition-all hover:border-white/20 hover:bg-white/10">
                            <ArrowLeft className="h-5 w-5 text-slate-400 transition-transform group-hover:-translate-x-1 group-hover:text-white" />
                        </Link>
                        <div>
                            <h1 className="bg-gradient-to-br from-white to-slate-400 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
                                AI Form Analysis
                            </h1>
                            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-400">
                                <Zap className="h-4 w-4 text-indigo-400" /> Powered by Groq & Mediapipe
                            </p>
                        </div>
                    </div>
                    {/* Usage Badge */}
                    {sub && state === "select" && (
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 backdrop-blur-md">
                            <div className={`relative h-2.5 w-2.5 rounded-full ${sub.usage.remaining > 0 ? "bg-emerald-400 shadow-[0_0_12px_#34d399]" : "bg-rose-400 shadow-[0_0_12px_#fb7185]"}`}>
                                <div className="absolute inset-0 animate-ping rounded-full opacity-50 bg-inherit" />
                            </div>
                            <span className="text-sm font-semibold text-white">
                                {sub.usage.remaining} <span className="text-slate-400 font-normal">credits left</span>
                            </span>
                        </div>
                    )}
                </div>

                {/* Limit Block */}
                {limitReached && state === "select" && (
                    <div className="animate-fade-in relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-black to-amber-900/20 p-8 text-center shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
                        <Crown className="mx-auto mb-5 h-14 w-14 text-amber-400" />
                        <h2 className="mb-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Monthly Limit Reached</h2>
                        <p className="mb-8 max-w-lg mx-auto text-slate-400">
                            You&apos;ve used all <strong className="text-white">{sub?.usage.limit}</strong> of your included analyses on the <strong>{sub?.planName}</strong> plan. Upgrade now to unlock unlimited potential.
                        </p>
                        <Link
                            href="/dashboard/subscription"
                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-400 px-8 py-4 text-sm font-bold tracking-wide text-amber-950 shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(245,158,11,0.5)]"
                        >
                            <Crown className="h-5 w-5" /> UPGRADE TO PRO <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                )}

                {/* Configuration State */}
                {state === "select" && !limitReached && (
                    <div className="grid gap-6 animate-fade-in lg:grid-cols-12">

                        {/* Left Column: Settings */}
                        <div className="space-y-6 lg:col-span-5">
                            {/* Exercise Grid */}
                            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-md transition-all hover:bg-white/[0.03]">
                                <h3 className="mb-5 flex items-center gap-2 text-sm font-extrabold tracking-wider text-slate-300 uppercase">
                                    <Activity className="h-4 w-4 text-indigo-400" /> Select Exercise
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {EXERCISES.map((ex) => {
                                        const locked = isExerciseLocked(ex.id);
                                        const isSelected = exerciseType === ex.id;
                                        return (
                                            <button
                                                key={ex.id}
                                                onClick={() => !locked && setExerciseType(ex.id)}
                                                disabled={locked}
                                                className={`group relative flex items-center justify-between overflow-hidden rounded-xl border p-3 text-left transition-all duration-300 ${locked
                                                    ? "cursor-not-allowed border-white/5 bg-black/40 text-slate-600"
                                                    : isSelected
                                                        ? "border-indigo-500/50 bg-gradient-to-br from-indigo-500/20 to-sky-500/10 text-white shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                                                        : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white"
                                                    }`}
                                            >
                                                <span className={`text-sm font-semibold tracking-tight ${locked ? "opacity-40" : ""}`}>{ex.name}</span>
                                                {locked && (
                                                    <Lock className="h-3.5 w-3.5 text-indigo-500/50" />
                                                )}
                                                {isSelected && (
                                                    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-400 to-sky-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Experience Level */}
                            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-md">
                                <h3 className="mb-5 flex items-center gap-2 text-sm font-extrabold tracking-wider text-slate-300 uppercase">
                                    <Trophy className="h-4 w-4 text-amber-400" /> Athlete Level
                                </h3>
                                <div className="flex flex-col gap-2 relative">
                                    {/* Active Highlight indicator line */}
                                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white/5 rounded-full" />

                                    {FITNESS_LEVELS.map((level) => (
                                        <button
                                            key={level.id}
                                            onClick={() => setFitnessLevel(level.id)}
                                            className={`relative flex items-center justify-between rounded-xl px-4 py-3.5 transition-all duration-300 ${fitnessLevel === level.id
                                                ? "bg-white/10 text-white"
                                                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                                }`}
                                        >
                                            <span className="text-sm font-bold">{level.label}</span>
                                            {fitnessLevel === level.id && (
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]">
                                                    <CheckCircle2 className="h-3 w-3 text-white" />
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Upload */}
                        <div className="flex flex-col gap-6 lg:col-span-7">
                            <div
                                onClick={() => fileRef.current?.click()}
                                className={`group relative flex flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed p-10 transition-all duration-500 ${file
                                    ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_40px_rgba(16,185,129,0.1)]"
                                    : "border-white/10 bg-white/[0.02] hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:shadow-[0_0_40px_rgba(99,102,241,0.1)]"
                                    }`}
                            >
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="video/mp4,video/quicktime,video/webm"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) handleFileSelect(f);
                                    }}
                                />

                                {/* Background glow effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                                <div className="relative z-10 flex flex-col items-center text-center">
                                    {file ? (
                                        <>
                                            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                                            </div>
                                            <p className="mb-2 text-2xl font-bold tracking-tight text-white">{file.name}</p>
                                            <p className="text-sm font-medium text-emerald-400/80">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready for Analysis</p>
                                            <button className="mt-8 rounded-full border border-white/10 bg-black/40 px-6 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white">
                                                Change Video
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white/5 shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                                                <Upload className="h-10 w-10 text-slate-400 transition-colors group-hover:text-indigo-400" />
                                            </div>
                                            <h3 className="mb-3 text-2xl font-bold tracking-tight text-white group-hover:text-indigo-50">Upload your form video</h3>
                                            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
                                                Drop an MP4, MOV, or WebM video here or click to browse files. Ensure your full body is visible.
                                            </p>
                                            {sub && (
                                                <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-1.5 backdrop-blur-md">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
                                                    <span className="text-xs font-semibold text-sky-300">Max size: {sub.limits.maxVideoSizeMB}MB</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={!file}
                                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-3xl bg-white px-8 py-5 text-lg font-black text-black transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] disabled:pointer-events-none disabled:opacity-50 disabled:grayscale"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <Zap className="h-5 w-5 fill-black" /> EXTRACT KINEMATICS
                                </span>
                                {/* Button hover glow */}
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-sky-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Processing States */}
                {(state === "uploading" || state === "analyzing") && (
                    <div className="flex min-h-[50vh] flex-col items-center justify-center animate-in fade-in duration-500">
                        <div className="relative mb-8 flex h-32 w-32 items-center justify-center">
                            {/* Animated scanning rings */}
                            <div className="absolute inset-0 animate-ping rounded-full border-2 border-indigo-500/30" style={{ animationDuration: '3s' }} />
                            <div className="absolute inset-2 animate-ping rounded-full border-2 border-sky-500/40" style={{ animationDuration: '2s' }} />
                            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-indigo-600 to-sky-500 blur-xl opacity-50 animate-pulse" />

                            {/* Rotating core */}
                            <div className="relative z-10 flex h-20 w-20 animate-spin items-center justify-center rounded-full bg-black/50 shadow-[0_0_30px_rgba(99,102,241,0.5)] backdrop-blur-xl border border-white/10">
                                <Loader2 className="h-8 w-8 text-white" />
                            </div>
                        </div>

                        <h2 className="mb-3 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-3xl font-black text-transparent">
                            {state === "uploading" ? "Encrypting & Uploading" : "Running Deep Analysis"}
                        </h2>

                        <div className="flex flex-col items-center gap-2">
                            <p className="text-base font-medium text-slate-400">
                                {state === "uploading"
                                    ? "Securely transferring to our processing cluster..."
                                    : "Extracting 3D pose landmarks and measuring joint angles..."}
                            </p>

                            {/* Fake progress bar */}
                            <div className="mt-6 h-1 w-64 overflow-hidden rounded-full bg-white/10">
                                <div className="h-full w-1/3 animate-[progress_2s_ease-in-out_infinite_alternate] rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 shadow-[0_0_10px_#6366f1]" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {state === "error" && (
                    <div className="mx-auto max-w-xl animate-in zoom-in-95 duration-300">
                        <div className="relative overflow-hidden rounded-3xl border border-rose-500/30 bg-black/60 p-10 text-center shadow-[0_0_50px_rgba(225,29,72,0.1)] backdrop-blur-xl">
                            <div className="absolute top-0 right-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-rose-500/20 blur-[80px]" />

                            <div className="relative z-10">
                                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                                    <AlertTriangle className="h-10 w-10 text-rose-500" />
                                </div>
                                <h2 className="mb-3 text-2xl font-bold tracking-tight text-white">System Malfunction</h2>
                                <p className="mb-8 font-medium text-rose-200/70">{error}</p>

                                <button
                                    onClick={reset}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 px-6 py-4 text-sm font-bold tracking-wide text-rose-300 transition-all hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                                >
                                    <RefreshCw className="h-4 w-4" /> INITIATE REBOOT
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Beautiful Results Section */}
                {state === "done" && feedback && (
                    <div className="mx-auto max-w-5xl space-y-8 animate-in slide-in-from-bottom-8 duration-700">

                        {/* Premium Hero Score Card */}
                        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-2xl sm:p-12">
                            {/* Background ambient lighting based on score */}
                            <div className={`absolute -right-20 -top-20 h-96 w-96 rounded-full blur-[100px] opacity-40 bg-gradient-to-br ${getScoreGradient(feedback.score).replace('shadow-', '').split(' ')[0]} ${getScoreGradient(feedback.score).replace('shadow-', '').split(' ')[1]}`} />

                            <div className="relative z-10 flex flex-col items-center gap-10 lg:flex-row lg:justify-between lg:text-left text-center">

                                {/* Left Text Data */}
                                <div className="space-y-6">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
                                        <div className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">Analysis Complete</span>
                                    </div>

                                    <div>
                                        <h2 className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-5xl font-black capitalize tracking-tighter text-transparent sm:text-6xl">
                                            {feedback.exerciseDetected || exerciseType.replace("-", " ")}
                                        </h2>

                                        <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-4">
                                            {/* Data Chips */}
                                            {feedback.repCount !== null && (
                                                <div className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 border border-white/5">
                                                    <Activity className="h-4 w-4 text-indigo-400" />
                                                    <span className="text-sm font-bold text-white">{feedback.repCount} <span className="text-slate-500">Reps</span></span>
                                                </div>
                                            )}
                                            {feedback.overallTier && (
                                                <div className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 border border-white/5">
                                                    <Award className="h-4 w-4 text-amber-400" />
                                                    <span className="text-sm font-bold text-white">{feedback.overallTier} <span className="text-slate-500">Form</span></span>
                                                </div>
                                            )}
                                            {feedback.estimatedCalorieBurn && (
                                                <div className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 border border-white/5">
                                                    <Flame className="h-4 w-4 text-orange-400" />
                                                    <span className="text-sm font-bold text-white">{feedback.estimatedCalorieBurn} <span className="text-slate-500">kcal</span></span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Radial Score Chart */}
                                <div className="relative flex shrink-0 flex-col items-center justify-center">
                                    <div className="relative flex h-48 w-48 items-center justify-center">
                                        {/* Outer glow */}
                                        <div className={`absolute inset-0 rounded-full blur-2xl opacity-60 bg-gradient-to-br ${getScoreGradient(feedback.score).split(' ')[0]} ${getScoreGradient(feedback.score).split(' ')[1]}`} />

                                        {/* Background Circle */}
                                        <svg className="absolute h-full w-full rotate-[-90deg] transform" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                            {/* Animated Progress Circle */}
                                            <circle
                                                cx="50" cy="50" r="45"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="8"
                                                strokeLinecap="round"
                                                strokeDasharray={`${(feedback.score / 100) * 283} 283`}
                                                className={`transition-all duration-1500 ease-out ${scoreColor(feedback.score)}`}
                                            />
                                        </svg>

                                        {/* Inside number */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 shadow-inner backdrop-blur-xl border border-white/10 m-3">
                                            <span className={`text-5xl font-black tracking-tighter ${scoreColor(feedback.score)}`}>
                                                {feedback.score}
                                            </span>
                                            <span className="mt-1 text-xs font-bold uppercase tracking-widest text-white/30">Form Score</span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* High-Level Summary Card */}
                        <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-8 backdrop-blur-md">
                            <h3 className="mb-4 text-xl font-bold tracking-tight text-white flex items-center gap-2">
                                <Activity className="h-5 w-5 text-indigo-400" />
                                Kinematic Overview
                            </h3>
                            <p className="text-lg leading-relaxed text-slate-300 font-medium">
                                {feedback.summary}
                            </p>

                            {/* Targeted Muscles Tags (if provided by new LLM) */}
                            {feedback.muscleGroupsTargeted && feedback.muscleGroupsTargeted.length > 0 && (
                                <div className="my-6 border-t border-white/5 pt-6 flex items-center gap-4 flex-wrap">
                                    <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Targeted Muscle Groups:</span>
                                    {feedback.muscleGroupsTargeted.map((muscle) => (
                                        <span key={muscle} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-slate-300">
                                            {muscle}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Grid Breakdown */}
                        <div className="grid gap-6 md:grid-cols-2">

                            {/* Left Column: Strengths & Corrections */}
                            <div className="space-y-6">
                                {/* Good Points */}
                                {feedback.goodPoints.length > 0 && (
                                    <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 shadow-[0_0_30px_rgba(16,185,129,0.05)] transition-colors hover:bg-emerald-500/10">
                                        <h3 className="mb-6 flex items-center gap-3 text-lg font-bold text-emerald-400">
                                            <div className="rounded-lg bg-emerald-500/20 p-2"><CheckCircle2 className="h-5 w-5" /></div>
                                            Biomechanical Strengths
                                        </h3>
                                        <ul className="space-y-4">
                                            {feedback.goodPoints.map((point, i) => (
                                                <li key={i} className="flex gap-3 text-slate-300">
                                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_#34d399]" />
                                                    <span className="font-medium leading-relaxed">{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Corrections */}
                                {feedback.corrections.length > 0 && (
                                    <div className="rounded-3xl border border-sky-500/20 bg-sky-500/5 p-8 shadow-[0_0_30px_rgba(14,165,233,0.05)] transition-colors hover:bg-sky-500/10">
                                        <h3 className="mb-6 flex items-center gap-3 text-lg font-bold text-sky-400">
                                            <div className="rounded-lg bg-sky-500/20 p-2"><MoveRight className="h-5 w-5" /></div>
                                            Form Corrections
                                        </h3>
                                        <ul className="space-y-4">
                                            {feedback.corrections.map((c, i) => (
                                                <li key={i} className="flex gap-3 text-slate-300">
                                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500 shadow-[0_0_8px_#38bdf8]" />
                                                    <span className="font-medium leading-relaxed">{c}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Issues & Safety */}
                            <div className="space-y-6">
                                {/* Detailed Issues */}
                                {(feedback.issues.length > 0 || feedback.safetyWarnings.length > 0) && (
                                    <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-md">
                                        <h3 className="mb-6 flex items-center gap-3 text-lg font-bold text-white">
                                            <div className="rounded-lg bg-white/10 p-2"><AlertTriangle className="h-5 w-5 text-rose-400" /></div>
                                            Vulnerabilities & Hazards
                                        </h3>

                                        <div className="space-y-4">
                                            {/* Map Issues */}
                                            {feedback.issues.map((issue, i) => {
                                                const conf = severityConfigs[issue.severity] || severityConfigs.moderate;
                                                const Icon = conf.icon;
                                                return (
                                                    <div key={i} className={`rounded-2xl border p-5 ${conf.bg} ${conf.border}`}>
                                                        <div className="mb-3 flex flex-wrap items-center gap-2">
                                                            <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-black uppercase tracking-wider ${conf.badge} ${conf.text}`}>
                                                                <Icon className="h-3 w-3" /> {issue.severity}
                                                            </span>
                                                            <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                                                                {issue.body_part}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-medium leading-relaxed text-slate-300">{issue.description}</p>
                                                    </div>
                                                );
                                            })}

                                            {/* Map Safety specific warnings */}
                                            {feedback.safetyWarnings.map((warning, i) => (
                                                <div key={`safe-${i}`} className={`rounded-2xl border p-5 bg-rose-500/10 border-rose-500/30`}>
                                                    <div className="mb-3 flex items-center gap-2">
                                                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-400`}>
                                                            <AlertTriangle className="h-3 w-3" /> DANGER
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium leading-relaxed text-slate-300">{warning}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="mt-12 flex flex-col justify-between gap-4 sm:flex-row items-center border-t border-white/10 pt-8">
                            <button
                                onClick={reset}
                                className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold tracking-wide text-white transition-all hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                            >
                                <RefreshCw className="h-4 w-4 transition-transform group-hover:rotate-180" /> START NEW ANALYSIS
                            </button>

                            <Link
                                href="/dashboard/history"
                                className="group relative flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-black tracking-wide text-black transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                            >
                                VIEW FULL HISTORY <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>

                    </div>
                )}
            </div>

            {/* Ambient CSS Keyframes inside the component (can be moved to global css if desired) */}
            <style jsx global>{`
                @keyframes progress {
                    0% { width: 0%; opacity: 0.5; }
                    100% { width: 100%; opacity: 1; }
                }
            `}</style>
        </div>
    );
}
