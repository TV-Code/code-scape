import fs from 'fs/promises';
import path from 'path';
import { analyzeDependencies } from './dependency-analyzer';

const CATEGORIES = [
  'component',   // React/UI Components
  'page',        // Next.js/Route pages
  'layout',      // Layout components
  'hook',        // React hooks
  'context',     // Context providers
  'api',         // API routes/handlers
  'style',       // Style files
  'util',        // Utility functions
  'types',       // Type definitions
  'test',        // Test files
  'config',      // Configuration files
  'directory',   // Directories
  'other'        // Other files
] as const;

type Category = typeof CATEGORIES[number];

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  size: number;
  category: Category;
  depth: number;
  parentId?: string;
  children?: FileNode[];
  imports: string[];
  exports: string[];
  dependencies: string[];
  importedBy: string[];
  complexity: number;
}

export class ProjectAnalyzer {
  private fileMapping: Record<string, FileNode> = {};

  constructor(
    private readonly projectPath: string,
    private readonly options: {
      excludePatterns?: string[];
      maxDepth?: number;
    } = {}
  ) {
    this.options.excludePatterns = [
      'node_modules',
      '.git',
      '.next',
      'dist',
      'build',
      'coverage',
      ...this.options.excludePatterns || []
    ];
  }

  async analyze(): Promise<FileNode> {
    try {
      // First pass: Build file tree
      const rootNode = await this.processDirectory(this.projectPath);
      
      // Second pass: Analyze dependencies
      await this.analyzeDependencies();
      
      // Third pass: Calculate final metrics
      this.calculateMetrics(rootNode);
      
      return rootNode;
    } catch (error) {
      console.error('Analysis failed:', error);
      throw error;
    }
  }

  private async processDirectory(dirPath: string, parentId: string = '', depth: number = 0): Promise<FileNode> {
    const stats = await fs.stat(dirPath);
    const name = path.basename(dirPath);
    const id = parentId ? `${parentId}/${name}` : name;

    if (!stats.isDirectory()) {
      return this.processFile(dirPath, parentId, depth);
    }

    const entries = await fs.readdir(dirPath);
    const children: FileNode[] = [];

    for (const entry of entries) {
      if (this.shouldExclude(entry)) continue;

      try {
        const fullPath = path.join(dirPath, entry);
        const stats = await fs.stat(fullPath);
        const childNode = stats.isDirectory()
          ? await this.processDirectory(fullPath, id, depth + 1)
          : await this.processFile(fullPath, id, depth + 1);

        children.push(childNode);
        this.fileMapping[childNode.path] = childNode;
      } catch (error) {
        console.error(`Error processing ${entry}:`, error);
      }
    }

    // Sort children by type and category
    children.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const node: FileNode = {
      id,
      name,
      type: 'directory',
      path: dirPath,
      size: children.reduce((sum, child) => sum + child.size, 0),
      category: this.categorizeDirectory(dirPath),
      depth,
      parentId: parentId || undefined,
      children,
      imports: [],
      exports: [],
      dependencies: [],
      importedBy: [],
      complexity: children.reduce((sum, child) => sum + child.complexity, 0)
    };

    this.fileMapping[node.path] = node;
    return node;
  }

  private async processFile(filePath: string, parentId: string, depth: number): Promise<FileNode> {
    const stats = await fs.stat(filePath);
    const name = path.basename(filePath);
    const id = `${parentId}/${name}`;

    // Analyze imports and exports
    const { imports, exports } = await analyzeDependencies(filePath);

    const node: FileNode = {
      id,
      name,
      type: 'file',
      path: filePath,
      size: stats.size,
      category: this.categorizeFile(filePath),
      depth,
      parentId,
      imports,
      exports,
      dependencies: [],
      importedBy: [],
      complexity: await this.calculateComplexity(filePath)
    };

    this.fileMapping[node.path] = node;
    return node;
  }

  private categorizeFile(filePath: string): Category {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath);
    const relPath = path.relative(this.projectPath, filePath).toLowerCase();
    const segments = relPath.split(path.sep);

    // Next.js app directory patterns
    if (segments.includes('app')) {
      if (/page\.(tsx?|jsx?)$/.test(basename)) return 'page';
      if (/layout\.(tsx?|jsx?)$/.test(basename)) return 'layout';
      if (/route\.(tsx?|jsx?)$/.test(basename)) return 'api';
    }

    // Pages directory patterns
    if (segments.includes('pages')) {
      if (segments.includes('api')) return 'api';
      if (/^_app\.(tsx?|jsx?)$/.test(basename)) return 'layout';
      if (/^_document\.(tsx?|jsx?)$/.test(basename)) return 'layout';
      return 'page';
    }

    // React patterns
    if (/\.(tsx?|jsx?)$/.test(ext)) {
      if (/^use[A-Z]/.test(basename)) return 'hook';
      if (/provider\.(tsx?|jsx?)$/.test(basename)) return 'context';
      if (/context\.(tsx?|jsx?)$/.test(basename)) return 'context';
      if (segments.includes('components')) return 'component';
      if (/^[A-Z]/.test(basename)) return 'component';
    }

    // Common patterns
    if (['.css', '.scss', '.sass', '.less', '.stylus'].includes(ext)) return 'style';
    if (segments.includes('api')) return 'api';
    if (segments.includes('utils') || segments.includes('lib')) return 'util';
    if (segments.includes('types') || ext === '.d.ts') return 'types';
    if (/\.(test|spec)\.(tsx?|jsx?)$/.test(basename) || segments.includes('__tests__')) return 'test';
    if (['.json', '.yml', '.yaml'].includes(ext) || basename.includes('config')) return 'config';

    return 'other';
  }

  private categorizeDirectory(dirPath: string): Category {
    const name = path.basename(dirPath).toLowerCase();
    const relPath = path.relative(this.projectPath, dirPath).toLowerCase();
    const segments = relPath.split(path.sep);

    if (name === 'pages' || name === 'app') return 'page';
    if (name === 'components') return 'component';
    if (name === 'layouts') return 'layout';
    if (name === 'hooks') return 'hook';
    if (name === 'context' || name === 'contexts') return 'context';
    if (name === 'api') return 'api';
    if (name === 'styles') return 'style';
    if (name === 'utils' || name === 'lib') return 'util';
    if (name === 'types') return 'types';
    if (name === 'tests' || name === '__tests__') return 'test';
    if (name === 'config' || name === 'configs') return 'config';

    return 'directory';
  }

  private shouldExclude(name: string): boolean {
    return this.options.excludePatterns!.some(pattern => {
      if (pattern.startsWith('*')) return name.endsWith(pattern.slice(1));
      return name === pattern || name.startsWith(pattern + '/');
    });
  }

  private async analyzeDependencies() {
    // First pass: Resolve dependencies
    for (const filePath in this.fileMapping) {
      const node = this.fileMapping[filePath];
      if (node.type === 'file') {
        node.dependencies = node.imports
          .map(imp => this.resolveImportPath(node.path, imp))
          .filter(Boolean);

        // Update importedBy references
        node.dependencies.forEach(depPath => {
          const depNode = this.fileMapping[depPath];
          if (depNode && !depNode.importedBy.includes(node.path)) {
            depNode.importedBy.push(node.path);
          }
        });
      }
    }
  }

  private resolveImportPath(sourcePath: string, importPath: string): string {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    let resolvedPath = path.resolve(path.dirname(sourcePath), importPath);

    // Try exact path first
    if (this.fileMapping[resolvedPath]) return resolvedPath;

    // Try with extensions
    for (const ext of extensions) {
      const pathWithExt = resolvedPath + ext;
      if (this.fileMapping[pathWithExt]) return pathWithExt;

      // Check for index files
      const indexPath = path.join(resolvedPath, `index${ext}`);
      if (this.fileMapping[indexPath]) return indexPath;
    }

    return resolvedPath;
  }

  private async calculateComplexity(filePath: string): Promise<number> {
    try {
      const ext = path.extname(filePath).toLowerCase();
      if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) return 1;

      const content = await fs.readFile(filePath, 'utf-8');
      
      // Base metrics
      const lines = content.split('\n').length;
      const functions = (content.match(/function|=>|class/g) || []).length;
      const controlFlow = (content.match(/if|for|while|switch|catch/g) || []).length;
      const jsx = (content.match(/<[A-Z][^>]*>/g) || []).length;
      const stateManagement = (content.match(/useState|useReducer|useContext|createContext/g) || []).length;
      
      return Math.log2(1 + lines) +
             functions * 2 +
             controlFlow * 1.5 +
             jsx * 1.2 +
             stateManagement * 2;
    } catch (error) {
      console.error(`Error calculating complexity for ${filePath}:`, error);
      return 1;
    }
  }

  private calculateMetrics(rootNode: FileNode) {
    const processNode = (node: FileNode) => {
      // Calculate metrics based on dependencies
      const depCount = node.dependencies.length;
      const impCount = node.importedBy.length;
      
      // Adjust complexity based on connections
      node.complexity *= (1 + Math.log2(1 + depCount + impCount) * 0.2);

      // Process children
      node.children?.forEach(processNode);
    };

    processNode(rootNode);
  }
}