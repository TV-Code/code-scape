import fs from 'fs/promises';
import path from 'path';

interface ImportExport {
  imports: string[];
  exports: string[];
}

export async function analyzeDependencies(filePath: string): Promise<ImportExport> {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
    return { imports: [], exports: [] };
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const imports: string[] = [];
    const exports: string[] = [];

    // Find imports
    const importMatches = content.matchAll(/import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)?\s*from\s+['"]([^'"]+)['"]/g);
    for (const match of importMatches) {
      const importPath = match[1];
      if (!importPath.startsWith('.')) continue; // Skip package imports
      imports.push(resolveImportPath(filePath, importPath));
    }

    // Find dynamic imports
    const dynamicImports = content.matchAll(/import\(['"]([^'"]+)['"]\)/g);
    for (const match of dynamicImports) {
      const importPath = match[1];
      if (!importPath.startsWith('.')) continue;
      imports.push(resolveImportPath(filePath, importPath));
    }

    // Find exports
    const exportMatches = [
      ...content.matchAll(/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g),
      ...content.matchAll(/export\s+{\s*([^}]+)\s*}/g)
    ];

    for (const match of exportMatches) {
      const exportNames = match[1].split(',').map(e => e.trim());
      exports.push(...exportNames);
    }

    return {
      imports: Array.from(new Set(imports)),
      exports: Array.from(new Set(exports))
    };
  } catch (error) {
    console.error(`Error analyzing dependencies in ${filePath}:`, error);
    return { imports: [], exports: [] };
  }
}

function resolveImportPath(sourcePath: string, importPath: string): string {
  let resolvedPath = path.resolve(path.dirname(sourcePath), importPath);
  
  // If no extension, try common extensions
  if (!path.extname(resolvedPath)) {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    for (const ext of extensions) {
      const pathWithExt = resolvedPath + ext;
      try {
        if (fs.statSync(pathWithExt)) {
          return pathWithExt;
        }
      } catch {}
    }
    
    // Check for index files
    for (const ext of extensions) {
      const indexPath = path.join(resolvedPath, `index${ext}`);
      try {
        if (fs.statSync(indexPath)) {
          return indexPath;
        }
      } catch {}
    }
  }
  
  return resolvedPath;
}
