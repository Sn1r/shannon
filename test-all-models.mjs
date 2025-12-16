#!/usr/bin/env node
// Comprehensive test of all possible Claude model IDs in Bedrock

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import chalk from 'chalk';

console.log(chalk.cyan.bold('\n🧪 Comprehensive Bedrock Model Test\n'));
console.log(chalk.gray('─'.repeat(60)));

const region = process.env.AWS_REGION || 'us-east-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

console.log(chalk.blue('\n📋 Configuration:'));
console.log(`  Region: ${chalk.green(region)}`);
console.log(`  Testing all Claude model variants...\n`);

if (!accessKeyId || !secretAccessKey) {
  console.log(chalk.red('\n❌ AWS credentials not set'));
  process.exit(1);
}

// Comprehensive list of all possible Claude model IDs
const modelsToTest = [
  // Claude 3.5 Sonnet v2 (latest, Oct 2024)
  'anthropic.claude-3-5-sonnet-20241022-v2:0',
  'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
  
  // Claude 3.5 Sonnet v1 (June 2024)
  'anthropic.claude-3-5-sonnet-20240620-v1:0',
  'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
  
  // Claude Sonnet 4 (newest, if available)
  'anthropic.claude-sonnet-4-20250514-v1:0',
  'us.anthropic.claude-sonnet-4-20250514-v1:0',
  'anthropic.claude-4-sonnet-20250514-v1:0',
  'us.anthropic.claude-4-sonnet-20250514-v1:0',
  
  // Claude 3 Opus (most powerful)
  'anthropic.claude-3-opus-20240229-v1:0',
  'us.anthropic.claude-3-opus-20240229-v1:0',
  
  // Claude 3 Sonnet (Feb 2024)
  'anthropic.claude-3-sonnet-20240229-v1:0',
  'us.anthropic.claude-3-sonnet-20240229-v1:0',
  
  // Claude 3 Haiku (fastest)
  'anthropic.claude-3-haiku-20240307-v1:0',
  'us.anthropic.claude-3-haiku-20240307-v1:0',
  
  // EU-specific model IDs (if they exist)
  'eu.anthropic.claude-3-5-sonnet-20241022-v2:0',
  'eu.anthropic.claude-3-5-sonnet-20240620-v1:0',
  'eu.anthropic.claude-3-sonnet-20240229-v1:0',
];

console.log(chalk.blue('🔍 Testing models (this may take a minute)...\n'));

const client = new BedrockRuntimeClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
});

const workingModels = [];

for (const modelId of modelsToTest) {
  try {
    process.stdout.write(chalk.gray(`Testing: ${modelId}... `));
    
    const command = new ConverseCommand({
      modelId,
      messages: [
        {
          role: 'user',
          content: [{ text: 'Respond with just the word "OK"' }]
        }
      ],
      inferenceConfig: {
        maxTokens: 10,
        temperature: 1.0
      }
    });

    const response = await client.send(command);
    
    if (response.output?.message) {
      console.log(chalk.green('✅ WORKS!'));
      workingModels.push(modelId);
    }
  } catch (error) {
    if (error.name === 'ValidationException' || error.message?.includes('model identifier')) {
      console.log(chalk.yellow('⚠️  Not available'));
    } else if (error.message?.includes('not enabled') || error.message?.includes('access')) {
      console.log(chalk.yellow('⚠️  Not enabled'));
    } else if (error.message?.includes('security token') || error.message?.includes('credentials')) {
      console.log(chalk.red('❌ Auth error'));
      break;
    } else {
      console.log(chalk.yellow(`⚠️  ${error.name}`));
    }
  }
}

console.log(chalk.gray('\n' + '─'.repeat(60)));

if (workingModels.length > 0) {
  console.log(chalk.green.bold(`\n✅ Found ${workingModels.length} working model(s):\n`));
  
  workingModels.forEach((model, idx) => {
    let label = '';
    if (model.includes('3-5-sonnet-20241022')) label = chalk.cyan('(Claude 3.5 Sonnet v2 - Latest!)');
    else if (model.includes('3-5-sonnet-20240620')) label = chalk.cyan('(Claude 3.5 Sonnet v1)');
    else if (model.includes('claude-4') || model.includes('sonnet-4')) label = chalk.cyan('(Claude 4 Sonnet!)');
    else if (model.includes('3-opus')) label = chalk.cyan('(Claude 3 Opus - Most powerful)');
    else if (model.includes('3-sonnet')) label = chalk.cyan('(Claude 3 Sonnet)');
    else if (model.includes('3-haiku')) label = chalk.cyan('(Claude 3 Haiku - Fastest)');
    
    console.log(chalk.white(`  ${idx + 1}. ${model}`));
    if (label) console.log(`     ${label}`);
  });
  
  console.log(chalk.blue('\n📝 To use the best model with Shannon:'));
  console.log(chalk.gray(`   -e BEDROCK_MODEL_ID="${workingModels[0]}"`));
  console.log(chalk.green('\n🎉 Your Bedrock setup is working!\n'));
  process.exit(0);
} else {
  console.log(chalk.red.bold('\n❌ No working models found'));
  console.log(chalk.yellow('\n💡 Please enable Claude models in AWS Bedrock console\n'));
  process.exit(1);
}

