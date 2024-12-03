import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { simpleGit } from 'simple-git';
import os from 'os';

export const dynamic = 'force-dynamic';

async function ensureDirectory(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { repoUrl } = data;
    
    if (!repoUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      );
    }

    const tmpDir = path.join(os.tmpdir(), 'codescape-projects');
    await ensureDirectory(tmpDir);
    
    const repoDir = path.join(tmpDir, `codescape-${Date.now()}`);
    await ensureDirectory(repoDir);

    console.log('Cloning repository:', repoUrl);
    console.log('Into directory:', repoDir);

    const git = simpleGit();
    await git.clone(repoUrl, repoDir);

    // Verify clone was successful
    const dirContents = await fs.readdir(repoDir);
    console.log('Repository contents:', dirContents);

    return NextResponse.json({ 
      success: true,
      path: repoDir,
      files: dirContents 
    });

  } catch (error: any) {
    console.error('GitHub clone error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clone repository' },
      { status: 500 }
    );
  }
}