# AI Academic Assistant - Setup Guide

This document provides setup instructions for the AI Academic Assistant feature integrated into the StudentNest Learning Management System.

## Features

### 🤖 AI Academic Assistant
- **General Q&A**: Ask questions about courses, assignments, and academic topics
- **PDF Analysis**: Upload lecture PDFs for automatic summarization with headings and key points
- **Conversation History**: All chats are saved and can be referenced later
- **Academic Focus**: Specialized prompts for educational content and study guidance

### 📄 PDF Processing
- **Text Extraction**: Automatic text extraction from PDF files
- **Smart Formatting**: Detects headings and structures content appropriately
- **Metadata Display**: Shows page count, word count, and file information
- **File Validation**: Supports PDF files up to 10MB

### 💬 Chat Interface
- **Real-time Messaging**: Instant responses with typing indicators
- **File Upload**: Drag-and-drop PDF upload functionality
- **Message History**: Persistent conversation storage
- **User Authentication**: Secure, user-specific chat sessions

## Setup Instructions

### 1. Install Dependencies

The required packages are already added to `package.json`. Run:

```bash
npm install
```

This will install:
- `@google/generative-ai` - Google Gemini AI integration
- `pdf-parse` - PDF text extraction

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

Add your Google Gemini API key to `.env.local`:

```env
# Get your API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Database Setup

Run the SQL script to create the chat history table:

```sql
-- Execute the contents of database/ai_chat_history.sql in your Supabase dashboard
```

Or manually create the table:

```sql
CREATE TABLE ai_chat_history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
    file_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Getting Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key to your `.env.local` file

**Note**: Google Gemini offers a generous free tier with:
- 1M+ context window
- Multimodal capabilities (text, images)
- High rate limits for development

## File Structure

```
app/
├── ai-chat/
│   └── page.js                 # Main AI chat page
├── api/
│   ├── ai-chat/
│   │   └── route.js            # Gemini AI integration
│   └── extract-pdf/
│       └── route.js            # PDF text extraction
├── components/
│   ├── AIChatInterface.js      # Main chat component
│   └── DashboardLayout.js      # Updated with AI Assistant nav
database/
└── ai_chat_history.sql         # Database schema
```

## Usage

### Accessing the AI Assistant

1. Navigate to the AI Assistant from the sidebar menu
2. Sign in if not already authenticated
3. Start chatting or upload a PDF file

### PDF Analysis

1. Click the 📎 attachment button
2. Select a PDF file (max 10MB)
3. Send a message or let the AI auto-analyze
4. Receive structured summary with headings

### Best Practices

- **Be Specific**: Ask detailed questions for better responses
- **Upload Quality PDFs**: Text-based PDFs work better than scanned images
- **Follow-up Questions**: Build on previous responses for deeper understanding
- **Academic Focus**: Frame questions in educational context for best results

## API Endpoints

### POST /api/ai-chat
Handles AI conversation requests

**Request Body:**
```json
{
  "message": "Your question here",
  "fileContent": "Optional PDF text content",
  "userId": "user_id"
}
```

**Response:**
```json
{
  "response": "AI generated response"
}
```

### POST /api/extract-pdf
Extracts text from uploaded PDF files

**Request:** FormData with PDF file

**Response:**
```json
{
  "text": "Extracted and formatted text",
  "metadata": {
    "pages": 10,
    "filename": "lecture.pdf",
    "size": 1024000
  },
  "wordCount": 500,
  "characterCount": 3000
}
```

## Troubleshooting

### Common Issues

1. **API Key Error**: Ensure `GEMINI_API_KEY` is set in `.env.local`
2. **PDF Upload Fails**: Check file size (max 10MB) and format (PDF only)
3. **Chat History Not Loading**: Verify database table exists and RLS policies are set
4. **Navigation Missing**: Ensure `DashboardLayout.js` includes AI Assistant link

### Error Messages

- `"AI service configuration error"` - Check API key
- `"Invalid or corrupted PDF file"` - Try a different PDF
- `"Failed to load chat history"` - Check database connection
- `"File size must be less than 10MB"` - Reduce file size

## Security Considerations

- API keys are server-side only (not exposed to client)
- User authentication required for all chat features
- Row Level Security (RLS) protects user chat data
- File uploads are validated for type and size
- No sensitive data is logged or stored unnecessarily

## Future Enhancements

- [ ] Image analysis capabilities
- [ ] Voice message support
- [ ] Chat export functionality
- [ ] Advanced PDF parsing (tables, images)
- [ ] Integration with course materials
- [ ] Collaborative chat sessions
- [ ] Custom AI model fine-tuning

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the console logs for detailed error messages
3. Ensure all environment variables are properly set
4. Verify database schema matches the provided SQL

---

**Note**: This AI assistant is designed for educational purposes and should be used as a supplementary learning tool alongside traditional study methods.