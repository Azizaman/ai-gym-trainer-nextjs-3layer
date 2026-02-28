import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/uploads';

// Ensure directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const jobId = uuidv4();
        req.body.jobId = jobId; // Attach jobId to the request for the route to use
        cb(null, `${jobId}${ext}`);
    }
});

export const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100 MB max file size
    }
});
