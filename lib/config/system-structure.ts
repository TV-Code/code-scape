export const RELEVANT_DIRECTORIES = [
  'app',
  'components',
  'hooks',
  'lib',
  'types'
];

// Directories that should be ignored completely
export const IGNORED_DIRECTORIES = [
  '.bolt',
  '.git',
  '.next',
  'node_modules',
  'public',
  'dist'
];

// Special known file types and their importance
export const FILE_TYPES = {
  'page.tsx': 'page',
  'layout.tsx': 'layout',
  'providers.tsx': 'core',
  'store.ts': 'core',
  'types.ts': 'types',
  'utils.ts': 'utility',
  'api': 'api'
} as const;