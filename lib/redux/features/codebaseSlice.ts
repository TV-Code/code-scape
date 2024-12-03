import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  size: number;
  complexity: number;
  category: string;  // Make category required
  dependencies: string[];
  imports: string[];  // Add explicit imports
  exports: string[];  // Add explicit exports
  children?: FileNode[];
}

interface CodebaseState {
  structure: FileNode | null;
  selectedNode: FileNode | null;
  loading: boolean;
  error: string | null;
}

const initialState: CodebaseState = {
  structure: null,
  selectedNode: null,
  loading: false,
  error: null
};

const codebaseSlice = createSlice({
  name: 'codebase',
  initialState,
  reducers: {
    setStructure(state, action: PayloadAction<FileNode>) {
      console.log('Setting structure:', action.payload);
      state.structure = action.payload;
    },
    setSelectedNode(state, action: PayloadAction<FileNode | null>) {
      state.selectedNode = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    }
  }
});

export const { setStructure, setSelectedNode, setLoading, setError } = codebaseSlice.actions;

export default codebaseSlice.reducer;