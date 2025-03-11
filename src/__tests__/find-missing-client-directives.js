/**
 * Script to identify files missing 'use client' directive
 * 
 * This script analyzes all React component files and identifies
 * which ones are using hooks but missing the required directive.
 * Following our project's quality standards, we ensure all client
 * components are properly configured.
 */

const fs = require('fs');
const path = require('path');

// Directories to check
const DIRECTORIES = [
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

// Get all TS/TSX files in the given directories
function getFiles(dirs) {
  let files = [];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    
    const dirFiles = fs.readdirSync(dir, { withFileTypes: true });
    
    dirFiles.forEach(file => {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        files = files.concat(getFiles([filePath]));
      } else if (
        file.name.endsWith('.tsx') || 
        file.name.endsWith('.ts') || 
        file.name.endsWith('.jsx') || 
        file.name.endsWith('.js')
      ) {
        files.push(filePath);
      }
    });
  });
  
  return files;
}

// Check if file contains client hooks
function containsHooks(content) {
  return CLIENT_HOOKS.some(hook => 
    content.includes(`${hook}(`) || 
    content.includes(`${hook} (`) ||
    content.includes(`React.${hook}(`) ||
    content.includes(`React.${hook} (`)
  );
}

// Check if file has 'use client' directive
function hasClientDirective(content) {
  return content.includes("'use client'") || content.includes('"use client"');
}

// Main function
function findMissingClientDirectives() {
  const allFiles = getFiles(DIRECTORIES);
  const filesMissingDirective = [];
  
  allFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Skip test files
      if (filePath.includes('.test.') || filePath.includes('.spec.')) {
        return;
      }
      
      if (containsHooks(content) && !hasClientDirective(content)) {
        filesMissingDirective.push({
          file: path.relative(process.cwd(), filePath),
          hooks: CLIENT_HOOKS.filter(hook => 
            content.includes(`${hook}(`) || 
            content.includes(`${hook} (`) ||
            content.includes(`React.${hook}(`) ||
            content.includes(`React.${hook} (`)
          )
        });
      }
    } catch (err) {
      console.error(`Error reading file ${filePath}:`, err);
    }
  });
  
  return filesMissingDirective;
}

// Run the analysis and log results
const missingDirectives = findMissingClientDirectives();

if (missingDirectives.length === 0) {
  console.log('✅ All client components have the required "use client" directive.');
} else {
  console.log('❌ Found files missing "use client" directive:');
  missingDirectives.forEach(item => {
    console.log(`- ${item.file} (using hooks: ${item.hooks.join(', ')})`);
  });
}

// Exit with error code if issues found (useful for CI pipelines)
process.exit(missingDirectives.length > 0 ? 1 : 0);
