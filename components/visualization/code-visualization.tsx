"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import LoadingSpinner from "../ui/loading-spinner";

// Only import ProjectScene on client side
const ProjectScene = dynamic(
  () => import("../r3f/project-scene").then(mod => mod.ProjectScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    )
  }
);

export default function CodeVisualization() {
  const { structure, loading } = useSelector((state: RootState) => state.codebase);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (!structure) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No project loaded
      </div>
    );
  }

  // Log structure once to verify data
  console.log('Visualizing structure:', {
    name: structure.name,
    type: structure.type,
    childCount: structure.children?.length || 0
  });

  return (
    <div className="w-full h-[calc(100vh-4rem)] relative">
      <Suspense fallback={<LoadingSpinner />}>
        <ProjectScene
          projectData={structure}
          onNodeSelect={(node) => {
            console.log('Selected node:', node);
          }}
        />
      </Suspense>
    </div>
  );
}