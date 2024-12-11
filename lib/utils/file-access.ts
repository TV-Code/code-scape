import { resolve, relative } from 'path';

export const validateFilePath = (path: string): string | null => {
    try {
        // Handle paths in temporary directories specifically for codescape projects
        if (path.includes('codescape-projects')) {
            return path; // Trust paths that are already in our temp project directory
        }

        // For other paths, ensure they're safe
        if (path.includes('..')) {
            console.warn(`Path traversal attempt blocked: ${path}`);
            return null;
        }

        // Check for sensitive paths we never want to access
        const sensitivePatterns = [
            'node_modules',
            '.git',
            '.env',
        ];

        if (sensitivePatterns.some(pattern => path.includes(pattern))) {
            console.warn(`Attempted access to sensitive directory: ${path}`);
            return null;
        }

        return path;
    } catch (error) {
        console.error('Path validation error:', error);
        return null;
    }
};

export const normalizeFilePath = (path: string): string => {
    // Remove any leading/trailing whitespace
    path = path.trim();

    // Handle Windows-style paths
    path = path.replace(/\\/g, '/');

    // Remove duplicate slashes
    path = path.replace(/\/+/g, '/');

    return path;
};

export const logger = {
    fileAccess: (path: string, success: boolean, error?: any) => {
        if (success) {
            console.log(`✅ File access successful: ${path}`);
        } else {
            console.error(`❌ File access failed: ${path}`, error);
        }
    }
};