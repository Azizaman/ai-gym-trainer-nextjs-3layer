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
        // Validation for duration is disabled server-side to save disk space 
        // on VPS (avoids needing ffmpeg). Frontend should handle duration limits.
        next();
    } catch (error) {
        fs.unlinkSync(file.path);
        res.status(500).json({ error: 'video_validation_failed' });
    }
}
