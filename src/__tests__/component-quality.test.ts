/**
 * Component Quality Test Suite
 *
 * Ensures components meet basic quality standards.
 */

import fs from 'fs';
import path from 'path';

const COMPONENT_DIR = path.resolve(process.cwd(), 'src/components/chat');

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

describe('Component Quality Standards', () => {
  const chatComponents = getAllFiles(COMPONENT_DIR);

  test('Chat components exist', () => {
    expect(chatComponents.length).toBeGreaterThan(0);
  });

  test('All chat components are properly exported', () => {
    chatComponents.forEach((filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      const hasExport =
        content.includes('export function') ||
        content.includes('export const') ||
        content.includes('export default');
      expect(hasExport).toBeTruthy();
    });
  });

  test('No direct DOM manipulation in components', () => {
    chatComponents.forEach((filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      // Allow classList for theme toggling
      const hasDangerousDOM =
        content.includes('document.getElementById') ||
        content.includes('document.getElementsBy') ||
        content.includes('innerHTML');
      if (hasDangerousDOM) {
        console.warn(
          `${path.relative(process.cwd(), filePath)} uses direct DOM manipulation`
        );
      }
      expect(hasDangerousDOM).toBeFalsy();
    });
  });
});
