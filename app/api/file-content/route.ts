import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Maximum file size to read (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Security check: Ensure the path is within the project directory
    const normalizedPath = path.normalize(filePath);
    const projectRoot = process.cwd();
    
    if (!normalizedPath.startsWith(projectRoot)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 403 }
      );
    }

    // Check file size before reading
    const stats = await fs.stat(normalizedPath);
    if (stats.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large' },
        { status: 413 }
      );
    }

    const content = await fs.readFile(normalizedPath, 'utf-8');
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json(
      { error: 'Error reading file' },
      { status: 500 }
    );
  }
}