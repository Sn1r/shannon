# AWS Bedrock Integration Guide

Shannon now supports AWS Bedrock as an alternative AI provider to direct Anthropic Claude API access. This integration allows you to use Claude models through AWS infrastructure.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Usage](#usage)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Cost Considerations](#cost-considerations)

## Overview

AWS Bedrock integration provides:

- **Enterprise Infrastructure**: Use Claude models through AWS infrastructure
- **Regional Availability**: Access Claude in regions where direct API access may be limited
- **AWS Integration**: Leverage existing AWS accounts, credits, and enterprise agreements
- **Compliance**: Meet organizational requirements for AI service usage

## Prerequisites

### 1. AWS Account Setup

1. Active AWS account with Bedrock access
2. Bedrock service enabled in your region
3. Claude models enabled in AWS Console:
   - Navigate to **AWS Console → Bedrock → Model Access**
   - Request access to Claude models (if not already enabled)
   - Wait for approval (usually instant for standard accounts)

### 2. AWS Credentials

You need one of the following:

**Option A: IAM User Access Keys** (Recommended for development)
- Access Key ID
- Secret Access Key

**Option B: Temporary Credentials**
- Access Key ID
- Secret Access Key
- Session Token

**Option C: AWS CLI Profile** (for local development)
- Configured AWS CLI with appropriate profile

### 3. Required IAM Permissions

Your AWS credentials must have the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-*",
        "arn:aws:bedrock:*::foundation-model/us.anthropic.claude-*"
      ]
    }
  ]
}
```

## Setup

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   ```bash
   export AWS_ACCESS_KEY_ID="your-access-key-id"
   export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
   export AWS_REGION="us-east-1"  # Optional, defaults to us-east-1
   ```

3. **Verify Configuration**
   ```bash
   node test-bedrock-integration.mjs
   ```

### Docker Deployment

When using Docker, pass AWS credentials as environment variables:

```bash
docker run --rm -it \
  --network host \
  --cap-add=NET_RAW \
  --cap-add=NET_ADMIN \
  -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  -e AWS_REGION="us-east-1" \
  -v "$(pwd)/repos:/app/repos" \
  -v "$(pwd)/configs:/app/configs" \
  shannon:latest \
  "https://your-app.com/" \
  "/app/repos/your-app" \
  --config /app/configs/example-config.yaml
```

## Usage

### Basic Usage

Shannon automatically detects and uses Bedrock when:
- AWS credentials are configured (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY)
- Anthropic credentials are NOT set (ANTHROPIC_API_KEY or CLAUDE_CODE_OAUTH_TOKEN)

```bash
# Set AWS credentials
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_REGION="us-east-1"

# Ensure Anthropic credentials are not set
unset ANTHROPIC_API_KEY
unset CLAUDE_CODE_OAUTH_TOKEN

# Run Shannon normally
./shannon.mjs "https://your-app.com/" "/path/to/repo"
```

### Explicit Bedrock Enablement

To explicitly enable Bedrock (even if Anthropic credentials exist):

```bash
export USE_BEDROCK="true"
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"

./shannon.mjs "https://your-app.com/" "/path/to/repo"
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AWS_ACCESS_KEY_ID` | Yes | - | AWS access key ID |
| `AWS_SECRET_ACCESS_KEY` | Yes | - | AWS secret access key |
| `AWS_REGION` | No | `us-east-1` | AWS region for Bedrock |
| `AWS_SESSION_TOKEN` | No | - | Session token for temporary credentials |
| `BEDROCK_MODEL_ID` | No | `us.anthropic.claude-sonnet-4-20250514-v1:0` | Specific Bedrock model to use |
| `USE_BEDROCK` | No | `false` | Explicitly enable Bedrock |

### Available Models

Bedrock supports the following Claude models:

| Anthropic Model | Bedrock Model ID |
|-----------------|------------------|
| Claude Sonnet 4.5 (latest) | `us.anthropic.claude-sonnet-4-20250514-v1:0` |
| Claude 3.5 Sonnet (Oct 2024) | `us.anthropic.claude-3-5-sonnet-20241022-v2:0` |
| Claude 3.5 Sonnet (Jun 2024) | `anthropic.claude-3-5-sonnet-20240620-v1:0` |
| Claude 3 Sonnet | `anthropic.claude-3-sonnet-20240229-v1:0` |
| Claude 3 Opus | `anthropic.claude-3-opus-20240229-v1:0` |
| Claude 3 Haiku | `anthropic.claude-3-haiku-20240307-v1:0` |

To use a specific model:

```bash
export BEDROCK_MODEL_ID="anthropic.claude-3-opus-20240229-v1:0"
```

### Supported AWS Regions

Bedrock with Claude models is available in:

- `us-east-1` (US East - N. Virginia) ✅ Recommended
- `us-west-2` (US West - Oregon)
- `ap-southeast-1` (Asia Pacific - Singapore)
- `ap-northeast-1` (Asia Pacific - Tokyo)
- `eu-central-1` (Europe - Frankfurt)
- `eu-west-1` (Europe - Ireland)
- `eu-west-2` (Europe - London)

Check [AWS Bedrock documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html) for the latest availability.

## Troubleshooting

### Common Issues

#### 1. "AWS credentials are required" Error

**Cause**: AWS credentials not set or not accessible

**Solution**:
```bash
# Verify credentials are set
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY

# If not set, configure them
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
```

#### 2. "Access Denied" or "Permission Denied" Error

**Cause**: IAM user lacks Bedrock permissions

**Solution**: Ensure your IAM user has the required permissions (see Prerequisites section)

#### 3. "Model not found" Error

**Cause**: Claude models not enabled in Bedrock

**Solution**:
1. Go to AWS Console → Bedrock → Model Access
2. Enable Claude models
3. Wait for approval (usually instant)

#### 4. Bedrock Not Being Used

**Cause**: Anthropic credentials still set

**Solution**:
```bash
# Check current environment
node test-bedrock-integration.mjs

# Remove Anthropic credentials
unset ANTHROPIC_API_KEY
unset CLAUDE_CODE_OAUTH_TOKEN
```

### Testing Bedrock Configuration

Run the included test script to verify your setup:

```bash
node test-bedrock-integration.mjs
```

This will check:
- ✅ Environment detection
- ✅ Configuration validation
- ✅ Credentials verification
- ✅ Module imports
- ✅ Integration with main executor

### Debug Mode

For detailed logging during execution:

```bash
export DEBUG=1
./shannon.mjs "https://your-app.com/" "/path/to/repo"
```

## Cost Considerations

### Pricing Comparison

**AWS Bedrock** (On-Demand):
- Input: $3.00 per million tokens
- Output: $15.00 per million tokens

**Direct Anthropic API**:
- Input: $3.00 per million tokens
- Output: $15.00 per million tokens

*Note: Prices may vary by region and model. Check current pricing:*
- [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
- [Anthropic API Pricing](https://www.anthropic.com/pricing)

### Cost Optimization

1. **Choose the Right Model**: Smaller models (Haiku) for simpler tasks
2. **Use Appropriate Regions**: Pricing may vary by AWS region
3. **Monitor Usage**: Use AWS Cost Explorer to track Bedrock usage
4. **Set Budgets**: Configure AWS Budgets alerts for cost control

### Estimated Shannon Run Cost

A typical Shannon pentest run:
- **Duration**: 1-1.5 hours
- **Estimated Cost**: $30-$50 USD
- **Token Usage**: ~10-15 million tokens

## Known Limitations

### Current Bedrock Integration Limitations

1. **MCP Tool Integration**: Limited support for MCP (Model Context Protocol) tools in Bedrock mode
   - Browser automation works via Playwright
   - Some advanced tool interactions may have reduced functionality

2. **Streaming Responses**: Bedrock streaming implementation is functional but may have minor differences from direct API

3. **Cost Tracking**: Cost estimation is approximate; for exact costs, check AWS billing

### Future Enhancements

- Full MCP tool protocol support in Bedrock mode
- Enhanced streaming response handling
- Real-time cost tracking via AWS Cost Explorer API
- Support for Bedrock provisioned throughput

## Support

For issues or questions:

1. Check [Shannon GitHub Issues](https://github.com/keygraph/shannon/issues)
2. Join [Shannon Discord](https://discord.gg/u7DRRXrs7H)
3. Email: [shannon@keygraph.io](mailto:shannon@keygraph.io)

For AWS Bedrock-specific issues:
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS Support](https://aws.amazon.com/support/)

## License

This Bedrock integration is part of Shannon Lite and released under the same [AGPL-3.0 License](LICENSE).

