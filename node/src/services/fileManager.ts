import fs from 'fs';

export const fileManager = {
    deleteFile: (filePath: string): Promise<void> => {
        return new Promise((resolve) => {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Failed to delete temporary file ${filePath}:`, err);
                }
                // Always resolve, we don't want to crash the worker if cleanup fails
                resolve();
            });
        });
    }
};
