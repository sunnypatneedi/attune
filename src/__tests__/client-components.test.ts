/**
 * Client Components Test Suite
 * 
 * This test suite ensures that all React components using hooks 
 * are properly configured as client components with the 'use client' directive.
 */

import fs from 'fs';
import path from 'path';

// Directories to check for components
const COMPONENT_DIRECTORIES = [
  path.resolve(process.cwd(), 'src/components'),
  path.resolve(process.cwd(), 'src/hooks')
];

// React hooks that require client components
const CLIENT_HOOKS = [
  'useState',
  'useEffect',
  'useRef',
  'useContext',
  'useReducer',
  'useCallback',
  'useMemo',
  'useImperativeHandle',
  'useLayoutEffect',
  'useDebugValue',
  'useId'
];

// Function to check if file contains React hooks
function containsReactHooks(fileContent: string): boolean {
  return CLIENT_HOOKS.some(hook => 
    fileContent.includes(`${hook}(`) || 
    fileContent.includes(`${hook} (`) ||
    fileContent.includes(`React.${hook}(`) ||
    fileContent.includes(`React.${hook} (`)
  );
}

// Function to recursively get all TypeScript/JavaScript files
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (
      filePath.endsWith('.tsx') || 
      filePath.endsWith('.ts') || 
      filePath.endsWith('.jsx') || 
      filePath.endsWith('.js')
    ) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

describe('Client Components Configuration', () => {
  // Get all component files
  const allComponentFiles: string[] = [];
  COMPONENT_DIRECTORIES.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = getAllFiles(dir);
      allComponentFiles.push(...files);
    }
  });

  test('All components using React hooks have "use client" directive', () => {
    allComponentFiles.forEach(filePath => {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Skip if file is already marked as a test
      if (filePath.includes('.test.') || filePath.includes('.spec.')) {
        return;
      }
      
      // Check if file contains React hooks
      if (containsReactHooks(fileContent)) {
        // Verify it has 'use client' directive
        expect(fileContent.includes("'use client'") || fileContent.includes('"use client"')).toBeTruthy();
      }
    });
  });

  test('All files with "useState" or "useEffect" have "use client" directive', () => {
    const criticalHooks = ['useState', 'useEffect', 'useRef'];
    
    allComponentFiles.forEach(filePath => {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Skip tests
      if (filePath.includes('.test.') || filePath.includes('.spec.')) {
        return;
      }
      
      // Check specifically for critical hooks
      const hasCriticalHook = criticalHooks.some(hook => 
        fileContent.includes(`${hook}(`) || 
        fileContent.includes(`${hook} (`) ||
        fileContent.includes(`React.${hook}(`) ||
        fileContent.includes(`React.${hook} (`)
      );
      
      if (hasCriticalHook) {
        expect(fileContent.includes("'use client'") || fileContent.includes('"use client"')).toBeTruthy();
      }
    });
  });
});
