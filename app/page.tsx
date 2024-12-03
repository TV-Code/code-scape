"use client";

import { Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import NavBar from '@/components/layout/nav-bar';
import CodeVisualization from '@/components/visualization/code-visualization';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ProjectSelector from '@/components/project/project-selector';
import { RootState } from '@/lib/redux/store';
import { setStructure, setLoading, setError } from '@/lib/redux/features/codebaseSlice';
import { toast } from 'sonner';

export default function Home() {
  const dispatch = useDispatch();
  const { structure, loading } = useSelector((state: RootState) => state.codebase);

  const handleProjectSelect = async (projectPath: string) => {
    console.log('Loading project from:', projectPath);
    dispatch(setLoading(true));
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: projectPath }),
      });

      const data = await response.json();
      console.log('Analysis response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze project');
      }

      if (!data.structure) {
        throw new Error('No project structure returned from analysis');
      }

      dispatch(setStructure(data.structure));
      toast.success('Project analysis complete');
    } catch (error: any) {
      console.error('Error analyzing project:', error);
      dispatch(setError(error.message));
      toast.error(error.message || 'Failed to analyze project');
      dispatch(setStructure(null));
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (!structure) {
    return <ProjectSelector onProjectSelect={handleProjectSelect} />;
  }

  return (
    <main className="flex min-h-screen bg-background">
      <NavBar />
      <div className="flex-1 relative">
        <Suspense fallback={<LoadingSpinner />}>
          <CodeVisualization />
        </Suspense>
      </div>
    </main>
  );
}