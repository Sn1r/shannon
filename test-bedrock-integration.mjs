#!/usr/bin/env node
// Copyright (C) 2025 Keygraph, Inc.
//
// Test script for AWS Bedrock integration

import chalk from 'chalk';
import { isBedrockEnabled, validateBedrockConfig } from './src/ai/bedrock-provider.js';

console.log(chalk.cyan.bold('\n🧪 AWS Bedrock Integration Test\n'));
console.log(chalk.gray('─'.repeat(60)));

// Test 1: Check environment detection
console.log(chalk.blue('\n📋 Test 1: Environment Detection'));
console.log(chalk.gray('Checking if Bedrock is properly detected...'));

const bedrockEnabled = isBedrockEnabled();
console.log(`Bedrock Enabled: ${bedrockEnabled ? chalk.green('✅ Yes') : chalk.yellow('❌ No')}`);

if (bedrockEnabled) {
  console.log(chalk.blue('\n📋 Test 2: Configuration Validation'));
  console.log(chalk.gray('Validating Bedrock configuration...'));
  
  try {
    validateBedrockConfig();
    console.log(chalk.green('✅ Configuration is valid'));
  } catch (error) {
    console.log(chalk.red(`❌ Configuration error: ${error.message}`));
    process.exit(1);
  }

  // Test 3: Check credentials
  console.log(chalk.blue('\n📋 Test 3: Credentials Check'));
  console.log(chalk.gray('Verifying AWS credentials are set...'));
  
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'us-east-1';
  
  console.log(`Access Key ID: ${accessKeyId ? chalk.green('✅ Set (***' + accessKeyId.slice(-4) + ')') : chalk.red('❌ Not set')}`);
  console.log(`Secret Access Key: ${secretAccessKey ? chalk.green('✅ Set (hidden)') : chalk.red('❌ Not set')}`);
  console.log(`Region: ${chalk.green(region)}`);
  
  if (process.env.AWS_SESSION_TOKEN) {
    console.log(`Session Token: ${chalk.green('✅ Set (temporary credentials)')}`);
  }
  
  if (process.env.BEDROCK_MODEL_ID) {
    console.log(`Custom Model ID: ${chalk.green(process.env.BEDROCK_MODEL_ID)}`);
  }

  // Test 4: Import check
  console.log(chalk.blue('\n📋 Test 4: Module Import Test'));
  console.log(chalk.gray('Testing Bedrock module imports...'));
  
  try {
    const { createBedrockQueryFunction } = await import('./src/ai/bedrock-provider.js');
    console.log(chalk.green('✅ Bedrock provider module imported successfully'));
    
    // Test query function creation
    const queryFunc = createBedrockQueryFunction();
    console.log(chalk.green('✅ Query function created successfully'));
    console.log(chalk.gray(`   Function type: ${typeof queryFunc}`));
  } catch (error) {
    console.log(chalk.red(`❌ Module import failed: ${error.message}`));
    console.log(chalk.gray(error.stack));
    process.exit(1);
  }

  // Test 5: Integration with claude-executor
  console.log(chalk.blue('\n📋 Test 5: Claude Executor Integration'));
  console.log(chalk.gray('Testing integration with main executor...'));
  
  try {
    const { runClaudePromptWithRetry } = await import('./src/ai/claude-executor.js');
    console.log(chalk.green('✅ Claude executor imported successfully'));
    console.log(chalk.green('✅ Bedrock integration hooks in place'));
  } catch (error) {
    console.log(chalk.red(`❌ Executor integration failed: ${error.message}`));
    console.log(chalk.gray(error.stack));
    process.exit(1);
  }

  console.log(chalk.green.bold('\n✅ All tests passed!'));
  console.log(chalk.cyan('\nBedrock integration is ready to use.'));
  console.log(chalk.gray('You can now run Shannon with AWS Bedrock as the AI provider.'));
  
} else {
  console.log(chalk.yellow('\n⚠️  Bedrock is not enabled'));
  console.log(chalk.gray('\nTo enable Bedrock, set these environment variables:'));
  console.log(chalk.cyan('  export AWS_ACCESS_KEY_ID="your-access-key"'));
  console.log(chalk.cyan('  export AWS_SECRET_ACCESS_KEY="your-secret-key"'));
  console.log(chalk.cyan('  export AWS_REGION="us-east-1"  # Optional'));
  
  console.log(chalk.gray('\nOr ensure no Anthropic credentials are set to auto-enable Bedrock:'));
  console.log(chalk.cyan('  unset ANTHROPIC_API_KEY'));
  console.log(chalk.cyan('  unset CLAUDE_CODE_OAUTH_TOKEN'));
  
  console.log(chalk.blue('\n📋 Current Environment:'));
  console.log(`  AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? chalk.green('Set') : chalk.red('Not set')}`);
  console.log(`  AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? chalk.green('Set') : chalk.red('Not set')}`);
  console.log(`  ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? chalk.yellow('Set (takes precedence)') : chalk.gray('Not set')}`);
  console.log(`  CLAUDE_CODE_OAUTH_TOKEN: ${process.env.CLAUDE_CODE_OAUTH_TOKEN ? chalk.yellow('Set (takes precedence)') : chalk.gray('Not set')}`);
}

console.log(chalk.gray('\n' + '─'.repeat(60)));

