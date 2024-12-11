'use client';

import Anthropic from '@anthropic-ai/sdk';
import { CodeAnalysisResult, ArchitectureInsights, SemanticGraph, CodeQuestion } from '@/types/analysis';
import { FileNode } from '@/lib/analyzers/project-analyzer';

export class ClaudeService {
    private client: Anthropic;
    private model = 'claude-3-opus-20240229';
    private initialized = false;
    private static instance: ClaudeService;

    private constructor() {
        const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
        
        if (apiKey) {
            this.client = new Anthropic({
                apiKey: apiKey
            });
            this.initialized = true;
        } else {
            console.warn('Anthropic API key not found. Some features will be limited.');
        }
    }

    public static getInstance(): ClaudeService {
        if (!ClaudeService.instance) {
            ClaudeService.instance = new ClaudeService();
        }
        return ClaudeService.instance;
    }

    private ensureInitialized() {
        if (!this.initialized) {
            throw new Error('Claude service not initialized. Please check your API key configuration.');
        }
    }

    async analyzeCode(code: string, context?: string): Promise<CodeAnalysisResult> {
        try {
            this.ensureInitialized();

            const systemPrompt = `You are an expert software architect analyzing code. Focus on:
                - Code structure and patterns
                - Import relationships
                - Potential optimizations
                - Security considerations
                - Best practices
                - Technical debt
                Provide structured analysis that can be visualized.`;

            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 4000,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Analyze this code in the context of ${context || 'a modern web application'}:
                            
                            ${code}
                            
                            Provide analysis in a structured format that can be visualized in a 3D space.`
                        }
                    ]
                }],
                system: systemPrompt
            });

            return this.parseAnalysisResponse(response.content[0].text);
        } catch (error) {
            console.error('Error analyzing code:', error);
            return this.getFallbackAnalysis();
        }
    }

    async analyzeArchitecture(projectStructure: any): Promise<ArchitectureInsights> {
        try {
            this.ensureInitialized();

            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 4000,
                messages: [{
                    role: 'user',
                    content: [{
                        type: 'text',
                        text: `Analyze this project structure and provide insights about:
                            1. Architectural patterns used
                            2. Component relationships
                            3. Code organization
                            4. Potential refactoring opportunities
                            5. Performance implications
                            
                            Project Structure:
                            ${JSON.stringify(projectStructure, null, 2)}
                            
                            Provide response in a structured JSON format suitable for 3D visualization with the following structure:
                            {
                                "patterns": [{ "name": string, "confidence": number, "description": string }],
                                "relationships": [{ "source": string, "target": string, "type": string, "strength": number }],
                                "organization": { "score": number, "suggestions": string[] },
                                "refactoring": [{ "component": string, "suggestion": string, "priority": number }],
                                "performance": [{ "area": string, "impact": number, "suggestion": string }]
                            }`
                    }]
                }]
            });

            return this.parseArchitectureResponse(response.content[0].text);
        } catch (error) {
            console.error('Error analyzing architecture:', error);
            return this.getFallbackArchitectureInsights();
        }
    }

    async analyzeSemanticRelationships(files: FileNode[]): Promise<SemanticGraph> {
        try {
            this.ensureInitialized();

            const fileContents = await Promise.all(files.map(async file => {
                const response = await fetch('/api/file', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ path: file.path }),
                });
                const data = await response.json();
                return { path: file.path, content: data.content };
            }));

            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 4000,
                messages: [{
                    role: 'user',
                    content: [{
                        type: 'text',
                        text: `Analyze the semantic relationships between these files:
                            ${fileContents.map(f => `${f.path}:\n${f.content}\n---`).join('\n')}
                            
                            Focus on:
                            1. Functional dependencies
                            2. Shared concepts/domains
                            3. Data flow patterns
                            4. Coupling strength
                            
                            Provide response in a graph format suitable for visualization:
                            {
                                "nodes": [{ "id": string, "type": string, "domain": string }],
                                "edges": [{ "source": string, "target": string, "type": string, "weight": number }]
                            }`
                    }]
                }]
            });

            return this.parseSemanticGraphResponse(response.content[0].text);
        } catch (error) {
            console.error('Error analyzing semantic relationships:', error);
            return this.getFallbackSemanticGraph();
        }
    }

    async suggestImprovements(fileContent: string, filePath: string): Promise<string> {
        try {
            this.ensureInitialized();

            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 2000,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Suggest improvements for this file (${filePath}):
                            
                            ${fileContent}
                            
                            Focus on:
                            - Code quality
                            - Performance
                            - Maintainability
                            - Modern best practices`
                        }
                    ]
                }]
            });

            return response.content[0].text;
        } catch (error) {
            console.error('Error suggesting improvements:', error);
            throw error;
        }
    }

    async explainDependencies(dependencies: string[]): Promise<string> {
        try {
            this.ensureInitialized();

            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 2000,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Explain the relationships and impacts of these dependencies:
                            
                            ${dependencies.join('\n')}
                            
                            Focus on:
                            - Why they're connected
                            - Potential coupling issues
                            - Improvement suggestions`
                        }
                    ]
                }]
            });

            return response.content[0].text;
        } catch (error) {
            console.error('Error explaining dependencies:', error);
            throw error;
        }
    }

    async answerCodeQuestion(question: CodeQuestion): Promise<{
        text: string;
        visualizations?: any[];
        relevantFiles?: string[];
    }> {
        try {
            this.ensureInitialized();

            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 4000,
                messages: [{
                    role: 'user',
                    content: [{
                        type: 'text',
                        text: `Question about the codebase: ${question.text}
                            
                            Context:
                            ${JSON.stringify(question.context)}
                            
                            Relevant files:
                            ${question.relevantFiles?.map(f => `${f.path}:\n${f.content}\n---`).join('\n')}
                            
                            Provide response with:
                            1. Clear explanation
                            2. Relevant code examples
                            3. Visualization suggestions
                            4. Related files to explore`
                    }]
                }]
            });

            return this.parseQuestionResponse(response.content[0].text);
        } catch (error) {
            console.error('Error answering code question:', error);
            return {
                text: 'Sorry, I encountered an error processing your question. Please try again.',
                visualizations: [],
                relevantFiles: []
            };
        }
    }

    private parseAnalysisResponse(response: string): CodeAnalysisResult {
        try {
            const parsed = JSON.parse(response);
            return {
                insights: parsed.insights || [],
                metrics: {
                    complexity: parsed.metrics?.complexity || 0,
                    maintainability: parsed.metrics?.maintainability || 0,
                    security: parsed.metrics?.security || 0
                },
                suggestions: parsed.suggestions || [],
                dependencies: parsed.dependencies || []
            };
        } catch (error) {
            console.error('Error parsing analysis response:', error);
            return this.getFallbackAnalysis();
        }
    }

    private parseArchitectureResponse(response: string): ArchitectureInsights {
        try {
            return JSON.parse(response);
        } catch (error) {
            console.error('Error parsing architecture response:', error);
            return this.getFallbackArchitectureInsights();
        }
    }

    private parseSemanticGraphResponse(response: string): SemanticGraph {
        try {
            return JSON.parse(response);
        } catch (error) {
            console.error('Error parsing semantic graph response:', error);
            return this.getFallbackSemanticGraph();
        }
    }

    private parseQuestionResponse(response: string): {
        text: string;
        visualizations?: any[];
        relevantFiles?: string[];
    } {
        try {
            return JSON.parse(response);
        } catch (error) {
            return {
                text: response,
                visualizations: [],
                relevantFiles: []
            };
        }
    }

    private getFallbackAnalysis(): CodeAnalysisResult {
        return {
            insights: ['Analysis currently unavailable. Please check API configuration.'],
            metrics: {
                complexity: 0,
                maintainability: 0,
                security: 0
            },
            suggestions: [],
            dependencies: []
        };
    }

    private getFallbackArchitectureInsights(): ArchitectureInsights {
        return {
            patterns: [],
            relationships: [],
            organization: { score: 0, suggestions: [] },
            refactoring: [],
            performance: []
        };
    }

    private getFallbackSemanticGraph(): SemanticGraph {
        return {
            nodes: [],
            edges: []
        };
    }
}

export const claudeService = ClaudeService.getInstance();