import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import fs from 'fs/promises';
import path from 'path';

interface CodeMetrics {
  complexity: number;
  dependencies: DependencyInfo[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  functions: FunctionInfo[];
  hooks: HookInfo[];
  componentInfo?: ComponentInfo;
  loc: number;  // Lines of code
  sloc: number; // Source lines of code
  coverage: number;
  maintainabilityIndex: number;
}

interface DependencyInfo {
  path: string;
  type: 'internal' | 'external' | 'relative';
  usageLocations: CodeLocation[];
}

interface ImportInfo {
  source: string;
  specifiers: string[];
  isDefault: boolean;
  isType: boolean;
  location: CodeLocation;
}

interface ExportInfo {
  name: string;
  type: 'default' | 'named';
  isType: boolean;
  location: CodeLocation;
}

interface FunctionInfo {
  name: string;
  type: 'function' | 'arrow' | 'method';
  params: string[];
  async: boolean;
  complexity: number;
  loc: CodeLocation;
  calledBy: string[];
  calls: string[];
}

interface HookInfo {
  name: string;
  type: string;
  dependencies?: string[];
  location: CodeLocation;
}

interface ComponentInfo {
  name: string;
  type: 'functional' | 'class';
  props: PropInfo[];
  hooks: HookInfo[];
  stateVariables: StateInfo[];
  childComponents: string[];
  parentComponents: string[];
  complexity: number;
}

interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
}

interface StateInfo {
  name: string;
  type: string;
  initialValue?: any;
}

interface CodeLocation {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

export class CodeAnalyzer {
  private readonly filePath: string;
  private ast: any;
  private code: string;
  private metrics: CodeMetrics;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): CodeMetrics {
    return {
      complexity: 0,
      dependencies: [],
      imports: [],
      exports: [],
      functions: [],
      hooks: [],
      loc: 0,
      sloc: 0,
      coverage: 0,
      maintainabilityIndex: 0
    };
  }

  async analyze(): Promise<CodeMetrics> {
    try {
      this.code = await fs.readFile(this.filePath, 'utf-8');
      
      // Parse the code based on file type
      const ext = path.extname(this.filePath);
      this.ast = parser.parse(this.code, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties',
          ext.includes('tsx') ? 'typescript' : 'flow',
        ],
      });

      await Promise.all([
        this.analyzeImports(),
        this.analyzeExports(),
        this.analyzeFunctions(),
        this.analyzeHooks(),
        this.analyzeComplexity(),
        this.analyzeDependencies(),
        this.analyzeComponent(),
      ]);

      return this.metrics;
    } catch (error) {
      console.error(`Error analyzing ${this.filePath}:`, error);
      throw error;
    }
  }

  private async analyzeImports() {
    traverse(this.ast, {
      ImportDeclaration: (path) => {
        const importInfo: ImportInfo = {
          source: path.node.source.value,
          specifiers: path.node.specifiers.map(spec => 
            t.isIdentifier(spec.local) ? spec.local.name : ''),
          isDefault: path.node.specifiers.some(spec => t.isImportDefaultSpecifier(spec)),
          isType: path.node.importKind === 'type',
          location: path.node.loc,
        };
        this.metrics.imports.push(importInfo);
      }
    });
  }

  private async analyzeExports() {
    traverse(this.ast, {
      ExportNamedDeclaration: (path) => {
        const exportInfo: ExportInfo = {
          name: path.node.declaration?.id?.name || '',
          type: 'named',
          isType: path.node.exportKind === 'type',
          location: path.node.loc,
        };
        this.metrics.exports.push(exportInfo);
      },
      ExportDefaultDeclaration: (path) => {
        this.metrics.exports.push({
          name: path.node.declaration?.name || 'default',
          type: 'default',
          isType: false,
          location: path.node.loc,
        });
      }
    });
  }

  private calculateComplexity(path: any): number {
    let complexity = 1; // Base complexity

    traverse(path.node, {
      'IfStatement|WhileStatement|DoWhileStatement|ForStatement|ForInStatement|ForOfStatement'() {
        complexity++;
      },
      'LogicalExpression'() {
        complexity++;
      },
      'ConditionalExpression'() {
        complexity++;
      },
      'SwitchCase'() {
        complexity++;
      },
      'CatchClause'() {
        complexity++;
      },
      'BinaryExpression'(path) {
        if (['&&', '||'].includes(path.node.operator)) {
          complexity++;
        }
      }
    });

    return complexity;
  }

  private async analyzeFunctions() {
    traverse(this.ast, {
      Function: (path) => {
        if (path.node.type === 'FunctionDeclaration' || 
            path.node.type === 'FunctionExpression' || 
            path.node.type === 'ArrowFunctionExpression') {
          
          const functionInfo: FunctionInfo = {
            name: path.node.id?.name || '<anonymous>',
            type: path.node.type === 'ArrowFunctionExpression' ? 'arrow' : 'function',
            params: path.node.params.map(param => 
              t.isIdentifier(param) ? param.name : 'complexParam'),
            async: path.node.async,
            complexity: this.calculateComplexity(path),
            loc: path.node.loc,
            calledBy: [],
            calls: []
          };

          // Analyze function calls within this function
          traverse(path.node, {
            CallExpression: (callPath) => {
              if (t.isIdentifier(callPath.node.callee)) {
                functionInfo.calls.push(callPath.node.callee.name);
              }
            }
          });

          this.metrics.functions.push(functionInfo);
        }
      }
    });
  }

  private async analyzeHooks() {
    traverse(this.ast, {
      CallExpression: (path) => {
        if (t.isIdentifier(path.node.callee) && 
            path.node.callee.name.startsWith('use')) {
          const hookInfo: HookInfo = {
            name: path.node.callee.name,
            type: 'react',
            location: path.node.loc,
            dependencies: path.node.arguments
              .filter(arg => t.isArrayExpression(arg))
              .flatMap(arg => (arg as any).elements
                .map(elem => elem.name))
          };
          this.metrics.hooks.push(hookInfo);
        }
      }
    });
  }

  private async analyzeComplexity() {
    // Calculate cyclomatic complexity
    let complexity = 1;
    traverse(this.ast, {
      'IfStatement|WhileStatement|DoWhileStatement|ForStatement|ForInStatement|ForOfStatement|ConditionalExpression'() {
        complexity++;
      },
      'LogicalExpression|SwitchCase|CatchClause'() {
        complexity++;
      }
    });
    this.metrics.complexity = complexity;

    // Calculate maintainability index
    const halsteadVolume = this.calculateHalsteadVolume();
    const cyclomaticComplexity = complexity;
    const linesOfCode = this.code.split('\n').length;
    
    this.metrics.maintainabilityIndex = Math.max(0, (171 - 
      5.2 * Math.log(halsteadVolume) - 
      0.23 * cyclomaticComplexity - 
      16.2 * Math.log(linesOfCode)
    ) * 100 / 171);
  }

  private calculateHalsteadVolume(): number {
    const operators = new Set();
    const operands = new Set();
    
    traverse(this.ast, {
      BinaryExpression: (path) => {
        operators.add(path.node.operator);
        if (t.isIdentifier(path.node.left)) operands.add(path.node.left.name);
        if (t.isIdentifier(path.node.right)) operands.add(path.node.right.name);
      },
      Identifier: (path) => {
        operands.add(path.node.name);
      }
    });

    const n1 = operators.size;
    const n2 = operands.size;
    const N1 = operators.size;
    const N2 = operands.size;

    return (N1 + N2) * Math.log2(n1 + n2);
  }

  private async analyzeDependencies() {
    const dependencies: DependencyInfo[] = [];

    traverse(this.ast, {
      ImportDeclaration: (path) => {
        const source = path.node.source.value;
        const type = source.startsWith('.') ? 'relative' : 
                    source.includes('node_modules') ? 'external' : 'internal';

        dependencies.push({
          path: source,
          type,
          usageLocations: [path.node.loc]
        });
      }
    });

    this.metrics.dependencies = dependencies;
  }

  private async analyzeComponent() {
    let isComponent = false;
    let componentInfo: ComponentInfo | undefined;

    traverse(this.ast, {
      FunctionDeclaration(path) {
        if (path.node.id && 
            /^[A-Z]/.test(path.node.id.name) && 
            path.node.body.body.some(node => 
              t.isReturnStatement(node) && 
              t.isJSXElement(node.argument))) {
          isComponent = true;
          componentInfo = this.extractComponentInfo(path);
        }
      },
      ArrowFunctionExpression(path) {
        if (path.parent && 
            t.isVariableDeclarator(path.parent) && 
            t.isIdentifier(path.parent.id) && 
            /^[A-Z]/.test(path.parent.id.name) &&
            path.node.body &&
            t.isJSXElement(path.node.body)) {
          isComponent = true;
          componentInfo = this.extractComponentInfo(path);
        }
      }
    });

    if (isComponent && componentInfo) {
      this.metrics.componentInfo = componentInfo;
    }
  }

  private extractComponentInfo(path: any): ComponentInfo {
    const info: ComponentInfo = {
      name: path.node.id?.name || 'AnonymousComponent',
      type: 'functional',
      props: [],
      hooks: [],
      stateVariables: [],
      childComponents: [],
      parentComponents: [],
      complexity: this.calculateComplexity(path)
    };

    // Extract props
    if (path.node.params[0] && t.isIdentifier(path.node.params[0])) {
      traverse(path.node, {
        MemberExpression: (memberPath) => {
          if (t.isIdentifier(memberPath.node.object) && 
              memberPath.node.object.name === path.node.params[0].name) {
            info.props.push({
              name: memberPath.node.property.name,
              type: 'unknown',
              required: true
            });
          }
        }
      });
    }

    // Extract hooks usage
    traverse(path.node, {
      CallExpression: (callPath) => {
        if (t.isIdentifier(callPath.node.callee) && 
            callPath.node.callee.name.startsWith('use')) {
          info.hooks.push({
            name: callPath.node.callee.name,
            type: 'react',
            location: callPath.node.loc
          });
        }
      }
    });

    // Find child components
    traverse(path.node, {
      JSXElement: (jsxPath) => {
        const elementName = jsxPath.node.openingElement.name;
        if (t.isJSXIdentifier(elementName) && 
            /^[A-Z]/.test(elementName.name)) {
          info.childComponents.push(elementName.name);
        }
      }
    });

    return info;
  }
}