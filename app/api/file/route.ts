import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import { validateFilePath, normalizeFilePath, logger } from '@/lib/utils/file-access';

export async function POST(req: NextRequest) {
    try {
        const { path } = await req.json();
        
        if (!path) {
            logger.fileAccess('undefined', false, 'No path provided');
            return NextResponse.json(
                { error: 'No path provided' }, 
                { status: 400 }
            );
        }

        const normalizedPath = normalizeFilePath(path);
        const validPath = validateFilePath(normalizedPath);

        if (!validPath) {
            logger.fileAccess(normalizedPath, false, 'Invalid path');
            return NextResponse.json(
                { error: 'Invalid path' }, 
                { status: 400 }
            );
        }

        // Check if file exists
        try {
            await fs.access(validPath);
        } catch {
            logger.fileAccess(validPath, false, 'File not found');
            return NextResponse.json(
                { error: 'File not found' }, 
                { status: 404 }
            );
        }

        // Read file
        const content = await fs.readFile(validPath, 'utf-8');
        
        if (content === undefined) {
            logger.fileAccess(validPath, false, 'Failed to read content');
            return NextResponse.json(
                { error: 'Failed to read file content' }, 
                { status: 500 }
            );
        }

        logger.fileAccess(validPath, true);
        return NextResponse.json({ 
            content,
            path: validPath,
            size: Buffer.from(content).length
        });

    } catch (error) {
        logger.fileAccess('unknown', false, error);
        console.error('Error reading file:', error);
        return NextResponse.json(
            { 
                error: 'Failed to read file', 
                details: error instanceof Error ? error.message : 'Unknown error'
            }, 
            { status: 500 }
        );
    }
}