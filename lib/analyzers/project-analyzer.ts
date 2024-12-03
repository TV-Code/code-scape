import fs from 'fs/promises';
import path from 'path';
import { analyzeDependencies } from './dependency-analyzer';

export interface FileNode {
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
  dependencies: string[];
  complexity: number;
  importedBy: string[];  // Track which files import this one
}

interface FileMapping {
  [key: string]: FileNode;
}

export class ProjectAnalyzer {
  private excludePatterns: string[];
  private fileMapping: FileMapping = {};

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
      // First pass: Build the file tree
      const rootNode = await this.processDirectory(this.projectPath);
      
      // Second pass: Analyze dependencies and relationships
      await this.resolveDependencies();
      
      // Third pass: Calculate importance and connectivity
      this.calculateNodeMetrics(rootNode);
      
      return rootNode;
    } catch (error) {
      console.error('Analysis failed:', error);
      throw error;
    }
  }

  private async processFile(filePath: string, parentId: string, depth: number): Promise<FileNode> {
    const stats = await fs.stat(filePath);
    const name = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const id = `${parentId}/${name}`;

    // Analyze file dependencies
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
      complexity: await this.calculateComplexity(filePath, ext)
    };

    this.fileMapping[node.path] = node;
    return node;
  }

  private async processDirectory(dirPath: string, parentId: string = '', depth: number = 0): Promise<FileNode> {
    const stats = await fs.stat(dirPath);
    const name = path.basename(dirPath);
    const id = parentId ? `${parentId}/${name}` : name;

    if (!stats.isDirectory()) {
      return this.processFile(dirPath, parentId, depth);
    }

    try {
      const entries = await fs.readdir(dirPath);
      const children: FileNode[] = [];

      for (const entry of entries) {
        if (this.shouldExclude(entry)) continue;

        const fullPath = path.join(dirPath, entry);
        try {
          const entryStats = await fs.stat(fullPath);
          const childNode = entryStats.isDirectory()
            ? await this.processDirectory(fullPath, id, depth + 1)
            : await this.processFile(fullPath, id, depth + 1);
          
          children.push(childNode);
          this.fileMapping[childNode.path] = childNode;
        } catch (error) {
          console.error(`Error processing ${fullPath}:`, error);
        }
      }

      // Sort children: directories first, then by category
      children.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        if (a.category !== b.category) {
          const categoryOrder = ['page', 'component', 'layout', 'api', 'hook', 'util', 'style', 'test', 'config', 'other'];
          return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
        }
        return a.name.localeCompare(b.name);
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
        importedBy: [],
        complexity: children.reduce((sum, child) => sum + child.complexity, 0)
      };

      this.fileMapping[node.path] = node;
      return node;
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
      throw error;
    }
  }

  private async resolveDependencies() {
    for (const filePath in this.fileMapping) {
      const node = this.fileMapping[filePath];
      if (node.type === 'file') {
        // Resolve imports to actual file paths
        const resolvedImports = node.imports
          .map(imp => {
            const resolvedPath = this.resolveImportPath(node.path, imp);
            return this.fileMapping[resolvedPath];
          })
          .filter(Boolean)
          .map(n => n.id);

        node.dependencies = resolvedImports;

        // Update importedBy for each dependency
        resolvedImports.forEach(impId => {
          const importedNode = this.fileMapping[impId];
          if (importedNode && !importedNode.importedBy.includes(node.id)) {
            importedNode.importedBy.push(node.id);
          }
        });
      }
    }
  }

  private resolveImportPath(sourcePath: string, importPath: string): string {
    let resolvedPath = path.resolve(path.dirname(sourcePath), importPath);
    
    if (!path.extname(resolvedPath)) {
      const extensions = ['.ts', '.tsx', '.js', '.jsx'];
      for (const ext of extensions) {
        const pathWithExt = resolvedPath + ext;
        if (this.fileMapping[pathWithExt]) {
          return pathWithExt;
        }
        
        // Check for index files
        const indexPath = path.join(resolvedPath, `index${ext}`);
        if (this.fileMapping[indexPath]) {
          return indexPath;
        }
      }
    }
    
    return resolvedPath;
  }

  private calculateNodeMetrics(node: FileNode) {
    if (node.type === 'file') {
      // Calculate connectivity score
      const directDependencies = node.dependencies.length;
      const directImporters = node.importedBy.length;
      const connectivityScore = Math.log2(1 + directDependencies + directImporters);
      
      // Adjust complexity based on connectivity
      node.complexity = node.complexity * (1 + connectivityScore * 0.2);
    }

    // Recursively process children
    node.children?.forEach(child => this.calculateNodeMetrics(child));
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
    const basename = path.basename(filePath);
    const relativePath = path.relative(this.projectPath, filePath).toLowerCase();
    
    // Next.js specific patterns
    if (relativePath.includes('/app/') && /page\.(jsx|tsx|js|ts)$/.test(basename)) {
      return 'page';
    }
    if (relativePath.includes('/app/') && /layout\.(jsx|tsx|js|ts)$/.test(basename)) {
      return 'layout';
    }
    if (relativePath.includes('/app/') && /route\.(js|ts)$/.test(basename)) {
      return 'api';
    }

    // React/Component patterns
    if (relativePath.includes('/components/') || 
        (/\.(jsx|tsx)$/.test(ext) && /^[A-Z]/.test(basename))) {
      return 'component';
    }

    // Other common patterns
    if (relativePath.includes('/pages/')) return 'page';
    if (relativePath.includes('/layouts/')) return 'layout';
    if (relativePath.includes('/hooks/') || basename.startsWith('use')) return 'hook';
    if (['.css', '.scss', '.sass', '.less', '.styl'].includes(ext)) return 'style';
    if (relativePath.includes('/api/')) return 'api';
    if (relativePath.includes('/utils/') || relativePath.includes('/lib/') || relativePath.includes('/helpers/')) return 'util';
    if (relativePath.includes('/types/') || ext === '.d.ts') return 'types';
    if (relativePath.includes('/test/') || /\.(test|spec)\.(js|ts|jsx|tsx)$/.test(basename)) return 'test';
    if (['.json', '.yaml', '.yml', '.env'].includes(ext) || basename.includes('.config.')) return 'config';

    return 'other';
  }

  private async calculateComplexity(filePath: string, ext: string): Promise<number> {
    try {
      if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Basic metrics
        const lines = content.split('\n').length;
        const functions = (content.match(/function|=>|class/g) || []).length;
        const controlFlow = (content.match(/if|for|while|switch|catch/g) || []).length;
        const jsx = (content.match(/<[A-Z][^>]*>/g) || []).length;  // Count JSX components
        const stateManagement = (content.match(/useState|useReducer|useContext|createContext/g) || []).length;
        
        // Weighted complexity calculation
        return Math.log2(1 + lines) + 
               functions * 2 + 
               controlFlow * 1.5 + 
               jsx * 1.2 + 
               stateManagement * 2;
      }
    } catch (error) {
      console.error(`Error calculating complexity for ${filePath}:`, error);
    }
    return 1;
  }
}
