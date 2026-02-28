"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.visionClient = void 0;
const axios_1 = __importDefault(require("axios"));
const VISION_SERVICE_URL = process.env.VISION_SERVICE_URL || 'http://localhost:5000';
exports.visionClient = {
    analyze: async (filePath, exercise) => {
        try {
            const response = await axios_1.default.post(`${VISION_SERVICE_URL}/analyze`, {
                file_path: filePath,
                exercise: exercise
            }, {
                timeout: 120000 // 2 minutes timeout for video processing
            });
            return response.data;
        }
        catch (error) {
            console.error('Error calling vision service:', error);
            throw new Error('Vision analysis failed');
        }
    }
};
