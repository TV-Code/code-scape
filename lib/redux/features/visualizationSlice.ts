import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { VisualizationState, Rotation, CodeNode } from "@/lib/visualization/types";

const initialState: VisualizationState = {
  zoom: 5,
  rotation: { x: 0, y: 0, z: 0 },
  selectedNode: null,
  codeStructure: null,
};

const visualizationSlice = createSlice({
  name: "visualization",
  initialState,
  reducers: {
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = action.payload;
    },
    setRotation: (state, action: PayloadAction<Rotation>) => {
      state.rotation = action.payload;
    },
    setSelectedNode: (state, action: PayloadAction<string | null>) => {
      state.selectedNode = action.payload;
    },
    setCodeStructure: (state, action: PayloadAction<CodeNode>) => {
      state.codeStructure = action.payload;
    },
  },
});

export const { setZoom, setRotation, setSelectedNode, setCodeStructure } = visualizationSlice.actions;
export default visualizationSlice.reducer;