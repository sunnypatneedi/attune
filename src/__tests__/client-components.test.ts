/**
 * Client Components Test Suite
 *
 * Ensures that React components using hooks have the 'use client' directive.
 */

import fs from 'fs';
import path from 'path';

const COMPONENT_DIRECTORIES = [
  path.resolve(process.cwd(), 'src/components'),
  path.resolve(process.cwd(), 'src/hooks'),
];

const CLIENT_HOOKS = [
  'useState',
  'useEffect',
  'useRef',
  'useContext',
  'useReducer',
  'useCallback',
  'useMemo',
];

function containsReactHooks(fileContent: string): boolean {
  return CLIENT_HOOKS.some(
    (hook) =>
      fileContent.includes(`${hook}(`) ||
      fileContent.includes(`${hook} (`) ||
      fileContent.includes(`React.${hook}(`)
  );
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

describe('Client Components Configuration', () => {
  const allComponentFiles: string[] = [];
  COMPONENT_DIRECTORIES.forEach((dir) => {
    if (fs.existsSync(dir)) {
      allComponentFiles.push(...getAllFiles(dir));
    }
  });

  test('Components using React hooks have "use client" directive', () => {
    const missingDirective: string[] = [];

    allComponentFiles.forEach((filePath) => {
      if (filePath.includes('.test.') || filePath.includes('.spec.')) return;
      // Skip shadcn/ui components -- they are generated
      if (filePath.includes('/ui/')) return;

      const fileContent = fs.readFileSync(filePath, 'utf8');

      if (containsReactHooks(fileContent)) {
        const hasDirective =
          fileContent.includes("'use client'") ||
          fileContent.includes('"use client"');
        if (!hasDirective) {
          missingDirective.push(path.relative(process.cwd(), filePath));
        }
      }
    });

    if (missingDirective.length > 0) {
      console.error('Missing "use client" directive:', missingDirective);
    }
    expect(missingDirective).toEqual([]);
  });
});
