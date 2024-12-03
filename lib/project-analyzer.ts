import fs from 'fs/promises';
import path from 'path';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  size: number;
  extension?: string;
  content?: string;
  imports: string[];
  exports: string[];
  complexity: number;
  children?: FileNode[];
  depth: number;
  parentId?: string;
  category: 'component' | 'page' | 'layout' | 'hook' | 'util' | 'style' | 'config' | 'test' | 'other';
  lastModified: number;
}

const IGNORED_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.DS_Store',
  '.env',
  '*.log',
  'coverage'
];

const FILE_CATEGORIES = {
  component: /\.(tsx|jsx)$/,
  page: /pages?\/.*\.(tsx|jsx)$/,
  layout: /layouts?\/.*\.(tsx|jsx)$/,
  hook: /hooks?\/.*\.(ts|js)$/,
  util: /utils?\/.*\.(ts|js)$/,
  style: /\.(css|scss|sass|less|styl)$/,
  config: /\.(config|rc)\.(js|ts|json)$/,
  test: /\.(test|spec)\.(ts|js|tsx|jsx)$/
};

function categorizeFile(filePath: string): FileNode['category'] {
  for (const [category, pattern] of Object.entries(FILE_CATEGORIES)) {
    if (pattern.test(filePath)) {
      return category as FileNode['category'];
    }
  }
  return 'other';
}

async function calculateComplexity(filePath: string, content: string): Promise<number> {
  // Basic complexity calculation based on:
  // - Number of imports
  // - File size
  // - Number of functions/classes
  // - Nesting depth
  let complexity = 0;
  
  // Add complexity for imports
  const importCount = (content.match(/import .+ from/g) || []).length;
  complexity += importCount * 2;

  // Add complexity for functions and classes
  const functionCount = (content.match(/function |=>|class /g) || []).length;
  complexity += functionCount * 3;

  // Add complexity for nesting
  const nestingLevels = (content.match(/{/g) || []).length;
  complexity += nestingLevels;

  // Add complexity for file size
  complexity += Math.floor(content.length / 1000);

  return complexity;
}

async function analyzeDirectory(
  dirPath: string,
  parentId: string = '',
  depth: number = 0
): Promise<FileNode | null> {
  const name = path.basename(dirPath);

  // Check if directory/file should be ignored
  if (IGNORED_PATTERNS.some(pattern => {
    if (pattern.startsWith('*')) {
      return name.endsWith(pattern.slice(1));
    }
    return name === pattern;
  })) {
    return null;
  }

  const stats = await fs.stat(dirPath);
  const id = parentId ? `${parentId}/${name}` : name;

  if (!stats.isDirectory()) {
    // Handle file
    const extension = path.extname(dirPath).toLowerCase();
    let content = '';
    let imports: string[] = [];
    let exports: string[] = [];

    if (['.ts', '.tsx', '.js', '.jsx', '.css', '.scss'].includes(extension)) {
      content = await fs.readFile(dirPath, 'utf-8');
      // Extract imports and exports
      imports = [...(content.match(/import .+ from ['"](.+)['"]/g) || [])];
      exports = [...(content.match(/export .+ from|export (default |const |function )/g) || [])];
    }

    const complexity = await calculateComplexity(dirPath, content);

    return {
      id,
      name,
      type: 'file',
      path: dirPath,
      size: stats.size,
      extension,
      imports,
      exports,
      complexity,
      depth,
      parentId: parentId || undefined,
      category: categorizeFile(dirPath),
      lastModified: stats.mtimeMs
    };
  }

  // Handle directory
  const entries = await fs.readdir(dirPath);
  const children = await Promise.all(
    entries.map(entry => analyzeDirectory(path.join(dirPath, entry), id, depth + 1))
  );

  const validChildren = children.filter((child): child is FileNode => child !== null);

  return {
    id,
    name,
    type: 'directory',
    path: dirPath,
    size: validChildren.reduce((acc, child) => acc + child.size, 0),
    children: validChildren,
    imports: [],
    exports: [],
    complexity: validChildren.reduce((acc, child) => acc + child.complexity, 0),
    depth,
    parentId: parentId || undefined,
    category: categorizeFile(dirPath),
    lastModified: stats.mtimeMs
  };
}

export async function analyzeProject(projectPath: string) {
  try {
    const structure = await analyzeDirectory(projectPath);
    return {
      structure,
      stats: calculateProjectStats(structure)
    };
  } catch (error) {
    console.error('Error analyzing project:', error);
    throw error;
  }
}

function calculateProjectStats(structure: FileNode | null) {
  if (!structure) return null;

  let totalFiles = 0;
  let totalSize = 0;
  let maxComplexity = 0;
  let totalComplexity = 0;
  const fileTypes = new Map<string, number>();
  const categories = new Map<string, number>();

  function traverse(node: FileNode) {
    if (node.type === 'file') {
      totalFiles++;
      totalSize += node.size;
      totalComplexity += node.complexity;
      maxComplexity = Math.max(maxComplexity, node.complexity);

      if (node.extension) {
        fileTypes.set(node.extension, (fileTypes.get(node.extension) || 0) + 1);
      }
      categories.set(node.category, (categories.get(node.category) || 0) + 1);
    }
    node.children?.forEach(traverse);
  }

  traverse(structure);

  return {
    totalFiles,
    totalSize,
    averageComplexity: totalFiles ? totalComplexity / totalFiles : 0,
    maxComplexity,
    fileTypes: Object.fromEntries(fileTypes),
    categories: Object.fromEntries(categories)
  };
}