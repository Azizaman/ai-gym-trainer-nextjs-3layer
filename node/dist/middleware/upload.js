"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/uploads';
// Ensure directory exists
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const jobId = (0, uuid_1.v4)();
        req.body.jobId = jobId; // Attach jobId to the request for the route to use
        cb(null, `${jobId}${ext}`);
    }
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100 MB max file size
    }
});
