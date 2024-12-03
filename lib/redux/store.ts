import { configureStore } from '@reduxjs/toolkit';
import codebaseReducer from './features/codebaseSlice';

export const store = configureStore({
  reducer: {
    codebase: codebaseReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disabled for Three.js objects
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;