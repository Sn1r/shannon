// Copyright (C) 2025 Keygraph, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License version 3
// as published by the Free Software Foundation.

/**
 * AWS Bedrock Claude Client Wrapper
 * 
 * This module provides a compatible interface to use AWS Bedrock's Claude models
 * as an alternative to direct Anthropic API calls. It wraps the AWS Bedrock Runtime
 * client to work seamlessly with Shannon's existing Claude Agent SDK integration.
 */

import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Create an Anthropic SDK client that uses AWS Bedrock as the backend
 * 
 * @param {Object} config - Configuration options
 * @param {string} config.region - AWS region (e.g., 'us-east-1', 'us-west-2')
 * @param {string} config.accessKeyId - AWS Access Key ID
 * @param {string} config.secretAccessKey - AWS Secret Access Key
 * @param {string} config.sessionToken - AWS Session Token (optional, for temporary credentials)
 * @param {string} config.modelId - Bedrock model ID (default: 'anthropic.claude-3-5-sonnet-20241022-v2:0')
 * @returns {Anthropic} - Anthropic client configured to use Bedrock
 */
export function createBedrockAnthropicClient(config = {}) {
  const {
    region = process.env.AWS_REGION || 'us-east-1',
    accessKeyId = process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken = process.env.AWS_SESSION_TOKEN,
    modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0'
  } = config;

  // Validate required credentials
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials are required. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
  }

  // Create Bedrock Runtime client
  const bedrockClient = new BedrockRuntimeClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
      ...(sessionToken && { sessionToken })
    }
  });

  // Create an Anthropic client with a custom fetch implementation
  // that routes requests through AWS Bedrock
  const anthropicClient = new Anthropic({
    apiKey: 'bedrock-placeholder', // Not used, but required by SDK
    // Override the base URL to use a custom handler
    baseURL: 'https://bedrock-proxy.local',
    // Custom fetch implementation that routes to Bedrock
    fetch: async (url, init) => {
      return bedrockFetch(bedrockClient, modelId, url, init);
    }
  });

  return anthropicClient;
}

/**
 * Custom fetch implementation that translates Anthropic API calls to Bedrock API calls
 * 
 * @param {BedrockRuntimeClient} bedrockClient - AWS Bedrock client
 * @param {string} modelId - Bedrock model ID
 * @param {string} url - Request URL
 * @param {Object} init - Fetch init options
 * @returns {Response} - Fetch Response object
 */
async function bedrockFetch(bedrockClient, modelId, url, init) {
  try {
    const requestBody = JSON.parse(init.body);
    
    // Check if this is a streaming request
    const isStreaming = requestBody.stream === true;

    // Transform Anthropic request format to Bedrock format
    const bedrockRequest = {
      anthropic_version: requestBody.anthropic_version || 'bedrock-2023-05-31',
      max_tokens: requestBody.max_tokens || 4096,
      messages: requestBody.messages,
      temperature: requestBody.temperature,
      top_p: requestBody.top_p,
      top_k: requestBody.top_k,
      stop_sequences: requestBody.stop_sequences,
      system: requestBody.system
    };

    // Remove undefined fields
    Object.keys(bedrockRequest).forEach(key => {
      if (bedrockRequest[key] === undefined) {
        delete bedrockRequest[key];
      }
    });

    if (isStreaming) {
      // Handle streaming responses
      return handleStreamingResponse(bedrockClient, modelId, bedrockRequest);
    } else {
      // Handle non-streaming responses
      return handleNonStreamingResponse(bedrockClient, modelId, bedrockRequest);
    }
  } catch (error) {
    console.error('Bedrock fetch error:', error);
    
    // Return error response in Anthropic API format
    return new Response(JSON.stringify({
      type: 'error',
      error: {
        type: 'api_error',
        message: error.message
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle non-streaming Bedrock API responses
 */
async function handleNonStreamingResponse(bedrockClient, modelId, bedrockRequest) {
  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(bedrockRequest)
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  // Transform Bedrock response to Anthropic format
  const anthropicResponse = {
    id: responseBody.id || `bedrock-${Date.now()}`,
    type: 'message',
    role: 'assistant',
    content: responseBody.content,
    model: modelId,
    stop_reason: responseBody.stop_reason,
    stop_sequence: responseBody.stop_sequence,
    usage: {
      input_tokens: responseBody.usage?.input_tokens || 0,
      output_tokens: responseBody.usage?.output_tokens || 0
    }
  };

  return new Response(JSON.stringify(anthropicResponse), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Handle streaming Bedrock API responses
 */
async function handleStreamingResponse(bedrockClient, modelId, bedrockRequest) {
  const command = new InvokeModelWithResponseStreamCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(bedrockRequest)
  });

  const response = await bedrockClient.send(command);

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of response.body) {
          if (event.chunk) {
            const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
            
            // Transform Bedrock streaming chunks to Anthropic format
            if (chunk.type === 'message_start') {
              const anthropicChunk = {
                type: 'message_start',
                message: {
                  id: chunk.message?.id || `bedrock-${Date.now()}`,
                  type: 'message',
                  role: 'assistant',
                  content: [],
                  model: modelId,
                  usage: chunk.message?.usage || { input_tokens: 0, output_tokens: 0 }
                }
              };
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(anthropicChunk)}\n\n`));
            } else if (chunk.type === 'content_block_start') {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
            } else if (chunk.type === 'content_block_delta') {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
            } else if (chunk.type === 'content_block_stop') {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
            } else if (chunk.type === 'message_delta') {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
            } else if (chunk.type === 'message_stop') {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

/**
 * Get the appropriate Bedrock model ID based on the Anthropic model name
 * 
 * @param {string} anthropicModel - Anthropic model name (e.g., 'claude-sonnet-4-5-20250929')
 * @returns {string} - Corresponding Bedrock model ID
 */
export function getBedrockModelId(anthropicModel) {
  // Map of Anthropic model names to Bedrock model IDs
  const modelMap = {
    'claude-sonnet-4-5-20250929': 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    'claude-3-5-sonnet-20241022': 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    'claude-3-5-sonnet-20240620': 'anthropic.claude-3-5-sonnet-20240620-v1:0',
    'claude-3-sonnet-20240229': 'anthropic.claude-3-sonnet-20240229-v1:0',
    'claude-3-opus-20240229': 'anthropic.claude-3-opus-20240229-v1:0',
    'claude-3-haiku-20240307': 'anthropic.claude-3-haiku-20240307-v1:0',
    'claude-sonnet-3-5-20241022': 'anthropic.claude-3-5-sonnet-20241022-v2:0'
  };

  return modelMap[anthropicModel] || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
}

/**
 * Check if Bedrock configuration is available
 * 
 * @returns {boolean} - True if Bedrock credentials are configured
 */
export function isBedrockConfigured() {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

/**
 * Validate Bedrock configuration
 * 
 * @throws {Error} - If configuration is invalid
 */
export function validateBedrockConfig() {
  if (!process.env.AWS_ACCESS_KEY_ID) {
    throw new Error('AWS_ACCESS_KEY_ID environment variable is required for Bedrock integration');
  }
  
  if (!process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS_SECRET_ACCESS_KEY environment variable is required for Bedrock integration');
  }

  if (!process.env.AWS_REGION) {
    console.warn('AWS_REGION not set, defaulting to us-east-1');
  }
}

