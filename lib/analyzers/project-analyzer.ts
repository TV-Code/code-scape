import fs from 'fs/promises';
import path from 'path';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  size: number;
  category: string;
  depth: number;
  parentId?: string;
  children?: FileNode[];
  imports: string[];
  exports: string[];
  dependencies: any[];
  complexity: number;
}

export class ProjectAnalyzer {
  private excludePatterns: string[];

  constructor(
    private readonly projectPath: string,
    private readonly options: {
      excludePatterns?: string[];
      maxDepth?: number;
    } = {}
  ) {
    this.excludePatterns = options.excludePatterns || [
      'node_modules',
      '.git',
      '.next',
      'dist',
      'build'
    ];
  }

  async analyze(): Promise<FileNode> {
    try {
      console.log('Starting analysis of:', this.projectPath);
      return await this.processDirectory(this.projectPath);
    } catch (error) {
      console.error('Analysis failed:', error);
      throw error;
    }
  }

  private async processDirectory(dirPath: string, parentId: string = '', depth: number = 0): Promise<FileNode> {
    const stats = await fs.stat(dirPath);
    const name = path.basename(dirPath);
    const id = parentId ? `${parentId}/${name}` : name;

    // Log the current directory being processed
    console.log(`Processing directory: ${dirPath}`);

    if (!stats.isDirectory()) {
      return this.processFile(dirPath, parentId, depth);
    }

    try {
      const entries = await fs.readdir(dirPath);
      const children: FileNode[] = [];

      for (const entry of entries) {
        // Skip excluded patterns
        if (this.shouldExclude(entry)) {
          console.log(`Skipping excluded entry: ${entry}`);
          continue;
        }

        const fullPath = path.join(dirPath, entry);
        try {
          const entryStats = await fs.stat(fullPath);
          
          if (entryStats.isDirectory()) {
            const childNode = await this.processDirectory(fullPath, id, depth + 1);
            children.push(childNode);
          } else {
            const childNode = await this.processFile(fullPath, id, depth + 1);
            children.push(childNode);
          }
        } catch (error) {
          console.error(`Error processing ${fullPath}:`, error);
          // Continue with other entries
        }
      }

      // Sort children: directories first, then files alphabetically
      children.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type === 'directory' ? -1 : 1;
      });

      const node: FileNode = {
        id,
        name,
        type: 'directory',
        path: dirPath,
        size: children.reduce((sum, child) => sum + child.size, 0),
        category: 'directory',
        depth,
        parentId: parentId || undefined,
        children,
        imports: [],
        exports: [],
        dependencies: [],
        complexity: children.reduce((sum, child) => sum + child.complexity, 0)
      };

      console.log(`Processed directory ${name}: ${children.length} children`);
      return node;

    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
      throw error;
    }
  }

  private async processFile(filePath: string, parentId: string, depth: number): Promise<FileNode> {
    const stats = await fs.stat(filePath);
    const name = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const id = `${parentId}/${name}`;

    console.log(`Processing file: ${filePath}`);

    return {
      id,
      name,
      type: 'file',
      path: filePath,
      size: stats.size,
      category: this.categorizeFile(filePath),
      depth,
      parentId,
      imports: [],
      exports: [],
      dependencies: [],
      complexity: await this.calculateComplexity(filePath, ext)
    };
  }

  private shouldExclude(name: string): boolean {
    return this.excludePatterns.some(pattern => {
      if (pattern.startsWith('*')) {
        return name.endsWith(pattern.slice(1));
      }
      return name === pattern || name.startsWith(pattern + '/');
    });
  }

  private categorizeFile(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const relativePath = path.relative(this.projectPath, filePath).toLowerCase();

    if (relativePath.includes('/components/') || 
        /\.(jsx|tsx)$/.test(ext) && /^[A-Z]/.test(path.basename(filePath))) {
      return 'component';
    }
    if (relativePath.includes('/pages/')) return 'page';
    if (relativePath.includes('/layouts/')) return 'layout';
    if (relativePath.includes('/hooks/')) return 'hook';
    if (['.css', '.scss', '.sass', '.less'].includes(ext)) return 'style';
    if (relativePath.includes('/api/')) return 'api';
    if (relativePath.includes('/utils/')) return 'util';
    if (relativePath.includes('/lib/')) return 'lib';
    if (relativePath.includes('/types/') || ext === '.d.ts') return 'types';
    if (relativePath.includes('/test/') || ext === '.test.ts' || ext === '.spec.ts') return 'test';
    if (ext === '.json') return 'config';
    return 'other';
  }

  private async calculateComplexity(filePath: string, ext: string): Promise<number> {
    try {
      if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        const content = await fs.readFile(filePath, 'utf-8');
        // Basic complexity calculation
        const lines = content.split('\n').length;
        const functions = (content.match(/function|=>|class/g) || []).length;
        const controlFlow = (content.match(/if|for|while|switch|catch/g) || []).length;
        return Math.log(lines + 1) + functions + controlFlow;
      }
    } catch (error) {
      console.error(`Error calculating complexity for ${filePath}:`, error);
    }
    return 1;
  }
}