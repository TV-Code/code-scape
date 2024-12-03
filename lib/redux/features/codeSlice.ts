import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CodeState {
  nodes: CodeNode[];
  selectedNode: CodeNode | null;
  visualizationSettings: {
    zoom: number;
    rotation: [number, number, number];
    layout: 'radial' | 'tree' | 'force';
  };
}

const initialState: CodeState = {
  nodes: [],
  selectedNode: null,
  visualizationSettings: {
    zoom: 20,
    rotation: [0, 0, 0],
    layout: 'radial'
  }
};

export const codeSlice = createSlice({
  name: 'code',
  initialState,
  reducers: {
    setNodes: (state, action: PayloadAction<CodeNode[]>) => {
      state.nodes = action.payload;
    },
    updateNodeMetrics: (state, action: PayloadAction<{ 
      nodeId: string;
      metrics: any;
    }>) => {
      const node = state.nodes.find(n => n.id === action.payload.nodeId);
      if (node) {
        Object.assign(node, action.payload.metrics);
      }
    },
    setSelectedNode: (state, action: PayloadAction<CodeNode | null>) => {
      state.selectedNode = action.payload;
    },
    updateVisualizationSettings: (state, action: PayloadAction<Partial<CodeState['visualizationSettings']>>) => {
      state.visualizationSettings = {
        ...state.visualizationSettings,
        ...action.payload
      };
    }
  }
});

export const {
  setNodes,
  updateNodeMetrics,
  setSelectedNode,
  updateVisualizationSettings
} = codeSlice.actions;

export default codeSlice.reducer;
