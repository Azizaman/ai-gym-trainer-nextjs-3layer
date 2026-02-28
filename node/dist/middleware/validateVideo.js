"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateVideo = validateVideo;
const ffprobe_1 = __importDefault(require("ffprobe"));
const ffprobe_static_1 = __importDefault(require("ffprobe-static"));
const fs_1 = __importDefault(require("fs"));
async function validateVideo(req, res, next) {
    const file = req.file;
    if (!file) {
        res.status(400).json({ error: 'no_file' });
        return;
    }
    // Check MIME type
    const allowed = ['video/mp4', 'video/quicktime', 'video/avi', 'video/webm'];
    if (!allowed.includes(file.mimetype)) {
        fs_1.default.unlinkSync(file.path);
        res.status(400).json({ error: 'invalid_file_type' });
        return;
    }
    try {
        // Check video duration with ffprobe
        const info = await (0, ffprobe_1.default)(file.path, { path: ffprobe_static_1.default.path });
        const durationStr = info.streams[0]?.duration;
        if (!durationStr) {
            fs_1.default.unlinkSync(file.path);
            res.status(400).json({ error: 'unreadable_video' });
            return;
        }
        const duration = parseFloat(durationStr);
        const maxSeconds = parseInt(process.env.MAX_VIDEO_SECONDS || '60');
        if (duration > maxSeconds) {
            fs_1.default.unlinkSync(file.path); // delete immediately
            res.status(400).json({
                error: 'video_too_long',
                message: `Video must be under ${maxSeconds} seconds. Got ${Math.round(duration)}s.`
            });
            return;
        }
        next();
    }
    catch (error) {
        fs_1.default.unlinkSync(file.path);
        res.status(500).json({ error: 'video_validation_failed' });
    }
}
