#!/usr/bin/env node
// Test for Claude 4/Sonnet 4 models

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import chalk from 'chalk';

console.log(chalk.cyan.bold('\n🔍 Searching for Claude Sonnet 4 Models\n'));

const region = process.env.AWS_REGION || 'us-east-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

console.log(`Region: ${region}\n`);

if (!accessKeyId || !secretAccessKey) {
  console.log(chalk.red('❌ AWS credentials not set'));
  process.exit(1);
}

// All possible Claude 4/Sonnet 4 naming variations
const modelsToTest = [
  // Standard naming
  'anthropic.claude-sonnet-4-0-20241217-v1:0',
  'anthropic.claude-4-sonnet-20241217-v1:0',
  'anthropic.claude-sonnet-4-20241217-v1:0',
  
  // US prefix
  'us.anthropic.claude-sonnet-4-0-20241217-v1:0',
  'us.anthropic.claude-4-sonnet-20241217-v1:0',
  'us.anthropic.claude-sonnet-4-20241217-v1:0',
  
  // EU prefix
  'eu.anthropic.claude-sonnet-4-0-20241217-v1:0',
  'eu.anthropic.claude-4-sonnet-20241217-v1:0',
  'eu.anthropic.claude-sonnet-4-20241217-v1:0',
  
  // Without date
  'anthropic.claude-sonnet-4-v1:0',
  'anthropic.claude-4-sonnet-v1:0',
  'us.anthropic.claude-sonnet-4-v1:0',
  'eu.anthropic.claude-sonnet-4-v1:0',
  
  // With different date formats
  'anthropic.claude-sonnet-4-20241210-v1:0',
  'eu.anthropic.claude-sonnet-4-20241210-v1:0',
  'anthropic.claude-sonnet-4-20241201-v1:0',
  'eu.anthropic.claude-sonnet-4-20241201-v1:0',
  
  // Alternative formats
  'anthropic.claude-sonnet-4.0-v1:0',
  'eu.anthropic.claude-sonnet-4.0-v1:0',
  
  // Version 2 models
  'anthropic.claude-3-5-sonnet-20241022-v2:0',
  'eu.anthropic.claude-3-5-sonnet-20241022-v2:0',
];

const client = new BedrockRuntimeClient({
  region,
  credentials: { accessKeyId, secretAccessKey }
});

const workingModels = [];

for (const modelId of modelsToTest) {
  try {
    process.stdout.write(chalk.gray(`Testing: ${modelId}... `));
    
    const command = new ConverseCommand({
      modelId,
      messages: [{ role: 'user', content: [{ text: 'Hi' }] }],
      inferenceConfig: { maxTokens: 5, temperature: 1.0 }
    });

    await client.send(command);
    console.log(chalk.green('✅ FOUND!'));
    workingModels.push(modelId);
  } catch (error) {
    if (error.message?.includes('model identifier')) {
      console.log(chalk.red('❌'));
    } else if (error.message?.includes('not enabled')) {
      console.log(chalk.yellow('⚠️  Exists but not enabled'));
      workingModels.push(`${modelId} (not enabled)`);
    } else {
      console.log(chalk.gray('❌'));
    }
  }
}

console.log('\n' + chalk.gray('─'.repeat(60)));

if (workingModels.length > 0) {
  console.log(chalk.green.bold('\n✅ Found Claude 4 models:\n'));
  workingModels.forEach((m, i) => console.log(chalk.cyan(`  ${i + 1}. ${m}`)));
} else {
  console.log(chalk.yellow('\n⚠️  Claude Sonnet 4 not found in this region'));
  console.log(chalk.gray('\nUsing Claude 3.5 Sonnet instead (still very capable)'));
}

console.log();

