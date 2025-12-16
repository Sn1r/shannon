#!/usr/bin/env node
// Simple Bedrock connectivity test

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import chalk from 'chalk';

console.log(chalk.cyan.bold('\n🧪 AWS Bedrock Simple Connectivity Test\n'));
console.log(chalk.gray('─'.repeat(60)));

const region = process.env.AWS_REGION || 'us-east-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

console.log(chalk.blue('\n📋 Configuration:'));
console.log(`  Region: ${chalk.green(region)}`);
console.log(`  Access Key: ${accessKeyId ? chalk.green('***' + accessKeyId.slice(-4)) : chalk.red('Not set')}`);
console.log(`  Secret Key: ${secretAccessKey ? chalk.green('Set (hidden)') : chalk.red('Not set')}`);

if (!accessKeyId || !secretAccessKey) {
  console.log(chalk.red('\n❌ AWS credentials not set'));
  process.exit(1);
}

// Test different model IDs
const modelsToTest = [
  'anthropic.claude-3-5-sonnet-20241022-v2:0',
  'anthropic.claude-3-5-sonnet-20240620-v1:0',
  'anthropic.claude-3-sonnet-20240229-v1:0',
  'anthropic.claude-3-haiku-20240307-v1:0'
];

console.log(chalk.blue('\n🔍 Testing available models...\n'));

const client = new BedrockRuntimeClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
});

let workingModel = null;

for (const modelId of modelsToTest) {
  try {
    console.log(chalk.gray(`Testing: ${modelId}...`));
    
    const command = new ConverseCommand({
      modelId,
      messages: [
        {
          role: 'user',
          content: [{ text: 'Say "test" if you can read this.' }]
        }
      ],
      inferenceConfig: {
        maxTokens: 10,
        temperature: 1.0
      }
    });

    const response = await client.send(command);
    
    if (response.output?.message) {
      console.log(chalk.green(`  ✅ ${modelId} - WORKS!`));
      if (!workingModel) {
        workingModel = modelId;
      }
    }
  } catch (error) {
    if (error.name === 'ValidationException' || error.message?.includes('model identifier')) {
      console.log(chalk.yellow(`  ⚠️  ${modelId} - Not available in ${region}`));
    } else if (error.message?.includes('not enabled')) {
      console.log(chalk.yellow(`  ⚠️  ${modelId} - Not enabled (enable in Bedrock console)`));
    } else if (error.message?.includes('security token') || error.message?.includes('credentials')) {
      console.log(chalk.red(`  ❌ ${modelId} - Authentication error`));
      console.log(chalk.red(`     ${error.message}`));
      break;
    } else {
      console.log(chalk.yellow(`  ⚠️  ${modelId} - ${error.message}`));
    }
  }
}

console.log(chalk.gray('\n' + '─'.repeat(60)));

if (workingModel) {
  console.log(chalk.green.bold('\n✅ Success! Found working model:'));
  console.log(chalk.cyan(`   ${workingModel}`));
  console.log(chalk.blue('\n📝 To use this model with Shannon:'));
  console.log(chalk.gray(`   -e BEDROCK_MODEL_ID="${workingModel}"`));
  console.log(chalk.green('\n🎉 Your Bedrock setup is working!'));
  process.exit(0);
} else {
  console.log(chalk.red.bold('\n❌ No working models found'));
  console.log(chalk.yellow('\n💡 Possible solutions:'));
  console.log(chalk.gray('   1. Enable Claude models in AWS Bedrock console'));
  console.log(chalk.gray('   2. Check you\'re using the correct AWS region'));
  console.log(chalk.gray('   3. Verify your AWS credentials have Bedrock permissions'));
  console.log(chalk.blue('\n📖 Instructions:'));
  console.log(chalk.gray('   1. Go to: https://console.aws.amazon.com/bedrock'));
  console.log(chalk.gray('   2. Click "Model access" in left sidebar'));
  console.log(chalk.gray('   3. Click "Request model access"'));
  console.log(chalk.gray('   4. Enable Anthropic Claude models'));
  process.exit(1);
}

