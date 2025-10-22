# Google Gemini AI API Setup Guide

The AI chatbot feature requires a Google Gemini API key to function. Follow these steps to set it up:

## Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Choose "Create API key in new project" or select an existing project
5. Copy the generated API key

## Step 2: Configure Your Environment

1. Open the `.env.local` file in your project root
2. Replace `your_gemini_api_key_here` with your actual API key:
   ```
   GEMINI_API_KEY=AIzaSyC-your-actual-api-key-here
   ```
3. Save the file

## Step 3: Restart Your Development Server

After adding the API key, restart your Next.js development server:

```bash
npm run dev
```

## Important Notes

### Free Tier Limits

- Google Gemini offers a generous free tier
- 15 requests per minute
- 1 million tokens per minute
- 1,500 requests per day

### Security

- **Never commit your API key to version control**
- The `.env.local` file is already in `.gitignore`
- Keep your API key secure and don't share it publicly

### Troubleshooting

If you're still getting errors after setting up the API key:

1. **Check the API key format**: Should start with `AIzaSy`
2. **Verify the key is active**: Test it in Google AI Studio
3. **Restart the server**: Environment variables require a server restart
4. **Check quotas**: Ensure you haven't exceeded the free tier limits

### Error Messages

Common error messages and their solutions:

- **"AI service configuration error"**: API key is missing or invalid
- **"AI service is temporarily unavailable"**: You've hit rate limits or quotas
- **"Failed to get AI response"**: General API error, check your internet connection

## Testing the Setup

1. Navigate to the AI Chat page in your application
2. Send a test message like "Hello, can you help me?"
3. You should receive a response from the AI assistant

## Getting Help

If you continue to experience issues:

1. Check the browser console for detailed error messages
2. Verify your API key in Google AI Studio
3. Ensure your internet connection is stable
4. Try a simple test message first

---

**Note**: The AI chatbot is designed to help with academic questions, course guidance, and PDF document analysis. It's specifically tailored for the StudentNest learning environment.
