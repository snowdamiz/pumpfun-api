#!/usr/bin/env node

/**
 * Fix ES module imports to include .js extensions
 * This script fixes the compiled JavaScript files to work with Node.js ES modules
 */

import fs from 'fs';
import path from 'path';

const distDir = './dist';
const examplesDir = './dist/examples';

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix relative imports by adding .js extensions
    content = content.replace(
      /from ['"]\.\.\/([^'"]+)['"]/g,
      (match, importPath) => {
        // Don't add .js if it already has an extension
        if (importPath.endsWith('.js') || importPath.endsWith('.ts')) {
          return match;
        }

        // Handle directory imports (they should point to index.js)
        if (!importPath.includes('.')) {
          return `from "../${importPath}/index.js"`;
        }

        return `from "../${importPath}.js"`;
      }
    );

    // Fix imports from types directory
    content = content.replace(
      /from ['"]\.\.\/types['"]/g,
      'from "../types/index.js"'
    );

    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed imports in: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing imports in ${filePath}:`, error.message);
  }
}

// Function to recursively find and fix JavaScript files
function fixImportsInDirectory(dir) {
  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        fixImportsInDirectory(filePath);
      } else if (file.endsWith('.js')) {
        fixImportsInFile(filePath);
      }
    }
  } catch (error) {
    console.error(`❌ Error processing directory ${dir}:`, error.message);
  }
}

// Main execution
console.log('🔧 Fixing ES module imports...');

if (fs.existsSync(distDir)) {
  fixImportsInDirectory(distDir);
}

if (fs.existsSync(examplesDir)) {
  fixImportsInDirectory(examplesDir);
}

console.log('✅ All imports fixed successfully!');