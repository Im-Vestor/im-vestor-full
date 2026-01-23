#!/usr/bin/env ts-node

/**
 * Performance Report Generator
 *
 * Run this script to generate a performance report of your API endpoints:
 * npx ts-node scripts/performance-report.ts
 */

import { printPerformanceReport } from '../src/utils/performance-logger';

console.log('\n🚀 Generating Performance Report...\n');

printPerformanceReport();

console.log('\n✅ Report generated successfully!\n');
console.log('💡 To see live performance metrics:');
console.log('   1. Start your dev server: npm run dev');
console.log('   2. Use your application for a few minutes');
console.log('   3. A report will auto-generate every 5 minutes\n');
console.log('📝 Or check the console logs for individual endpoint timings\n');
