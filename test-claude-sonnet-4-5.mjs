#!/usr/bin/env node
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import chalk from 'chalk';

console.log(chalk.cyan.bold('\n🔍 Testing Claude Sonnet 4.5 Model IDs\n'));

const region = process.env.AWS_REGION || 'us-east-1';
const client = new BedrockRuntimeClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Claude Sonnet 4.5 possible model IDs
const models = [
  'anthropic.claude-sonnet-4-5-v1:0',
  'anthropic.claude-sonnet-4-5-20250929-v1:0',
  'us.anthropic.claude-sonnet-4-5-v1:0',
  'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
  'eu.anthropic.claude-sonnet-4-5-v1:0',
  'eu.anthropic.claude-sonnet-4-5-20250929-v1:0',
  'anthropic.claude-sonnet-4.5-v1:0',
  'eu.anthropic.claude-sonnet-4.5-v1:0',
];

console.log(`Testing in region: ${region}\n`);

for (const modelId of models) {
  try {
    process.stdout.write(chalk.gray(`${modelId}... `));
    await client.send(new ConverseCommand({
      modelId,
      messages: [{ role: 'user', content: [{ text: 'Hi' }] }],
      inferenceConfig: { maxTokens: 5 }
    }));
    console.log(chalk.green('✅ WORKS!'));
  } catch (e) {
    console.log(chalk.red('❌'));
  }
}
