/**
 * Component Quality Test Suite
 * 
 * This test suite ensures that all components adhere to our coding standards:
 * - Function length < 50 lines
 * - Every function has documentation
 * - Components follow biophilic design principles
 * - Proper typing with TypeScript
 */

import fs from 'fs';
import path from 'path';
import { parse } from '@typescript-eslint/typescript-estree';

// Directories to check for components
const COMPONENT_DIRECTORIES = [
  path.resolve(process.cwd(), 'src/components')
];

// Maximum allowed function length (in lines)
const MAX_FUNCTION_LENGTH = 50;

// CSS variables that should be present in style files for biophilic design
const BIOPHILIC_DESIGN_VARIABLES = [
  '--primary-color',
  '--secondary-color',
  '--tertiary-color',
  '--neutral-color'
];

// Function to recursively get all TypeScript/CSS files
function getAllFiles(dirPath: string, extensions: string[], arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, extensions, arrayOfFiles);
    } else if (extensions.some(ext => filePath.endsWith(ext))) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

// Function to count lines in a string
function countLines(str: string): number {
  return str.split('\n').length;
}

// Function to get function bodies from a TypeScript file
function getFunctionBodies(fileContent: string, filePath: string): Array<{name: string, body: string, hasJSDoc: boolean}> {
  try {
    const ast = parse(fileContent, {
      loc: true,
      range: true,
      jsx: true,
      tokens: true,
      comment: true,
      useJSXTextNode: true,
    });
    
    const functions: Array<{name: string, body: string, hasJSDoc: boolean}> = [];
    
    // Helper function to process the AST nodes
    function processNode(node: any, parent: any = null) {
      if (!node) return;
      
      // Check for function declarations, arrow functions, and methods
      if (
        node.type === 'FunctionDeclaration' || 
        node.type === 'ArrowFunctionExpression' ||
        node.type === 'FunctionExpression' ||
        node.type === 'MethodDefinition'
      ) {
        let functionName = 'anonymous';
        let functionBody = '';
        
        // Extract function name
        if (node.id && node.id.name) {
          functionName = node.id.name;
        } else if (parent && parent.key && parent.key.name) {
          functionName = parent.key.name;
        } else if (parent && parent.id && parent.id.name) {
          functionName = parent.id.name;
        }
        
        // Extract function body as string
        if (node.body && node.body.range) {
          const start = node.body.range[0];
          const end = node.body.range[1];
          functionBody = fileContent.substring(start, end);
        }
        
        // Check for JSDoc comments
        let hasJSDoc = false;
        if (node.leadingComments) {
          hasJSDoc = node.leadingComments.some((comment: any) => 
            comment.type === 'Block' && comment.value.startsWith('*')
          );
        }
        
        if (functionBody) {
          functions.push({
            name: functionName,
            body: functionBody,
            hasJSDoc
          });
        }
      }
      
      // Recursively process all properties of the node
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach((child: any) => processNode(child, node));
          } else {
            processNode(node[key], node);
          }
        }
      }
    }
    
    processNode(ast);
    return functions;
    
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return [];
  }
}

describe('Component Quality Standards', () => {
  // Get all TypeScript component files
  const tsComponentFiles = getAllFiles(COMPONENT_DIRECTORIES[0], ['.tsx', '.ts'], []);
  
  // Get all CSS files
  const cssFiles = getAllFiles(path.resolve(process.cwd(), 'src'), ['.css'], []);
  
  test('All functions should be less than 50 lines', () => {
    const longFunctions: Array<{file: string, function: string, lines: number}> = [];
    
    tsComponentFiles.forEach(filePath => {
      if (filePath.includes('.test.') || filePath.includes('.spec.')) return;
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const functions = getFunctionBodies(fileContent, filePath);
      
      functions.forEach(func => {
        const lineCount = countLines(func.body);
        if (lineCount > MAX_FUNCTION_LENGTH) {
          longFunctions.push({
            file: path.relative(process.cwd(), filePath),
            function: func.name,
            lines: lineCount
          });
        }
      });
    });
    
    if (longFunctions.length > 0) {
      console.error('Functions exceeding 50 lines:', longFunctions);
    }
    
    expect(longFunctions).toEqual([]);
  });
  
  test('All functions should have JSDoc comments', () => {
    const undocumentedFunctions: Array<{file: string, function: string}> = [];
    
    tsComponentFiles.forEach(filePath => {
      if (filePath.includes('.test.') || filePath.includes('.spec.')) return;
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const functions = getFunctionBodies(fileContent, filePath);
      
      functions.forEach(func => {
        if (!func.hasJSDoc && func.name !== 'anonymous') {
          undocumentedFunctions.push({
            file: path.relative(process.cwd(), filePath),
            function: func.name
          });
        }
      });
    });
    
    if (undocumentedFunctions.length > 0) {
      console.error('Undocumented functions:', undocumentedFunctions);
    }
    
    expect(undocumentedFunctions).toEqual([]);
  });
  
  test('CSS should include biophilic design variables', () => {
    const cssWithoutBiophilicVariables: string[] = [];
    
    // Check global and main CSS files specifically
    const mainCssFiles = cssFiles.filter(file => 
      file.includes('globals.css') || 
      file.includes('enhanced-chat-demo.css') || 
      file.includes('index.css')
    );
    
    mainCssFiles.forEach(filePath => {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      const missingVariables = BIOPHILIC_DESIGN_VARIABLES.filter(variable => 
        !fileContent.includes(variable)
      );
      
      if (missingVariables.length > 0) {
        cssWithoutBiophilicVariables.push(
          `${path.relative(process.cwd(), filePath)} is missing: ${missingVariables.join(', ')}`
        );
      }
    });
    
    if (cssWithoutBiophilicVariables.length > 0) {
      console.error('CSS files missing biophilic design variables:', cssWithoutBiophilicVariables);
    }
    
    expect(cssWithoutBiophilicVariables).toEqual([]);
  });
  
  test('Component files should use TypeScript properly', () => {
    const typescriptIssues: string[] = [];
    
    tsComponentFiles.forEach(filePath => {
      if (filePath.includes('.test.') || filePath.includes('.spec.')) return;
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Check for 'any' type which should be avoided
      const anyMatches = fileContent.match(/: any(\s|\)|\[|,|;|=)/g);
      if (anyMatches && anyMatches.length > 0) {
        typescriptIssues.push(`${path.relative(process.cwd(), filePath)} uses 'any' type ${anyMatches.length} times`);
      }
      
      // Check for props interfaces or type definitions
      if (fileContent.includes('React.FC') || fileContent.includes('FunctionComponent')) {
        const hasPropsType = fileContent.includes('type Props') || 
                             fileContent.includes('interface Props') ||
                             fileContent.includes('type ComponentProps') ||
                             fileContent.includes('interface ComponentProps');
                             
        if (!hasPropsType && !fileContent.includes('React.FC<{}>') && !fileContent.includes('FunctionComponent<{}>')) {
          typescriptIssues.push(`${path.relative(process.cwd(), filePath)} is missing props type definition`);
        }
      }
    });
    
    if (typescriptIssues.length > 0) {
      console.error('TypeScript issues:', typescriptIssues);
    }
    
    expect(typescriptIssues).toEqual([]);
  });
});
