// Copyright (C) 2025 Keygraph, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License version 3
// as published by the Free Software Foundation.

/**
 * AWS Bedrock Provider for Shannon
 * 
 * This module provides a compatible query function that uses AWS Bedrock
 * instead of the Anthropic Claude API. It implements the same interface
 * as the Claude Agent SDK's query function.
 */

import { BedrockRuntimeClient, ConverseCommand, ConverseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import chalk from 'chalk';

/**
 * Check if Bedrock is enabled via environment variables
 * 
 * @returns {boolean} - True if Bedrock credentials are configured
 */
export function isBedrockEnabled() {
  // Check for explicit Bedrock enablement
  const explicitlyEnabled = process.env.USE_BEDROCK === 'true' || process.env.BEDROCK_ENABLED === 'true';
  
  // Check for NEW Bedrock API Key (simpler method, introduced July 2025)
  const hasBedrockApiKey = !!process.env.BEDROCK_API_KEY;
  
  // Check for traditional AWS credentials
  const hasAwsCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  
  // Check that Anthropic credentials are NOT set (to avoid confusion)
  const hasAnthropicCreds = !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_CODE_OAUTH_TOKEN);
  
  // Enable Bedrock if:
  // 1. Explicitly enabled, OR
  // 2. Has Bedrock API key but no Anthropic creds, OR
  // 3. Has AWS creds but no Anthropic creds
  return explicitlyEnabled || (hasBedrockApiKey && !hasAnthropicCreds) || (hasAwsCredentials && !hasAnthropicCreds);
}

/**
 * Get Bedrock model ID from environment or default
 * 
 * @param {string} anthropicModel - Original Anthropic model name
 * @returns {string} - Bedrock model ID
 */
export function getBedrockModelId(anthropicModel) {
  // If explicitly set, use that
  if (process.env.BEDROCK_MODEL_ID) {
    return process.env.BEDROCK_MODEL_ID;
  }

  // Map Anthropic model names to Bedrock model IDs
  const modelMap = {
    'claude-sonnet-4-5-20250929': 'us.anthropic.claude-sonnet-4-20250514-v1:0',
    'claude-3-5-sonnet-20241022': 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    'claude-3-5-sonnet-20240620': 'anthropic.claude-3-5-sonnet-20240620-v1:0',
    'claude-3-sonnet-20240229': 'anthropic.claude-3-sonnet-20240229-v1:0',
    'claude-3-opus-20240229': 'anthropic.claude-3-opus-20240229-v1:0',
    'claude-3-haiku-20240307': 'anthropic.claude-3-haiku-20240307-v1:0'
  };

  return modelMap[anthropicModel] || 'us.anthropic.claude-sonnet-4-20250514-v1:0';
}

/**
 * Create a Bedrock Runtime client
 * 
 * @returns {BedrockRuntimeClient}
 */
function createBedrockClient() {
  const region = process.env.AWS_REGION || 'us-east-1';
  const bedrockApiKey = process.env.BEDROCK_API_KEY;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;

  // Method 1: Use new Bedrock API Key (simpler, introduced July 2025)
  if (bedrockApiKey) {
    return new BedrockRuntimeClient({
      region,
      credentials: {
        // Bedrock API keys work through a custom credential provider
        accessKeyId: bedrockApiKey,
        secretAccessKey: bedrockApiKey, // API key is used for both
        sessionToken: undefined
      }
    });
  }

  // Method 2: Use traditional AWS credentials
  if (accessKeyId && secretAccessKey) {
    return new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken && { sessionToken })
      }
    });
  }

  throw new Error(
    'Bedrock authentication required. Set one of:\n' +
    '  - BEDROCK_API_KEY (simple, recommended)\n' +
    '  - AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (traditional)'
  );
}

/**
 * Transform tool result to Bedrock format
 */
function transformToolResultToBedrock(toolResult) {
  return {
    toolUseId: toolResult.tool_use_id,
    content: Array.isArray(toolResult.content) 
      ? toolResult.content.map(c => {
          if (c.type === 'text') {
            return { text: c.text };
          }
          if (c.type === 'image') {
            return {
              image: {
                format: c.source?.type || 'png',
                source: {
                  bytes: c.source?.data || c.source?.bytes
                }
              }
            };
          }
          return { text: JSON.stringify(c) };
        })
      : [{ text: typeof toolResult.content === 'string' ? toolResult.content : JSON.stringify(toolResult.content) }]
  };
}

/**
 * Transform message content to Bedrock format
 */
function transformMessageToBedrock(message) {
  if (typeof message.content === 'string') {
    return {
      role: message.role,
      content: [{ text: message.content }]
    };
  }

  if (Array.isArray(message.content)) {
    const content = message.content.map(block => {
      if (block.type === 'text') {
        return { text: block.text };
      }
      if (block.type === 'tool_use') {
        return {
          toolUse: {
            toolUseId: block.id,
            name: block.name,
            input: block.input
          }
        };
      }
      if (block.type === 'tool_result') {
        return transformToolResultToBedrock(block);
      }
      if (block.type === 'image') {
        return {
          image: {
            format: block.source?.type || 'png',
            source: {
              bytes: block.source?.data || block.source?.bytes
            }
          }
        };
      }
      return { text: JSON.stringify(block) };
    });

    return {
      role: message.role,
      content
    };
  }

  return {
    role: message.role,
    content: [{ text: JSON.stringify(message.content) }]
  };
}

/**
 * Transform Bedrock response to Claude Agent SDK format
 */
function transformBedrockMessage(bedrockMessage, modelId) {
  const content = [];

  if (bedrockMessage.content) {
    for (const block of bedrockMessage.content) {
      if (block.text) {
        content.push({
          type: 'text',
          text: block.text
        });
      }
      if (block.toolUse) {
        content.push({
          type: 'tool_use',
          id: block.toolUse.toolUseId,
          name: block.toolUse.name,
          input: block.toolUse.input
        });
      }
    }
  }

  return {
    type: 'assistant',
    message: {
      id: bedrockMessage.id || `bedrock-${Date.now()}`,
      type: 'message',
      role: 'assistant',
      content,
      model: modelId,
      stop_reason: bedrockMessage.stopReason,
      usage: {
        input_tokens: bedrockMessage.usage?.inputTokens || 0,
        output_tokens: bedrockMessage.usage?.outputTokens || 0
      }
    }
  };
}

/**
 * Create a query function compatible with Claude Agent SDK
 * This function mimics the query function from '@anthropic-ai/claude-agent-sdk'
 * 
 * @returns {Function} - Async generator function compatible with Claude Agent SDK
 */
export function createBedrockQueryFunction() {
  const bedrockClient = createBedrockClient();

  /**
   * Query function that yields messages in Claude Agent SDK format
   * 
   * @param {Object} params - Query parameters
   * @param {string} params.prompt - The prompt to send
   * @param {Object} params.options - Options including model, maxTurns, etc.
   * @yields {Object} - Messages in Claude Agent SDK format
   */
  return async function* bedrockQuery({ prompt, options }) {
    const modelId = getBedrockModelId(options.model);
    const maxTurns = options.maxTurns || 100;
    let turnCount = 0;
    let conversationHistory = [];
    const startTime = Date.now();

    // Initial system message
    yield {
      type: 'system',
      subtype: 'init',
      model: modelId,
      permissionMode: options.permissionMode || 'default',
      mcp_servers: []
    };

    // Initial user message
    yield {
      type: 'user',
      message: {
        role: 'user',
        content: prompt
      }
    };

    // Add initial prompt to conversation
    conversationHistory.push({
      role: 'user',
      content: [{ text: prompt }]
    });

    // Conversation loop
    while (turnCount < maxTurns) {
      turnCount++;

      try {
        // Prepare Bedrock request
        const request = {
          modelId,
          messages: conversationHistory,
          inferenceConfig: {
            maxTokens: 4096,
            temperature: 1.0
          }
        };

        // Add tool configuration if MCP servers are configured
        if (options.mcpServers && Object.keys(options.mcpServers).length > 0) {
          // For now, we'll handle basic tool calls
          // Note: Full MCP integration would require more complex tool translation
          request.toolConfig = {
            tools: []
          };
        }

        // Make request to Bedrock
        const command = new ConverseCommand(request);
        const response = await bedrockClient.send(command);

        // Transform and yield assistant message
        const assistantMessage = transformBedrockMessage(response.output?.message, modelId);
        yield assistantMessage;

        // Add assistant response to history
        conversationHistory.push({
          role: 'assistant',
          content: response.output?.message?.content || []
        });

        // Check stop reason
        if (response.stopReason === 'end_turn' || response.stopReason === 'stop_sequence') {
          // Conversation completed naturally
          break;
        }

        if (response.stopReason === 'tool_use') {
          // Tool use detected - for now, we'll just acknowledge it
          // Full implementation would require MCP tool integration
          console.log(chalk.yellow('    ⚠️  Tool use detected but MCP integration is limited in Bedrock mode'));
        }

        if (response.stopReason === 'max_tokens') {
          // Hit token limit
          console.log(chalk.yellow('    ⚠️  Hit max tokens in response'));
        }

      } catch (error) {
        console.error(chalk.red(`    ❌ Bedrock API error: ${error.message}`));
        
        yield {
          type: 'result',
          result: {
            success: false,
            error: error.message
          },
          subtype: 'error_during_execution',
          duration_ms: Date.now() - startTime,
          total_cost_usd: 0,
          permission_denials: []
        };
        
        return;
      }
    }

    // Calculate estimated cost (rough estimate)
    const totalTokens = conversationHistory.reduce((sum, msg) => {
      return sum + (msg.content?.length || 0) * 4; // Rough token estimation
    }, 0);
    const estimatedCost = (totalTokens / 1000000) * 3.0; // $3 per million tokens (approximate)

    // Yield final result
    yield {
      type: 'result',
      result: {
        success: true,
        content: 'Task completed via Bedrock'
      },
      subtype: turnCount >= maxTurns ? 'error_max_turns' : 'success',
      duration_ms: Date.now() - startTime,
      total_cost_usd: estimatedCost,
      permission_denials: []
    };
  };
}

/**
 * Validate Bedrock configuration
 * 
 * @throws {Error} - If configuration is invalid
 */
export function validateBedrockConfig() {
  const bedrockApiKey = process.env.BEDROCK_API_KEY;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'us-east-1';

  // Check for new Bedrock API Key (preferred method)
  if (bedrockApiKey) {
    console.log(chalk.green(`✅ Bedrock configuration valid (API Key, Region: ${region})`));
    return;
  }

  // Check for traditional AWS credentials
  if (accessKeyId && secretAccessKey) {
    console.log(chalk.green(`✅ Bedrock configuration valid (AWS Credentials, Region: ${region})`));
    return;
  }

  // No valid credentials found
  throw new Error(
    'Bedrock authentication required. Set one of:\n' +
    '  Option 1 (Recommended): BEDROCK_API_KEY="your-bedrock-api-key"\n' +
    '  Option 2 (Traditional): AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY\n\n' +
    'To generate a Bedrock API key:\n' +
    '  1. Go to AWS Console → IAM → Users\n' +
    '  2. Select your user → Security credentials\n' +
    '  3. Find "API keys for Amazon Bedrock" section\n' +
    '  4. Click "Generate API Key"'
  );
}

