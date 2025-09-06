import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { message, fileContent, userId } = await request.json();

    if (!message && !fileContent) {
      return NextResponse.json(
        { error: 'Message or file content is required' },
        { status: 400 }
      );
    }

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Detect the type of request based on the message content
    const isMCQRequest = message && (message.toLowerCase().includes('mcq') || message.toLowerCase().includes('multiple choice') || message.toLowerCase().includes('test') && message.toLowerCase().includes('question'));
    const isSummaryRequest = message && (message.toLowerCase().includes('summary') || message.toLowerCase().includes('summarize'));
    
    // Prepare the prompt with enhanced context and instructions
    let prompt = `You are an AI Academic Assistant for Virtual University of Pakistan's Learning Management System. Your role is to provide comprehensive educational support.

## Your Capabilities:

### 1. Learning Platform Guidance
- Help students navigate the LMS features (courses, assignments, notes, calendar, progress tracking)
- Explain how to use course materials, submit assignments, and access resources
- Guide users through the platform's tools and functionalities

### 2. Academic Support
- Provide explanations of complex academic concepts
- Offer study strategies and learning techniques
- Help with course-specific questions and topics
- Suggest effective study schedules and methods
- Assist with exam preparation and revision strategies

### 3. Document Analysis (when document is provided)
- Create structured summaries with clear headings and subheadings
- Generate multiple choice questions (MCQs) and short answer questions
- Identify key concepts, definitions, and important points
- Organize information in a study-friendly format
- Highlight main topics and supporting details
- Provide study questions or key takeaways

## Response Guidelines:
- Be encouraging and supportive in your tone
- Provide practical, actionable advice
- Use clear, student-friendly language
- Include examples when helpful
- Structure responses with headings and bullet points for clarity
- For complex topics, break down information into digestible parts
- Always maintain academic integrity and encourage original thinking
- IMPORTANT: Follow the user's specific request type (MCQ generation, summary, etc.) exactly as requested

## Current User Query:
${message}`

    // If there's file content, add specific instructions based on request type
    if (fileContent) {
      if (isMCQRequest) {
        prompt += `\n\n## MCQ Generation Task\n\nYou have been provided with extracted text content from a document. Your task is to create multiple choice questions (MCQs) and short answer questions based ONLY on the content provided below.\n\n### MCQ Generation Instructions:\n- Create exactly the number of questions requested by the user\n- Each MCQ should have 4 options (A, B, C, D)\n- Include short answer questions if requested\n- Provide a complete answer key at the end\n- Base questions on key concepts and important information from the document\n- Ensure questions test understanding, not just memorization\n- Use clear, unambiguous language\n- Format properly with question numbers and option letters\n\n---\n\n**Document Content for MCQ Generation:**\n${fileContent}\n\n**Task:** Based solely on the content above, generate the requested multiple choice questions and short answer questions with a complete answer key.`;
      } else if (isSummaryRequest) {
        prompt += `\n\n## Document Summary Task\n\nYou have been provided with extracted text content from a document. Please create a comprehensive summary based ONLY on the content provided below.\n\n### Summary Instructions:\n- Work exclusively with the text content provided\n- Create clear headings and subheadings\n- Identify key concepts and important information\n- Organize content in a study-friendly format\n- Use markdown formatting for better readability\n- Focus on main topics and supporting details\n\n---\n\n**Document Content to Summarize:**\n${fileContent}\n\n**Task:** Based solely on the content above, provide a structured summary. Focus on the actual text content and avoid any references to file names or paths.`;
      } else {
        prompt += `\n\n## Document Analysis Task\n\nYou have been provided with extracted text content from a document. Please analyze the content based on the user's specific request.\n\n### Analysis Instructions:\n- Work exclusively with the text content provided\n- Follow the user's specific instructions exactly\n- Use appropriate formatting for the requested output type\n- Focus on the actual text content\n\n---\n\n**Document Content:**\n${fileContent}\n\n**Task:** Based solely on the content above, fulfill the user's specific request as stated in their query.`;
      }
    }

    // Generate response using Gemini with retry logic
    let text;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
        
        // If successful, break out of retry loop
        break;
      } catch (retryError) {
        retryCount++;
        console.log(`Gemini API attempt ${retryCount} failed:`, retryError.message);
        
        // If this is a 503 overloaded error and we have retries left
        if (retryError.message?.includes('overloaded') || retryError.message?.includes('503')) {
          if (retryCount < maxRetries) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // If not a retryable error or out of retries, throw the error
        throw retryError;
      }
    }

    // Log the interaction (optional, for monitoring)
    console.log(`AI Chat - User: ${userId}, Message length: ${message?.length || 0}, Has file: ${!!fileContent}`);
    if (fileContent) {
      console.log('File content preview:', fileContent.substring(0, 200) + '...');
    }

    return NextResponse.json({ response: text });

  } catch (error) {
    console.error('Error in AI chat API:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      stack: error.stack?.substring(0, 500)
    });
    
    // Handle specific Gemini API errors
    if (error.message?.includes('API_KEY')) {
      return NextResponse.json(
        { error: 'AI service configuration error. Please contact support.' },
        { status: 500 }
      );
    }
    
    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      return NextResponse.json(
        { error: 'AI service is temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    // Handle model overloaded error
    if (error.message?.includes('overloaded') || error.message?.includes('503')) {
      return NextResponse.json(
        { error: 'The AI service is currently experiencing high demand. Please wait a moment and try again.' },
        { status: 503 }
      );
    }

    // Handle network/timeout errors
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return NextResponse.json(
        { error: 'Network connection issue. Please check your internet connection and try again.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process your request. Please try again.' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}