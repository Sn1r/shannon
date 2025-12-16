# AWS Bedrock API Key Authentication Guide

## ✅ You Were Right!

AWS Bedrock now supports simple API key authentication (introduced July 2025), making it as easy to use as the Anthropic API!

## 🔑 Quick Start with Bedrock API Key

### Step 1: Generate Your Bedrock API Key

1. **Go to AWS Console**: https://console.aws.amazon.com
2. **Navigate to IAM**: Services → IAM → Users
3. **Select Your User**: Click on your IAM username
4. **Go to Security Credentials**: Click the "Security credentials" tab
5. **Generate API Key**:
   - Scroll to "API keys for Amazon Bedrock" section
   - Click "Generate API Key"
   - Set expiration (or choose "Never expires" for development)
   - Click "Generate API key"
6. **Save the Key**: Copy it immediately (you won't see it again!)

### Step 2: Enable Claude Models in Bedrock

1. **Go to Bedrock Console**: AWS Console → Bedrock
2. **Click "Model access"** in the left sidebar
3. **Request Access**: Enable Claude models
4. **Wait for Approval**: Usually instant for standard accounts

### Step 3: Use Shannon with Bedrock

```bash
# Set your Bedrock API key
export BEDROCK_API_KEY="your-api-key-here"
export AWS_REGION="us-east-1"  # Optional

# Run Shannon
./shannon.mjs "https://your-app.com/" "/path/to/repo"
```

That's it! No more AWS Access Keys or Secret Keys needed! 🎉

## 📊 Comparison: Authentication Methods

### NEW Way (Recommended) ✨

```bash
# Just one simple API key!
export BEDROCK_API_KEY="abcd1234..."
export AWS_REGION="us-east-1"
```

**Benefits:**
- ✅ Simple - just like Anthropic API
- ✅ Secure - Bedrock-only permissions
- ✅ Easy to rotate
- ✅ No IAM policy configuration needed

### Old Way (Still Supported)

```bash
# Traditional AWS credentials
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="wJalr..."
export AWS_REGION="us-east-1"
```

**When to use:**
- You already have AWS credentials configured
- You need programmatic access to other AWS services
- You're using IAM roles (EC2, Lambda, etc.)

## 🔐 API Key Types

### Short-term API Keys
- **Validity**: Up to 12 hours or console session duration
- **Use case**: Quick testing, temporary access
- **Permissions**: Inherits your IAM principal permissions

### Long-term API Keys
- **Validity**: Custom duration (you set the expiration)
- **Use case**: Development, CI/CD pipelines
- **Permissions**: Bedrock-only, limited scope
- **Recommended for Shannon**: This is what you want!

## 📝 Example Configurations

### For Local Development

```bash
# .env file or export in terminal
export BEDROCK_API_KEY="your-key-here"
export AWS_REGION="us-east-1"

# Run Shannon
./shannon.mjs "https://app.com" "/path/to/repo"
```

### For Docker

```bash
docker run --rm -it \
  --network host \
  -e BEDROCK_API_KEY="your-key-here" \
  -e AWS_REGION="us-east-1" \
  -v "$(pwd)/repos:/app/repos" \
  shannon:latest \
  "https://app.com" "/app/repos/app"
```

### For CI/CD

```yaml
# GitHub Actions example
env:
  BEDROCK_API_KEY: ${{ secrets.BEDROCK_API_KEY }}
  AWS_REGION: us-east-1
```

## 🆚 Bedrock API Key vs Traditional Credentials

| Feature | Bedrock API Key | AWS Access Keys |
|---------|-----------------|-----------------|
| **Simplicity** | ⭐⭐⭐⭐⭐ One key | ⭐⭐⭐ Two keys + region |
| **Setup Time** | 2 minutes | 5-10 minutes |
| **IAM Policy** | Not needed | Required |
| **Scope** | Bedrock only | All AWS services |
| **Security** | Limited scope | Broader access |
| **Rotation** | Easy | More complex |
| **Expiration** | Configurable | No expiration |

## 🚨 Security Best Practices

### Do's ✅
- ✅ Set expiration dates for API keys
- ✅ Rotate keys regularly
- ✅ Use environment variables (never hardcode)
- ✅ Use different keys for dev/staging/prod
- ✅ Store keys in secrets managers (AWS Secrets Manager, etc.)

### Don'ts ❌
- ❌ Don't commit keys to version control
- ❌ Don't share keys between team members
- ❌ Don't use "Never expires" in production
- ❌ Don't give keys broader permissions than needed

## 🔄 Migration from Old to New Method

### If You're Currently Using AWS Access Keys

**Old way:**
```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="wJalr..."
export AWS_REGION="us-east-1"
```

**New way (just replace with):**
```bash
export BEDROCK_API_KEY="your-new-key"
export AWS_REGION="us-east-1"
```

Shannon automatically detects which method you're using!

## 📚 Documentation References

- **AWS Announcement**: [Amazon Bedrock API Keys](https://aws.amazon.com/about-aws/whats-new/2025/07/amazon-bedrock-api-keys-for-streamlined-development)
- **AWS Docs**: [IAM User Guide - Bedrock API Keys](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_bedrock.html)
- **Shannon Bedrock Guide**: [BEDROCK-INTEGRATION.md](./BEDROCK-INTEGRATION.md)

## 🆘 Troubleshooting

### "API key not found"
- Check that you copied the full key (they're long!)
- Verify the key hasn't expired
- Check the `AWS_REGION` matches where you enabled Bedrock

### "Access denied"
- Ensure Claude models are enabled in Bedrock console
- Check that the IAM user has Bedrock permissions
- Verify you're using the correct AWS region

### "Invalid credentials"
- API key might be malformed or incomplete
- Try regenerating the key
- Make sure there are no extra spaces in the environment variable

## 💡 Pro Tips

1. **Use AWS Secrets Manager**: Store your API key securely
   ```bash
   export BEDROCK_API_KEY=$(aws secretsmanager get-secret-value --secret-id shannon-bedrock-key --query SecretString --output text)
   ```

2. **Test Your Setup**: Run the test script
   ```bash
   node test-bedrock-integration.mjs
   ```

3. **Set Expiration Reminders**: Calendar reminder before key expires

4. **Use Short Keys for Testing**: For quick tests, use short-term keys

5. **Document Your Keys**: Keep track of which keys are used where

## ✅ Verification Checklist

Before running Shannon with Bedrock:

- [ ] Generated Bedrock API key from IAM console
- [ ] Enabled Claude models in Bedrock (Model Access)
- [ ] Set `BEDROCK_API_KEY` environment variable
- [ ] Set `AWS_REGION` (optional, defaults to us-east-1)
- [ ] Tested with `node test-bedrock-integration.mjs`
- [ ] Verified Shannon detects Bedrock provider

## 🎉 Summary

**The new Bedrock API key method makes authentication as simple as using the Anthropic API!**

```bash
# That's all you need!
export BEDROCK_API_KEY="your-key"
./shannon.mjs "https://app.com" "/path/to/repo"
```

No more juggling AWS Access Keys, Secret Keys, IAM policies, or complicated setup. Just generate a Bedrock API key and you're ready to go! 🚀

---

*Updated: December 2025 - Reflects AWS Bedrock API Keys (July 2025 release)*

