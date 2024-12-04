export const DESIGN_SYSTEM = {
  colors: {
    // Primary node colors - chosen for clarity and sophistication
    root: '#7C3AED',       // Deep purple for the root/core
    page: '#3B82F6',       // Bright blue for pages
    component: '#10B981',  // Emerald for components
    logic: '#F59E0B',     // Amber for logic/hooks
    data: '#EC4899',      // Pink for data/api
    util: '#6B7280',      // Cool gray for utilities
    
    // Environment
    background: '#000',
    grid: '#f1f5f9',
    gridAccent: '#e2e8f0',
    
    // Text
    textPrimary: '#1e293b',
    textSecondary: '#64748b'
  },

  scales: {
    // Node sizes relative to base unit
    root: 1.8,
    page: 1.3,
    component: 1,
    logic: 0.9,
    data: 0.85,
    util: 0.7
  },

  orbits: {
    // Orbital distances from center
    pages: 18,        // Key pages close to core
    components: 30,   // Components in middle layer
    logic: 42,        // Business logic layer
    data: 54,         // Data layer
    utils: 66         // Utilities in outer ring
  },

  animation: {
    rotationSpeeds: {
      pages: 0.15,
      components: 0.12,
      logic: 0.09,
      data: 0.06,
      utils: 0.03
    },
    hover: {
      scale: 1.15,
      duration: 0.3
    }
  },

  materials: {
    // Standard node material properties
    node: {
      metalness: 0.2,
      roughness: 0.7,    // More matte finish
      envMapIntensity: 1
    },
    // Root node special properties
    root: {
      metalness: 0.3,
      roughness: 0.5,    // Slightly more polished
      envMapIntensity: 1.2
    }
  }
} as const;

// Category mappings
export const CATEGORY_MAPPING = {
  root: 'root',
  page: 'page',
  layout: 'page',
  component: 'component',
  ui: 'component',
  hook: 'logic',
  context: 'logic',
  store: 'logic',
  api: 'data',
  service: 'data',
  model: 'data',
  util: 'util',
  types: 'util',
  config: 'util',
  test: 'util',
  other: 'util'
} as const;

// Node shapes based on function
export const NODE_SHAPES = {
  root: 'sphere',
  page: 'box',          // Pages as clean rectangles
  component: 'sphere',  // Components as smooth spheres
  logic: 'octahedron', // Logic as angular shapes
  data: 'sphere',      // Data as spheres
  util: 'sphere'       // Utils as small spheres
} as const;