import fs from 'fs';
import path from 'path';
import { ESLint } from 'eslint';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  dependencies: string[];
  imports: string[];
  exports: string[];
  complexity: number;
  issues: string[];
  children?: FileNode[];
  position?: [number, number, number];
}

interface AnalysisResult {
  structure: FileNode;
  dependencies: Map<string, string[]>;
  metrics: {
    totalFiles: number;
    totalSize: number;
    averageComplexity: number;
    issueCount: number;
  };
}

export class FileSystemAnalyzer {
  private eslint: ESLint;
  private ignoredPatterns: string[];

  constructor() {
    this.eslint = new ESLint({
      useEslintrc: true,
      fix: false
    });

    this.ignoredPatterns = [
      'node_modules',
      '.git',
      '.next',
      'dist',
      'build'
    ];
  }

  async analyzeProject(rootPath: string): Promise<AnalysisResult> {
    const structure = await this.buildFileTree(rootPath);
    const dependencies = await this.analyzeDependencies(structure);
    const metrics = this.calculateMetrics(structure);

    return {
      structure,
      dependencies,
      metrics
    };
  }

  private async buildFileTree(dirPath: string, parentId: string = ''): Promise<FileNode> {
    const name = path.basename(dirPath);
    const id = parentId ? `${parentId}/${name}` : name;
    const stats = await fs.promises.stat(dirPath);

    if (stats.isDirectory()) {
      if (this.ignoredPatterns.includes(name)) {
        return null;
      }

      const children = await Promise.all(
        (await fs.promises.readdir(dirPath))
          .map(child => this.buildFileTree(path.join(dirPath, child), id))
      );

      const validChildren = children.filter(Boolean);

      return {
        id,
        name,
        path: dirPath,
        type: 'directory',
        size: validChildren.reduce((acc, child) => acc + child.size, 0),
        dependencies: [],
        imports: [],
        exports: [],
        complexity: 0,
        issues: [],
        children: validChildren
      };
    } else {
      const analysis = await this.analyzeFile(dirPath);
      return {
        id,
        name,
        path: dirPath,
        type: 'file',
        size: stats.size,
        ...analysis
      };
    }
  }

  private async analyzeFile(filePath: string): Promise<Partial<FileNode>> {
    const ext = path.extname(filePath);
    const content = await fs.promises.readFile(filePath, 'utf8');
    let dependencies = [];
    let imports = [];
    let exports = [];
    let complexity = 0;
    let issues = [];

    // Analyze based on file type
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      try {
        const ast = parse(content, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript']
        });

        traverse(ast, {
          ImportDeclaration(path) {
            imports.push(path.node.source.value);
          },
          ExportNamedDeclaration(path) {
            if (path.node.source) {
              exports.push(path.node.source.value);
            }
          }
        });

        // Calculate complexity
        complexity = this.calculateComplexity(ast);

        // Get ESLint issues
        const results = await this.eslint.lintText(content, { filePath });
        issues = results[0]?.messages.map(msg => msg.message) || [];

      } catch (error) {
        console.error(`Error analyzing ${filePath}:`, error);
      }
    }

    return {
      dependencies,
      imports,
      exports,
      complexity,
      issues
    };
  }

  private calculateComplexity(ast: any): number {
    let complexity = 0;
    traverse(ast, {
      'IfStatement|WhileStatement|ForStatement|ForInStatement|ForOfStatement'() {
        complexity++;
      },
      'LogicalExpression'() {
        complexity++;
      },
      'ConditionalExpression'() {
        complexity++;
      }
    });
    return complexity;
  }

  private async analyzeDependencies(node: FileNode): Promise<Map<string, string[]>> {
    const dependencies = new Map<string, string[]>();
    
    const traverse = (node: FileNode) => {
      if (node.imports.length > 0) {
        dependencies.set(node.path, node.imports);
      }
      node.children?.forEach(traverse);
    };

    traverse(node);
    return dependencies;
  }

  private calculateMetrics(node: FileNode) {
    let totalFiles = 0;
    let totalSize = 0;
    let totalComplexity = 0;
    let totalIssues = 0;

    const traverse = (node: FileNode) => {
      if (node.type === 'file') {
        totalFiles++;
        totalSize += node.size;
        totalComplexity += node.complexity;
        totalIssues += node.issues.length;
      }
      node.children?.forEach(traverse);
    };

    traverse(node);

    return {
      totalFiles,
      totalSize,
      averageComplexity: totalFiles > 0 ? totalComplexity / totalFiles : 0,
      issueCount: totalIssues
    };
  }
}