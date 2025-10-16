if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('basic-usage.ts')) {
  const args = process.argv.slice(2);
  const demoType = args[0]

  console.log(`🎯 Running demo: ${demoType}`);
}