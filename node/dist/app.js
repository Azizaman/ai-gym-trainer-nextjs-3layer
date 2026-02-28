"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = require("dotenv");
const analyze_1 = __importDefault(require("./routes/analyze"));
const results_1 = __importDefault(require("./routes/results"));
require("./workers/analysisWorker"); // start the BullMQ worker
(0, dotenv_1.config)();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api', analyze_1.default);
app.use('/api', results_1.default);
// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'node-api' });
});
exports.default = app;
