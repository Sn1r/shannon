#!/usr/bin/env node
import { createBedrockQueryFunction } from './src/ai/bedrock-provider.js';
import chalk from 'chalk';

console.log(chalk.cyan.bold('\n🧪 Testing Bedrock Query Function\n'));

const queryFunc = createBedrockQueryFunction();

const testQuery = queryFunc({
  prompt: 'Say "Hello from Bedrock!" and nothing else.',
  options: {
    model: 'claude-sonnet-4-5-20250929',
    maxTurns: 1,
    permissionMode: 'bypassPermissions'
  }
});

console.log(chalk.blue('Sending test query...\n'));

try {
  for await (const message of testQuery) {
    if (message.type === 'assistant') {
      console.log(chalk.green('✅ Got response from Bedrock!'));
      const content = message.message.content;
      if (content && content.length > 0) {
        console.log(chalk.cyan('\nResponse:'), content[0].text);
      }
    } else if (message.type === 'result') {
      if (message.result.success) {
        console.log(chalk.green('\n✅ Query completed successfully!'));
        console.log(chalk.gray(`Duration: ${message.duration_ms}ms`));
      } else {
        console.log(chalk.red('\n❌ Query failed:'), message.result.error);
      }
    }
  }
} catch (error) {
  console.log(chalk.red('\n❌ Error:'), error.message);
  console.log(chalk.gray(error.stack));
  process.exit(1);
}

console.log(chalk.green('\n🎉 Bedrock integration is working!\n'));
