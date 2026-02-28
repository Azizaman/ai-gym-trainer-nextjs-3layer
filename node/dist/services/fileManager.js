"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileManager = void 0;
const fs_1 = __importDefault(require("fs"));
exports.fileManager = {
    deleteFile: (filePath) => {
        return new Promise((resolve) => {
            fs_1.default.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Failed to delete temporary file ${filePath}:`, err);
                }
                // Always resolve, we don't want to crash the worker if cleanup fails
                resolve();
            });
        });
    }
};
