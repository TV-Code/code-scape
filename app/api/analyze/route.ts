import { NextRequest, NextResponse } from 'next/server';
import { ProjectAnalyzer } from '@/lib/analyzers/project-analyzer';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';

async function isAccessible(dirPath: string): Promise<boolean> {
  try {
    await fs.access(dirPath);
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { path: projectPath } = await request.json();
    console.log('\n=== Starting Project Analysis API ===');
    console.log('Requested path:', projectPath);

    if (!projectPath) {
      return NextResponse.json(
        { error: 'Project path is required' },
        { status: 400 }
      );
    }

    // Verify directory exists and is accessible
    const accessible = await isAccessible(projectPath);
    if (!accessible) {
      console.error('Directory not accessible:', projectPath);
      return NextResponse.json(
        { error: 'Directory does not exist or is not accessible' },
        { status: 400 }
      );
    }

    console.log('Directory verified, starting analysis...');

    // Create analyzer instance
    const analyzer = new ProjectAnalyzer(projectPath, {
      excludePatterns: [
        'node_modules',
        '.git',
        '.next',
        'dist',
        'build',
        'coverage',
        '.DS_Store'
      ]
    });

    // Analyze the project
    console.log('Running analyzer...');
    const structure = await analyzer.analyze();

    // Log analysis summary
    console.log('\n=== Analysis Summary ===');
    function countNodes(node: any): { files: number; dirs: number } {
      let files = node.type === 'file' ? 1 : 0;
      let dirs = node.type === 'directory' ? 1 : 0;
      
      if (node.children) {
        node.children.forEach((child: any) => {
          const counts = countNodes(child);
          files += counts.files;
          dirs += counts.dirs;
        });
      }
      return { files, dirs };
    }

    const counts = countNodes(structure);
    console.log('Total Files:', counts.files);
    console.log('Total Directories:', counts.dirs);
    console.log('Total Size:', structure.size, 'bytes');

    return NextResponse.json({
      success: true,
      structure,
      summary: {
        totalFiles: counts.files,
        totalDirectories: counts.dirs,
        totalSize: structure.size
      }
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze project' },
      { status: 500 }
    );
  }
}