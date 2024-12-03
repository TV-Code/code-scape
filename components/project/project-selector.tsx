"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, Folder, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProjectSelectorProps {
  onProjectSelect: (projectPath: string) => void;
}

export default function ProjectSelector({ onProjectSelect }: ProjectSelectorProps) {
  const [githubUrl, setGithubUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGithubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!githubUrl.trim()) {
      toast.error('Please enter a GitHub repository URL');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/github/clone', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ repoUrl: githubUrl.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clone repository');
      }

      if (data.path) {
        await onProjectSelect(data.path);
        toast.success('Repository cloned successfully');
      } else {
        throw new Error('No repository path returned');
      }
    } catch (error: any) {
      console.error('GitHub clone error:', error);
      toast.error(error.message || 'Failed to clone repository');
    } finally {
      setLoading(false);
    }
  };

  // Handle directory selection using File System Access API
  const handleDirectorySelect = async () => {
    try {
      // @ts-ignore - FileSystemHandle is not in the types yet
      const dirHandle = await window.showDirectoryPicker({
        mode: 'read'
      });
      
      if (dirHandle) {
        // We'll send the directory name for now
        // In production, you'd want to implement proper path handling
        await onProjectSelect(dirHandle.name);
        toast.success('Project loaded successfully');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User canceled the selection
        return;
      }
      console.error('Directory selection error:', error);
      toast.error('Failed to select directory');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome to CodeScape</CardTitle>
          <CardDescription className="text-center">
            Select a project to visualize its architecture in 3D
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="local" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="local">Local Project</TabsTrigger>
              <TabsTrigger value="github">GitHub Repository</TabsTrigger>
            </TabsList>

            <TabsContent value="local">
              <div className="space-y-4">
                <div className="p-8 border-2 border-dashed rounded-lg text-center">
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    Click below to select your project folder
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your files will be analyzed locally
                  </p>
                </div>

                <Button 
                  onClick={handleDirectorySelect}
                  variant="outline" 
                  className="w-full"
                >
                  <Folder className="mr-2 h-4 w-4" />
                  Browse for Project Folder
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="github">
              <form onSubmit={handleGithubSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="https://github.com/username/repository"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Repository...
                    </>
                  ) : (
                    <>
                      <Github className="mr-2 h-4 w-4" />
                      Load GitHub Repository
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <div className="flex items-start space-x-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                Your code stays private and secure. Analysis is performed locally on your machine.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}