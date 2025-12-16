#!/usr/bin/env node
// Simple test to verify all Bedrock imports work correctly

import chalk from 'chalk';

console.log(chalk.cyan('\n🧪 Testing Bedrock Integration Imports\n'));

try {
  // Test bedrock-provider imports
  console.log(chalk.gray('Importing bedrock-provider...'));
  const bedrockProvider = await import('./src/ai/bedrock-provider.js');
  console.log(chalk.green('✅ bedrock-provider imported'));
  
  // Test claude-executor imports
  console.log(chalk.gray('Importing claude-executor...'));
  const claudeExecutor = await import('./src/ai/claude-executor.js');
  console.log(chalk.green('✅ claude-executor imported'));
  
  // Verify functions exist
  console.log(chalk.gray('\nVerifying exported functions...'));
  
  if (typeof bedrockProvider.isBedrockEnabled === 'function') {
    console.log(chalk.green('✅ isBedrockEnabled function exists'));
  }
  
  if (typeof bedrockProvider.validateBedrockConfig === 'function') {
    console.log(chalk.green('✅ validateBedrockConfig function exists'));
  }
  
  if (typeof bedrockProvider.createBedrockQueryFunction === 'function') {
    console.log(chalk.green('✅ createBedrockQueryFunction function exists'));
  }
  
  if (typeof claudeExecutor.runClaudePromptWithRetry === 'function') {
    console.log(chalk.green('✅ runClaudePromptWithRetry function exists'));
  }
  
  console.log(chalk.green.bold('\n✅ All imports successful!\n'));
  process.exit(0);
  
} catch (error) {
  console.log(chalk.red(`\n❌ Import failed: ${error.message}\n`));
  console.log(chalk.gray(error.stack));
  process.exit(1);
}

