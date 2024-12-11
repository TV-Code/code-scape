'use client';

import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { claudeService } from '@/lib/services/claude-service';
import { CodeAnalysisResult, FileAnalysis, ArchitectureInsights, VisualizationData } from '@/types/analysis';
import { FileNode } from '@/lib/analyzers/project-analyzer';
import { RootState } from '@/lib/redux/store';

export function useCodeAnalysis() {
    const [analyses, setAnalyses] = useState<Map<string, FileAnalysis>>(new Map());
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [visualizationData, setVisualizationData] = useState<VisualizationData>({
        markers: [],
        relationships: [],
        semanticGroups: [],
        patterns: []
    });

    const projectStructure = useSelector((state: RootState) => state.codebase.structure);

    const analyzeArchitecture = useCallback(async () => {
        if (!projectStructure) return null;
        
        try {
            setLoading(true);
            setError(null);

            const insights = await claudeService.analyzeArchitecture(projectStructure);
            
            setVisualizationData(prevData => ({
                ...prevData,
                patterns: insights.patterns || [],
                relationships: insights.relationships || [],
                markers: [
                    ...prevData.markers,
                    ...(insights.refactoring?.map(ref => ({
                        position: [0, 0, 0], // You'll need to calculate actual positions
                        title: 'Refactoring Suggestion',
                        description: ref.suggestion,
                        type: ref.priority > 7 ? 'warning' : 'suggestion',
                        impact: ref.priority,
                        relatedFiles: [ref.component]
                    })) || []),
                    ...(insights.performance?.map(perf => ({
                        position: [0, 0, 0], // You'll need to calculate actual positions
                        title: 'Performance Issue',
                        description: perf.suggestion,
                        type: perf.impact > 7 ? 'warning' : 'info',
                        impact: perf.impact,
                        relatedFiles: [perf.area]
                    })) || [])
                ]
            }));

            return insights;
        } catch (err) {
            console.error('Error analyzing architecture:', err);
            setError(err instanceof Error ? err.message : 'Error analyzing architecture');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [projectStructure]);

    const analyzeFile = useCallback(async (node: FileNode) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path: node.path }),
            });

            if (!response.ok) {
                throw new Error('Failed to read file');
            }

            const data = await response.json();
            const analysis = await claudeService.analyzeCode(data.content, node.path);

            setAnalyses(prev => new Map(prev).set(node.id, {
                path: node.path,
                analysis,
                timestamp: Date.now()
            }));

            return analysis;
        } catch (err) {
            console.error('Error analyzing file:', err);
            setError(err instanceof Error ? err.message : 'Error analyzing file');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const analyzeDependencies = useCallback(async (nodes: FileNode[]) => {
        try {
            setLoading(true);
            setError(null);

            const paths = nodes.map(n => n.path);
            const explanation = await claudeService.explainDependencies(paths);

            return explanation;
        } catch (err) {
            console.error('Error analyzing dependencies:', err);
            setError(err instanceof Error ? err.message : 'Error analyzing dependencies');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getAnalysis = useCallback((nodeId: string): FileAnalysis | undefined => {
        return analyses.get(nodeId);
    }, [analyses]);

    const clearAnalyses = useCallback(() => {
        setAnalyses(new Map());
        setError(null);
    }, []);

    return {
        analyses,
        loading,
        error,
        visualizationData,
        analyzeFile,
        analyzeArchitecture,
        analyzeDependencies,
        getAnalysis,
        clearAnalyses
    };
}