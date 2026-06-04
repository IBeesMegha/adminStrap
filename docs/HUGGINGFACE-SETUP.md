# Hugging Face API Setup for Knowledge Base

## Why Hugging Face?

Hugging Face provides **free** access to state-of-the-art embedding models through their Inference API. These models are:

- ✅ **Free** - No credit card required
- ✅ **Fast** - Optimized inference servers
- ✅ **Accurate** - Best-in-class sentence transformers
- ✅ **Easy** - Simple REST API

## Step 1: Create a Hugging Face Account

1. Go to https://huggingface.co/join
2. Sign up with your email or GitHub account
3. Verify your email address

## Step 2: Generate an API Token

1. Go to https://huggingface.co/settings/tokens
2. Click **"New token"**
3. Give it a name (e.g., "CMS Knowledge Base")
4. Select **"Read"** access (sufficient for embeddings)
5. Click **"Generate"**
6. Copy your token (starts with `hf_...`)

## Step 3: Add Token to Your Project

Open your `.env` file and add:

```bash
HUGGINGFACE_API_KEY="hf_your_token_here"
```

## Step 4: Test the Connection

Restart your development server:

```bash
npm run dev
```

Then test by:
1. Go to http://localhost:3000/admin/knowledge-base
2. Add a knowledge source
3. Wait for processing to complete
4. Test search functionality

## Available Models

The system supports these Hugging Face models:

### 1. all-MiniLM-L6-v2 (Recommended - Default)
- **Dimensions:** 384
- **Speed:** Very Fast
- **Quality:** Good
- **Best for:** General purpose, fast searches
- **Model:** `sentence-transformers/all-MiniLM-L6-v2`

### 2. all-mpnet-base-v2 (High Quality)
- **Dimensions:** 768
- **Speed:** Fast
- **Quality:** Excellent
- **Best for:** High accuracy requirements
- **Model:** `sentence-transformers/all-mpnet-base-v2`

### 3. Multilingual MiniLM (Multi-language)
- **Dimensions:** 384
- **Speed:** Fast
- **Languages:** 50+ languages
- **Best for:** International content
- **Model:** `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`

## Changing Models

1. Go to **Settings** page: http://localhost:3000/admin/knowledge-base/settings
2. Select your preferred model from dropdown
3. Click **"Save Settings"**
4. **Reprocess existing pages** to use new model

## API Rate Limits

### Free Tier
- **Requests:** ~30,000 per month
- **Rate:** ~1 request per second
- **Cost:** Free forever

### Pro Tier ($9/month)
- **Requests:** Unlimited
- **Rate:** Higher throughput
- **Features:** Priority processing

For most use cases, the **free tier is sufficient**.

## Troubleshooting

### Error: "Model is loading"

**Cause:** Hugging Face models "cold start" if not used recently

**Solution:** Wait 10-20 seconds and try again. The system automatically retries.

### Error: "Invalid API token"

**Cause:** Token not configured or incorrect

**Solution:**
1. Check `.env` file has `HUGGINGFACE_API_KEY="hf_..."`
2. Verify token at https://huggingface.co/settings/tokens
3. Generate a new token if needed

### Error: "Rate limit exceeded"

**Cause:** Too many requests in short time

**Solution:**
1. Wait a few minutes
2. Process fewer pages at once
3. Consider upgrading to Pro tier

### Slow Processing

**Cause:** Free tier has rate limits

**Solution:**
1. Process in smaller batches (10-20 pages)
2. Add delays between requests (already implemented)
3. Upgrade to Pro tier for faster processing

## Best Practices

### 1. Start with Default Model

Use `all-MiniLM-L6-v2` unless you have specific needs:
- It's fast
- It's accurate for most use cases
- It uses less storage (384D vs 768D)

### 2. Test Before Large Processing

1. Add one test source
2. Process a few pages
3. Test search quality
4. Adjust settings if needed
5. Then process larger sources

### 3. Monitor Your Usage

Check your usage at: https://huggingface.co/settings/billing

### 4. Reprocess Strategically

Only reprocess when:
- Changing embedding models
- Chunk size/overlap significantly changed
- Content has been updated

## Security

### Protect Your API Key

- ✅ Never commit `.env` to git
- ✅ Add `.env` to `.gitignore`
- ✅ Use environment variables in production
- ✅ Regenerate if accidentally exposed

### Token Permissions

Use **"Read"** access only:
- Sufficient for inference
- More secure
- Can't modify your models

## Cost Comparison

| Provider | Free Tier | Quality | Speed |
|----------|-----------|---------|-------|
| **Hugging Face** | 30K/month | Excellent | Fast |
| OpenAI | $0.0001/1K tokens | Excellent | Very Fast |
| Cohere | 1K calls/month | Good | Fast |
| Google Vertex | Limited | Good | Fast |

**Recommendation:** Start with Hugging Face free tier, upgrade if needed.

## Frequently Asked Questions

### Q: Do I need a credit card?

**A:** No! The free tier requires no payment information.

### Q: Will my data be used for training?

**A:** No. Hugging Face Inference API doesn't use your data for training.

### Q: Can I self-host the models?

**A:** Yes! Download models from Hugging Face and run locally using `sentence-transformers` library. However, the API is easier and free.

### Q: Which model is best for my use case?

- **English only, speed matters:** `all-MiniLM-L6-v2`
- **English only, quality matters:** `all-mpnet-base-v2`
- **Multiple languages:** `paraphrase-multilingual-MiniLM-L12-v2`

### Q: How long does processing take?

- **all-MiniLM-L6-v2:** ~0.5-1 second per page
- **all-mpnet-base-v2:** ~1-2 seconds per page
- **Multilingual:** ~1-2 seconds per page

Times include chunking, embedding, and database storage.

## Additional Resources

- **Hugging Face Docs:** https://huggingface.co/docs/api-inference
- **Model Cards:** https://huggingface.co/sentence-transformers
- **Sentence Transformers:** https://www.sbert.net/
- **API Status:** https://status.huggingface.co/

## Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Verify your API key is valid
3. Check Hugging Face status page
4. Review API logs in browser console

---

**Setup Time:** 5 minutes  
**Cost:** Free  
**Difficulty:** Easy

**Ready to go!** 🚀
