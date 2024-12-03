"use client";

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCodeStructure } from '@/lib/redux/features/visualizationSlice';
import { analyzeFileStructure } from '@/lib/visualization/file-analyzer';

export function useFileAnalysis() {
  const dispatch = useDispatch();

  useEffect(() => {
    const loadFileStructure = async () => {
      try {
        const structure = await analyzeFileStructure('/');
        dispatch(setCodeStructure(structure));
      } catch (error) {
        console.error('Failed to analyze file structure:', error);
      }
    };

    loadFileStructure();
  }, [dispatch]);
}