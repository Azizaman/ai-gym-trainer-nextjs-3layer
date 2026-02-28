import { Request, Response, NextFunction } from 'express';
import ffprobe from 'ffprobe';
import ffprobeStatic from 'ffprobe-static';
import fs from 'fs';

export async function validateVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    const file = req.file;
    if (!file) {
        res.status(400).json({ error: 'no_file' });
        return;
    }

    // Check MIME type
    const allowed = ['video/mp4', 'video/quicktime', 'video/avi', 'video/webm'];
    if (!allowed.includes(file.mimetype)) {
        fs.unlinkSync(file.path);
        res.status(400).json({ error: 'invalid_file_type' });
        return;
    }

    try {
        // Check video duration with ffprobe
        const info = await ffprobe(file.path, { path: ffprobeStatic.path });
        const durationStr = info.streams[0]?.duration;

        if (!durationStr) {
            fs.unlinkSync(file.path);
            res.status(400).json({ error: 'unreadable_video' });
            return;
        }

        const duration = parseFloat(durationStr);
        const maxSeconds = parseInt(process.env.MAX_VIDEO_SECONDS || '60');

        if (duration > maxSeconds) {
            fs.unlinkSync(file.path); // delete immediately
            res.status(400).json({
                error: 'video_too_long',
                message: `Video must be under ${maxSeconds} seconds. Got ${Math.round(duration)}s.`
            });
            return;
        }

        next();
    } catch (error) {
        fs.unlinkSync(file.path);
        res.status(500).json({ error: 'video_validation_failed' });
    }
}
