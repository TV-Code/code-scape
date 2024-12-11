'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useCodeAnalysis } from '@/hooks/useCodeAnalysis';
import { claudeService } from '@/lib/services/claude-service';
import { RootState } from '@/lib/redux/store';
import { FileNode } from '@/lib/analyzers/project-analyzer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { logger } from '@/lib/utils/file-access';
import { 
    Card,
    CardContent,
    CardHeader,
    CardTitle 
} from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Minimize, Maximize, Code, Eye, EyeOff, FileCode } from 'lucide-react';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    visualizations?: any[];
    timestamp: number;
    contextFile?: string;
    relatedFiles?: string[];
    metrics?: {
        complexity?: number;
        maintainability?: number;
    };
}

interface ChatContext {
    selectedNode: FileNode | null;
    visibleNodes: Set<string>;
    activeMarker: string | null;
    currentPath: string | null;
}

export function CodeChat({ 
    context,
    onVisualizationRequest 
}: { 
    context: ChatContext;
    onVisualizationRequest?: (type: string, data: any) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showContext, setShowContext] = useState(true);

    const projectStructure = useSelector((state: RootState) => state.codebase.structure);
    const { analyzeFile, getAnalysis } = useCodeAnalysis();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when new messages arrive
    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Add context awareness messages when context changes
    useEffect(() => {
        if (context.selectedNode && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.contextFile !== context.selectedNode.path) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Now viewing file: ${context.selectedNode.path}`,
                    timestamp: Date.now(),
                    contextFile: context.selectedNode.path
                }]);
            }
        }
    }, [context.selectedNode, messages]);

    const findRelevantFiles = useCallback((question: string): FileNode[] => {
        if (!projectStructure) return [];

        const keywords = question.toLowerCase().split(' ');
        const relevantFiles: FileNode[] = [];

        const searchInNode = (node: FileNode) => {
            const path = node.path.toLowerCase();
            if (keywords.some(keyword => path.includes(keyword))) {
                relevantFiles.push(node);
            }
            if (node.children) {
                node.children.forEach(searchInNode);
            }
        };

        searchInNode(projectStructure);
        return relevantFiles;
    }, [projectStructure]);

    const readFileContent = async (file: FileNode): Promise<string> => {
        try {
            // Ensure we're sending a clean path relative to project root
            const cleanPath = file.path.startsWith('/')
                ? file.path
                : `/${file.path}`;

            console.log('Reading file:', cleanPath); // Debug log

            const response = await fetch('/api/file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path: cleanPath }),
            });

            const data = await response.json();

            if (!response.ok) {
                logger.fileAccess(cleanPath, false, data.error);
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            if (!data.content) {
                logger.fileAccess(cleanPath, false, 'No content returned');
                throw new Error('No content returned from file read');
            }

            logger.fileAccess(cleanPath, true);
            return data.content;
        } catch (error) {
            console.error('Error reading file:', error);
            throw new Error(`Failed to read file: ${error.message}`);
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !projectStructure) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: input,
            timestamp: Date.now(),
            contextFile: context.selectedNode?.path
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const relevantFiles = findRelevantFiles(input);
            const fileContents = await Promise.all(
                relevantFiles.map(async file => ({
                    path: file.path,
                    content: await readFileContent(file)
                }))
            );

            // Include current context in the question
            const response = await claudeService.answerCodeQuestion({
                text: input,
                context: {
                    currentFile: context.selectedNode?.path,
                    selectedNode: context.selectedNode?.id,
                    visibleNodes: Array.from(context.visibleNodes),
                    projectContext: {
                        structure: projectStructure,
                        path: context.currentPath
                    }
                },
                relevantFiles: fileContents
            });

            // Handle visualization requests from the AI
            if (response.visualizations?.length) {
                response.visualizations.forEach(viz => {
                    onVisualizationRequest?.(viz.type, viz.data);
                });
            }

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.text,
                visualizations: response.visualizations,
                relatedFiles: response.relevantFiles,
                timestamp: Date.now(),
                contextFile: context.selectedNode?.path,
                metrics: response.metrics
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error processing question:', error);
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: 'I apologize, but I encountered an error processing your question. Please try again.',
                timestamp: Date.now(),
                contextFile: context.selectedNode?.path
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMinimize = () => {
        setIsMinimized(prev => !prev);
    };

    const toggleOpen = () => {
        setIsOpen(prev => !prev);
        setIsMinimized(false);
    };

    if (!isOpen) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
                            onClick={toggleOpen}
                        >
                            <MessageCircle className="h-6 w-6" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Chat with AI about your code</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <Card className={`
            fixed bottom-4 right-4 
            ${isMinimized ? 'h-12 w-96' : 'h-[600px] w-96'}
            transition-all duration-200 ease-in-out
            shadow-lg
        `}>
            <CardHeader className="p-2 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Code Assistant
                    {context.selectedNode && (
                        <Badge variant="secondary" className="ml-2">
                            <FileCode className="h-3 w-3 mr-1" />
                            {context.selectedNode.name}
                        </Badge>
                    )}
                </CardTitle>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setShowContext(!showContext)}
                    >
                        {showContext ? (
                            <Eye className="h-4 w-4" />
                        ) : (
                            <EyeOff className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={toggleMinimize}
                    >
                        {isMinimized ? (
                            <Maximize className="h-4 w-4" />
                        ) : (
                            <Minimize className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={toggleOpen}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            {!isMinimized && (
                <>
                    <CardContent className="p-0 flex flex-col h-[calc(100%-4rem)]">
                        <ScrollArea 
                            className="flex-1 p-4"
                            ref={scrollRef}
                        >
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`mb-4 ${
                                        message.role === 'assistant' 
                                            ? 'bg-secondary/50 rounded-lg p-2' 
                                            : ''
                                    }`}
                                >
                                    {showContext && message.contextFile && (
                                        <div className="text-xs text-muted-foreground mb-1">
                                            Context: {message.contextFile}
                                        </div>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap">
                                        {message.content}
                                    </p>
                                    {message.metrics && (
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            <div className="flex gap-4">
                                                {message.metrics.complexity !== undefined && (
                                                    <span>Complexity: {message.metrics.complexity}</span>
                                                )}
                                                {message.metrics.maintainability !== undefined && (
                                                    <span>Maintainability: {message.metrics.maintainability}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {message.relatedFiles && message.relatedFiles.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs text-muted-foreground">
                                                Related files:
                                            </p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {message.relatedFiles.map((file, i) => (
                                                    <Button
                                                        key={i}
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-6 text-xs"
                                                        onClick={() => {
                                                            // Handle file navigation
                                                            console.log('Navigate to:', file);
                                                        }}
                                                    >
                                                        {file.split('/').pop()}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                                    Analyzing code...
                                </div>
                            )}
                        </ScrollArea>

                        <form 
                            onSubmit={handleSubmit}
                            className="p-2 border-t"
                        >
                            <div className="flex gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={context.selectedNode 
                                        ? `Ask about ${context.selectedNode.name}...`
                                        : "Ask about your code..."
                                    }
                                    disabled={isLoading}
                                />
                                <Button type="submit" disabled={isLoading}>
                                    Send
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </>
            )}
        </Card>
    );
}