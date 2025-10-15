#!/usr/bin/env node

/**
 * Bundle Analysis Script for PumpFun API Client
 *
 * This script analyzes the built bundles and provides detailed size information
 * to help track optimization progress and ensure we stay within size targets.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

function colorize(text, color) {
  return `${color}${text}${colors.reset}`;
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function analyzeFile(filePath, relativePath) {
  const size = getFileSize(filePath);
  const isGzipped = filePath.endsWith('.gz');
  const isMap = filePath.endsWith('.map');

  return {
    path: relativePath,
    size,
    formattedSize: formatBytes(size),
    isGzipped,
    isMap
  };
}

function analyzeDirectory(dirPath, relativePath = '') {
  const results = [];

  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const itemRelativePath = path.join(relativePath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        results.push(...analyzeDirectory(itemPath, itemRelativePath));
      } else if (stats.isFile() && (item.endsWith('.js') || item.endsWith('.mjs') || item.endsWith('.d.ts'))) {
        results.push(analyzeFile(itemPath, itemRelativePath));
      }
    }
  } catch (error) {
    console.warn(colorize(`Warning: Could not analyze directory ${dirPath}: ${error.message}`, colors.yellow));
  }

  return results;
}

function createGzippedSize(filePath) {
  // This is a placeholder - actual gzip implementation would require zlib
  // For now, we'll estimate gzip size as ~30% of original
  const originalSize = getFileSize(filePath);
  return Math.floor(originalSize * 0.3);
}

function printAnalysis() {
  console.log(colorize('📊 PumpFun API Client - Bundle Size Analysis', colors.cyan));
  console.log(colorize('='.repeat(60), colors.gray));
  console.log('');

  if (!fs.existsSync(distDir)) {
    console.log(colorize('❌ Dist directory not found. Run `npm run build` first.', colors.red));
    return;
  }

  const files = analyzeDirectory(distDir);

  // Group files by type
  const mainBundle = files.find(f => f.path === 'index.js');
  const mainESM = files.find(f => f.path === 'index.esm.js');
  const utilsBundle = files.find(f => f.path === 'utils/index.js');
  const utilsESM = files.find(f => f.path === 'utils/index.esm.js');
  const clientBundle = files.find(f => f.path === 'client/index.js');
  const clientESM = files.find(f => f.path === 'client/index.esm.js');
  const typeDefinitions = files.filter(f => f.path.endsWith('.d.ts'));
  const sourceMaps = files.filter(f => f.path.endsWith('.map'));

  // Main bundle analysis
  console.log(colorize('🎯 Main Bundle Analysis', colors.blue));
  console.log(colorize('-'.repeat(30), colors.gray));

  if (mainBundle) {
    const gzippedSize = createGzippedSize(path.join(distDir, mainBundle.path));
    const status = mainBundle.size < 500000 ? colors.green : colors.red;

    console.log(`CommonJS: ${colorize(mainBundle.formattedSize, status)} (gz: ~${formatBytes(gzippedSize)})`);
  }

  if (mainESM) {
    const gzippedSize = createGzippedSize(path.join(distDir, mainESM.path));
    const status = mainESM.size < 500000 ? colors.green : colors.red;

    console.log(`ES Module: ${colorize(mainESM.formattedSize, status)} (gz: ~${formatBytes(gzippedSize)})`);
  }

  console.log('');

  // Sub-module analysis
  console.log(colorize('📦 Sub-module Analysis', colors.blue));
  console.log(colorize('-'.repeat(30), colors.gray));

  if (utilsBundle) {
    console.log(`Utils (CJS): ${colorize(utilsBundle.formattedSize, colors.blue)}`);
  }
  if (utilsESM) {
    console.log(`Utils (ESM): ${colorize(utilsESM.formattedSize, colors.blue)}`);
  }
  if (clientBundle) {
    console.log(`Client (CJS): ${colorize(clientBundle.formattedSize, colors.blue)}`);
  }
  if (clientESM) {
    console.log(`Client (ESM): ${colorize(clientESM.formattedSize, colors.blue)}`);
  }

  console.log('');

  // Type definitions analysis
  console.log(colorize('📝 Type Definitions', colors.magenta));
  console.log(colorize('-'.repeat(30), colors.gray));

  const totalTypeSize = typeDefinitions.reduce((sum, file) => sum + file.size, 0);
  console.log(`Total: ${colorize(formatBytes(totalTypeSize), colors.magenta)} (${typeDefinitions.length} files)`);

  console.log('');

  // Source maps analysis
  console.log(colorize('🗺️  Source Maps', colors.gray));
  console.log(colorize('-'.repeat(30), colors.gray));

  const totalMapSize = sourceMaps.reduce((sum, file) => sum + file.size, 0);
  console.log(`Total: ${colorize(formatBytes(totalMapSize), colors.gray)} (${sourceMaps.length} files)`);

  console.log('');

  // Overall analysis
  console.log(colorize('📈 Overall Package Size', colors.cyan));
  console.log(colorize('-'.repeat(30), colors.gray));

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const totalWithoutMaps = files.filter(f => !f.isMap).reduce((sum, file) => sum + file.size, 0);
  const totalWithoutMapsAndTypes = files.filter(f => !f.isMap && !f.path.endsWith('.d.ts')).reduce((sum, file) => sum + file.size, 0);

  console.log(`Total (with maps & types): ${colorize(formatBytes(totalSize), colors.cyan)}`);
  console.log(`Total (without maps): ${colorize(formatBytes(totalWithoutMaps), colors.cyan)}`);
  console.log(`Total (without maps & types): ${colorize(formatBytes(totalWithoutMapsAndTypes), colors.cyan)}`);

  console.log('');

  // Optimization recommendations
  console.log(colorize('💡 Optimization Status', colors.yellow));
  console.log(colorize('-'.repeat(30), colors.gray));

  const targetSize = 500 * 1024; // 500KB
  const mainBundleSize = mainESM?.size || mainBundle?.size || 0;

  if (mainBundleSize <= targetSize) {
    console.log(colorize('✅ Main bundle size is within target (< 500KB)', colors.green));
  } else {
    console.log(colorize(`❌ Main bundle size exceeds target (${formatBytes(mainBundleSize)} > 500KB)`, colors.red));
  }

  // Tree-shaking effectiveness check
  const utilsRatio = utilsESM ? (utilsESM.size / mainBundleSize) * 100 : 0;
  const clientRatio = clientESM ? (clientESM.size / mainBundleSize) * 100 : 0;

  console.log(`Utils sub-module ratio: ${colorize(utilsRatio.toFixed(1) + '%', colors.blue)}`);
  console.log(`Client sub-module ratio: ${colorize(clientRatio.toFixed(1) + '%', colors.blue)}`);

  if (utilsRatio < 20 && clientRatio < 20) {
    console.log(colorize('✅ Good tree-shaking separation detected', colors.green));
  } else {
    console.log(colorize('⚠️  Consider improving tree-shaking separation', colors.yellow));
  }

  console.log('');

  // Performance metrics
  console.log(colorize('⚡ Performance Metrics', colors.green));
  console.log(colorize('-'.repeat(30), colors.gray));

  const estimatedLoadTime = (mainBundleSize / (1024 * 1024)) * 0.1; // Rough estimate: 100ms per MB
  const gzippedLoadTime = (createGzippedSize(path.join(distDir, mainESM?.path || mainBundle?.path || '')) / (1024 * 1024)) * 0.1;

  console.log(`Estimated load time (uncompressed): ${colorize(estimatedLoadTime.toFixed(0) + 'ms', colors.green)}`);
  console.log(`Estimated load time (gzipped): ${colorize(gzippedLoadTime.toFixed(0) + 'ms', colors.green)}`);

  if (gzippedLoadTime < 100) {
    console.log(colorize('✅ Excellent load performance', colors.green));
  } else if (gzippedLoadTime < 200) {
    console.log(colorize('✅ Good load performance', colors.yellow));
  } else {
    console.log(colorize('⚠️  Consider further optimization', colors.red));
  }
}

// Run the analysis
printAnalysis();