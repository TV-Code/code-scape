export interface CodeMetrics {
    complexity: number;
    maintainability: number;
    testCoverage?: number;
    duplications?: number;
    linesOfCode: number;
}

export interface CodeQualityInsight {
    type: 'warning' | 'suggestion' | 'info';
    title: string;
    description: string;
    impact: number; // 0-10 scale
    location: {
        file: string;
        position?: [number, number, number]; // 3D space position
    };
    metrics?: Partial<CodeMetrics>;
}

export interface SemanticConnection {
    sourceFile: string;
    targetFile: string;
    relationshipType: 'similar' | 'dependent' | 'coupled' | 'semantic';
    strength: number; // 0-1 scale
    description: string;
}

export interface ArchitecturePattern {
    name: string;
    files: string[];
    confidence: number;
    description: string;
    suggestedImprovements?: string[];
}

export interface FileContext {
    file: string;
    content?: string;
    metrics?: CodeMetrics;
    insights: CodeQualityInsight[];
    semanticConnections: SemanticConnection[];
    patterns: ArchitecturePattern[];
}

export interface CodeAnalysisResult {
    insights: CodeQualityInsight[];
    metrics: CodeMetrics;
    suggestions: string[];
    dependencies: string[];
}

export interface FileAnalysis {
    path: string;
    analysis: CodeAnalysisResult;
    timestamp: number;
}

export interface InsightMarker {
    position: [number, number, number];
    title: string;
    description: string;
    type: 'warning' | 'suggestion' | 'info';
    impact: number;
    relatedFiles?: string[];
    metrics?: Partial<CodeMetrics>;
}

export interface ComponentRelationship {
    source: string;
    target: string;
    type: string;
    strength: number;
}

export interface SemanticGraph {
    nodes: Array<{
        id: string;
        type: string;
        domain: string;
        metrics?: Partial<CodeMetrics>;
    }>;
    edges: Array<{
        source: string;
        target: string;
        type: string;
        weight: number;
    }>;
}

export interface CodeQuestion {
    text: string;
    context?: {
        currentFile?: string;
        selectedNode?: string;
        visibleNodes?: string[];
        projectContext?: any;
    };
    relevantFiles?: Array<{
        path: string;
        content: string;
    }>;
}

export interface VisualizationData {
    markers: InsightMarker[];
    relationships: ComponentRelationship[];
    semanticGroups: Array<{
        domain: string;
        nodes: string[];
        metrics?: Partial<CodeMetrics>;
    }>;
    patterns: ArchitecturePattern[];
}