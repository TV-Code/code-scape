export type FileCategory = 
  // Core Application Structure
  | 'page'           // Next.js pages
  | 'layout'         // Layout components
  | 'route'          // API routes
  | 'middleware'     // Middleware files
  
  // UI Layer
  | 'component'      // React components
  | 'ui'             // UI components (usually in ui/ directory)
  | 'style'          // Style files (CSS, SCSS, etc.)
  | 'asset'          // Static assets
  
  // Application Logic
  | 'hook'           // React hooks
  | 'context'        // React context providers
  | 'store'          // State management (Redux, etc.)
  | 'service'        // Service layer
  | 'util'           // Utility functions
  
  // Data Layer
  | 'api'            // API-related code
  | 'model'          // Data models
  | 'schema'         // Database schemas
  | 'query'          // Database queries
  
  // Type System
  | 'types'          // TypeScript type definitions
  | 'interface'      // TypeScript interfaces
  
  // Testing & Config
  | 'test'           // Test files
  | 'config'         // Configuration files
  | 'env'            // Environment configuration
  
  // Special
  | 'directory'      // Directory node
  | 'other';         // Uncategorized

export interface CategoryMetadata {
  name: FileCategory;
  color: {
    primary: string;   // Main color for the node
    accent: string;    // Accent color for highlights
    text: string;      // Text color
  };
  description: string;
  importance: number;  // Base importance score (0-1)
  layer: number;       // Default vertical layer
  group: string;       // Logical grouping
}

export const CATEGORIES: Record<FileCategory, CategoryMetadata> = {
  // Core Application Structure - Red/Orange spectrum
  'page': {
    name: 'page',
    color: {
      primary: '#FF4B4B',
      accent: '#FF7676',
      text: '#FFFFFF'
    },
    description: 'Next.js page components',
    importance: 1,
    layer: 4,
    group: 'core'
  },
  'layout': {
    name: 'layout',
    color: {
      primary: '#FF6B2C',
      accent: '#FF8F5E',
      text: '#FFFFFF'
    },
    description: 'Layout components',
    importance: 0.9,
    layer: 3,
    group: 'core'
  },
  'route': {
    name: 'route',
    color: {
      primary: '#FF9500',
      accent: '#FFB44C',
      text: '#000000'
    },
    description: 'API routes',
    importance: 0.8,
    layer: 3,
    group: 'core'
  },
  'middleware': {
    name: 'middleware',
    color: {
      primary: '#FFB627',
      accent: '#FFD27D',
      text: '#000000'
    },
    description: 'Middleware functions',
    importance: 0.7,
    layer: 2,
    group: 'core'
  },

  // UI Layer - Blue spectrum
  'component': {
    name: 'component',
    color: {
      primary: '#3B82F6',
      accent: '#60A5FA',
      text: '#FFFFFF'
    },
    description: 'React components',
    importance: 0.8,
    layer: 2,
    group: 'ui'
  },
  'ui': {
    name: 'ui',
    color: {
      primary: '#2563EB',
      accent: '#4F46E5',
      text: '#FFFFFF'
    },
    description: 'UI components',
    importance: 0.7,
    layer: 2,
    group: 'ui'
  },
  'style': {
    name: 'style',
    color: {
      primary: '#1D4ED8',
      accent: '#3B82F6',
      text: '#FFFFFF'
    },
    description: 'Style files',
    importance: 0.6,
    layer: 1,
    group: 'ui'
  },
  'asset': {
    name: 'asset',
    color: {
      primary: '#1E40AF',
      accent: '#2563EB',
      text: '#FFFFFF'
    },
    description: 'Static assets',
    importance: 0.5,
    layer: 1,
    group: 'ui'
  },

  // Application Logic - Green spectrum
  'hook': {
    name: 'hook',
    color: {
      primary: '#059669',
      accent: '#34D399',
      text: '#FFFFFF'
    },
    description: 'React hooks',
    importance: 0.8,
    layer: 3,
    group: 'logic'
  },
  'context': {
    name: 'context',
    color: {
      primary: '#047857',
      accent: '#10B981',
      text: '#FFFFFF'
    },
    description: 'React context',
    importance: 0.7,
    layer: 3,
    group: 'logic'
  },
  'store': {
    name: 'store',
    color: {
      primary: '#065F46',
      accent: '#059669',
      text: '#FFFFFF'
    },
    description: 'State management',
    importance: 0.9,
    layer: 3,
    group: 'logic'
  },
  'service': {
    name: 'service',
    color: {
      primary: '#064E3B',
      accent: '#047857',
      text: '#FFFFFF'
    },
    description: 'Service layer',
    importance: 0.8,
    layer: 2,
    group: 'logic'
  },
  'util': {
    name: 'util',
    color: {
      primary: '#6EE7B7',
      accent: '#A7F3D0',
      text: '#000000'
    },
    description: 'Utility functions',
    importance: 0.6,
    layer: 1,
    group: 'logic'
  },

  // Data Layer - Purple spectrum
  'api': {
    name: 'api',
    color: {
      primary: '#7C3AED',
      accent: '#8B5CF6',
      text: '#FFFFFF'
    },
    description: 'API endpoints',
    importance: 0.9,
    layer: 3,
    group: 'data'
  },
  'model': {
    name: 'model',
    color: {
      primary: '#6D28D9',
      accent: '#7C3AED',
      text: '#FFFFFF'
    },
    description: 'Data models',
    importance: 0.8,
    layer: 2,
    group: 'data'
  },
  'schema': {
    name: 'schema',
    color: {
      primary: '#5B21B6',
      accent: '#6D28D9',
      text: '#FFFFFF'
    },
    description: 'Database schemas',
    importance: 0.7,
    layer: 2,
    group: 'data'
  },
  'query': {
    name: 'query',
    color: {
      primary: '#4C1D95',
      accent: '#5B21B6',
      text: '#FFFFFF'
    },
    description: 'Database queries',
    importance: 0.7,
    layer: 2,
    group: 'data'
  },

  // Type System - Pink spectrum
  'types': {
    name: 'types',
    color: {
      primary: '#DB2777',
      accent: '#EC4899',
      text: '#FFFFFF'
    },
    description: 'Type definitions',
    importance: 0.6,
    layer: 1,
    group: 'types'
  },
  'interface': {
    name: 'interface',
    color: {
      primary: '#BE185D',
      accent: '#DB2777',
      text: '#FFFFFF'
    },
    description: 'Interfaces',
    importance: 0.6,
    layer: 1,
    group: 'types'
  },

  // Testing & Config - Gray spectrum
  'test': {
    name: 'test',
    color: {
      primary: '#4B5563',
      accent: '#6B7280',
      text: '#FFFFFF'
    },
    description: 'Test files',
    importance: 0.5,
    layer: 1,
    group: 'testing'
  },
  'config': {
    name: 'config',
    color: {
      primary: '#374151',
      accent: '#4B5563',
      text: '#FFFFFF'
    },
    description: 'Configuration',
    importance: 0.6,
    layer: 1,
    group: 'config'
  },
  'env': {
    name: 'env',
    color: {
      primary: '#1F2937',
      accent: '#374151',
      text: '#FFFFFF'
    },
    description: 'Environment config',
    importance: 0.6,
    layer: 1,
    group: 'config'
  },

  // Special categories
  'directory': {
    name: 'directory',
    color: {
      primary: '#6B7280',
      accent: '#9CA3AF',
      text: '#FFFFFF'
    },
    description: 'Directory',
    importance: 0.4,
    layer: 0,
    group: 'structure'
  },
  'other': {
    name: 'other',
    color: {
      primary: '#9CA3AF',
      accent: '#D1D5DB',
      text: '#000000'
    },
    description: 'Other files',
    importance: 0.3,
    layer: 0,
    group: 'other'
  }
} as const;