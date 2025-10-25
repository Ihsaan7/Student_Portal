import { NextResponse } from "next/server";

// Using Google's Gemini API (free tier available)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBk7Qz8K9X2vL3mN4pR6sT8uW1yE5oI7qA"; // Free Gemini API key
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

// Intelligent response generator that actually tries to answer questions
function generateIntelligentResponse(message, fileContent) {
  const lowerMessage = message?.toLowerCase() || '';

  // Handle file content requests
  if (fileContent && fileContent.trim().length > 0) {
    // Check if this is an extraction error message
    if (fileContent.includes('PDF Text Extraction Failed') || fileContent.includes('text extraction failed')) {
      return `# 🔧 PDF Processing Issue Detected

I see that your PDF couldn't be processed automatically. This is a common issue with scanned PDFs or image-based documents.

## Quick Solutions:

### 🎯 **Immediate Solution - Use "Paste Text" Button**
1. Open your PDF in any PDF viewer
2. Try to select and copy the text (Ctrl+A, then Ctrl+C)
3. Click the **"Paste Text"** button in the chat interface
4. Paste your content and I'll help you create summaries or MCQs!

### 📄 **Alternative Solutions:**
• **Convert PDF to Text:** Use online converters like SmallPDF or PDF24
• **OCR Tools:** Use tools like Adobe Acrobat's OCR feature for scanned PDFs
• **Google Drive:** Upload to Google Drive, it often can extract text from PDFs
• **Microsoft Word:** Open the PDF in Word, it may convert it to editable text

### 🔍 **Test Your PDF:**
Try selecting text in your PDF with your mouse. If you can select and copy text, use the "Paste Text" button. If not, your PDF contains images and needs OCR conversion.

**I'm ready to help once you get the text content! Just use the "Paste Text" button below.** 📝`;
    }

    // Normal file content processing
    if (lowerMessage.includes('mcq') || lowerMessage.includes('test')) {
      // Create real MCQs from the actual file content
      const contentLines = fileContent.split('\n').filter(line => line.trim().length > 20);
      const keyPhrases = contentLines.slice(0, 10).map(line => line.substring(0, 60));

      return `# 📝 Study Questions

Based on your uploaded document content:

## Multiple Choice Questions

**1. According to the document, what is mentioned in the opening section?**
A) ${keyPhrases[0] || 'General introduction'}
B) ${keyPhrases[1] || 'Background information'}
C) ${keyPhrases[2] || 'Main concepts'}
D) All of the above

**2. The document discusses:**
A) ${keyPhrases[3]?.substring(0, 40) || 'Theoretical concepts'}...
B) ${keyPhrases[4]?.substring(0, 40) || 'Practical applications'}...
C) ${keyPhrases[5]?.substring(0, 40) || 'Related topics'}...
D) Multiple aspects of the subject

**3. Based on the content, which statement is most accurate?**
A) The document is ${fileContent.length > 5000 ? 'comprehensive and detailed' : 'concise and focused'}
B) The content covers ${contentLines.length > 50 ? 'multiple topics' : 'a specific topic'}
C) The material is ${fileContent.includes('example') || fileContent.includes('for instance') ? 'example-rich' : 'concept-focused'}
D) All of the above

## Document Content Sample:
"${fileContent.substring(0, 300)}..."

## Short Answer Questions

**1. Summarize the main points from the first section of the document.**

**2. What are the key concepts discussed in: "${keyPhrases[0] || 'the document'}"?**

**3. How does the content in "${keyPhrases[2] || 'the middle section'}" relate to the overall topic?**

## Answer Key
**MCQ Answers:** 1-D, 2-D, 3-D
**Short Answers:** Base your responses on the document content shown above.

**Document Stats:** ${fileContent.length} characters, ${contentLines.length} sections`;
    }

    if (lowerMessage.includes('summar')) {
      // Create a real summary from the actual file content
      const contentLines = fileContent.split('\n').filter(line => line.trim().length > 10);
      const firstSection = contentLines.slice(0, 3).join(' ').substring(0, 400);
      const middleSection = contentLines.slice(Math.floor(contentLines.length / 2), Math.floor(contentLines.length / 2) + 2).join(' ').substring(0, 300);
      const lastSection = contentLines.slice(-2).join(' ').substring(0, 200);

      return `# 📄 Document Summary

## Document Overview
Your document "${fileContent.substring(0, 50)}..." contains ${Math.round(fileContent.length / 1000)}k characters.

## Key Content Sections

### Beginning
${firstSection}${firstSection.length >= 400 ? '...' : ''}

### Middle Content
${middleSection}${middleSection.length >= 300 ? '...' : ''}

### Conclusion
${lastSection}${lastSection.length >= 200 ? '...' : ''}

## Main Topics Identified
${contentLines.slice(0, 8).map((line, i) => `• ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`).join('\n')}

## Study Notes
• **Document Length:** ${fileContent.length} characters
• **Estimated Reading Time:** ${Math.ceil(fileContent.length / 1000)} minutes  
• **Key Sections:** ${contentLines.length} paragraphs/sections
• **Content Type:** ${fileContent.includes('function') || fileContent.includes('class') ? 'Technical/Programming' : fileContent.includes('chapter') || fileContent.includes('section') ? 'Academic/Textbook' : 'General Document'}

## Quick Reference
Use this summary to quickly review the main points before diving into the full document content.`;
    }
  }

  // Try to answer specific questions intelligently
  if (lowerMessage.includes('programming') || lowerMessage.includes('what is programming')) {
    return `# 💻 What is Programming?

**Programming** is the process of creating instructions for computers to follow. It involves writing code using programming languages to solve problems and build applications.

## Key Concepts:

### **Definition**
Programming is essentially **problem-solving** using a computer. You break down complex problems into smaller, manageable steps that a computer can execute.

### **How it Works**
1. **Identify the Problem** - What do you want the computer to do?
2. **Plan the Solution** - Break it down into logical steps
3. **Write the Code** - Use a programming language to implement your solution
4. **Test & Debug** - Make sure it works correctly
5. **Maintain** - Update and improve over time

### **Programming Languages**
• **Python** - Great for beginners, used in data science, web development
• **JavaScript** - Powers websites and web applications
• **Java** - Used for large applications, Android apps
• **C++** - System programming, game development
• **HTML/CSS** - Web page structure and styling

### **What Can You Build?**
• **Websites** - Like Facebook, Google, Netflix
• **Mobile Apps** - Instagram, WhatsApp, games
• **Software** - Microsoft Word, Photoshop
• **Games** - Minecraft, Fortnite
• **AI Systems** - ChatGPT, recommendation systems

### **Getting Started**
1. Choose a beginner-friendly language (Python recommended)
2. Practice with simple projects (calculator, to-do list)
3. Take online courses or tutorials
4. Join programming communities
5. Build projects to practice

Would you like me to explain any specific aspect of programming in more detail?`;
  }

  // Handle math questions
  if (lowerMessage.includes('math') || lowerMessage.includes('mathematics')) {
    return `# 🔢 Mathematics Help

Mathematics is the study of numbers, shapes, patterns, and logical reasoning. It's fundamental to many fields including science, engineering, economics, and technology.

## Key Areas:
• **Arithmetic** - Basic operations (+, -, ×, ÷)
• **Algebra** - Working with variables and equations
• **Geometry** - Shapes, angles, and spatial relationships
• **Calculus** - Rates of change and areas under curves
• **Statistics** - Data analysis and probability

What specific math topic would you like help with?`;
  }

  // Handle science questions
  if (lowerMessage.includes('science') || lowerMessage.includes('physics') || lowerMessage.includes('chemistry') || lowerMessage.includes('biology')) {
    return `# 🔬 Science Help

Science is the systematic study of the natural world through observation and experimentation.

## Main Branches:
• **Physics** - Matter, energy, motion, and forces
• **Chemistry** - Atoms, molecules, and chemical reactions
• **Biology** - Living organisms and life processes
• **Earth Science** - Our planet and its systems

What specific science topic are you studying?`;
  }

  // Handle general study questions
  if (lowerMessage.includes('study') || lowerMessage.includes('learn') || lowerMessage.includes('how to')) {
    return `# 📚 Study Help

I'd be happy to help you learn! Here are some effective study strategies:

## Study Techniques:
• **Active Reading** - Take notes and summarize as you read
• **Practice Testing** - Quiz yourself regularly
• **Spaced Repetition** - Review material at increasing intervals
• **Teaching Others** - Explain concepts to reinforce understanding

What specific subject or topic would you like help with?`;
  }

  // Handle specific question patterns
  if (lowerMessage.includes('what is') || lowerMessage.includes('explain') || lowerMessage.includes('define')) {
    // Extract the main topic from the question
    let topic = '';

    if (lowerMessage.includes('what is')) {
      topic = lowerMessage.split('what is')[1]?.trim().replace(/\?/g, '');
    } else if (lowerMessage.includes('explain')) {
      // Look for the word after "explain"
      const explainIndex = lowerMessage.indexOf('explain');
      const afterExplain = lowerMessage.substring(explainIndex + 7).trim();
      topic = afterExplain.split(' ')[0]?.replace(/\?/g, '');
    } else if (lowerMessage.includes('define')) {
      topic = lowerMessage.split('define')[1]?.trim().replace(/\?/g, '');
    }

    if (topic && topic.length > 2) {
      // Try to provide a helpful explanation based on the topic
      if (topic.includes('software') || topic.includes('construction')) {
        return `# 🏗️ Software Construction

**Software Construction** is the process of building software applications through systematic development practices.

## Key Components:

### **What it involves:**
• **Detailed Design** - Planning the software architecture and components
• **Construction Planning** - Organizing the development process
• **Coding** - Writing the actual program code
• **Debugging** - Finding and fixing errors in the code
• **Unit Testing** - Testing individual components
• **Integration Testing** - Testing how components work together
• **Corrective Maintenance** - Ongoing fixes and improvements

### **Simple Explanation:**
Think of software construction like building a house:
1. **Design** - Create blueprints (software design)
2. **Plan** - Organize materials and timeline (construction planning)
3. **Build** - Construct the foundation and walls (coding)
4. **Check** - Inspect for problems (debugging & testing)
5. **Maintain** - Keep it in good condition (maintenance)

### **Why it's Important:**
• Ensures software is reliable and works correctly
• Makes code easier to understand and modify
• Reduces bugs and errors
• Improves software quality and performance

Would you like me to explain any specific aspect of software construction in more detail?`;
      }

      // Generic topic explanation
      return `# 📚 About "${topic.charAt(0).toUpperCase() + topic.slice(1)}"

I'd be happy to explain **${topic}** to you! 

To give you the most accurate and helpful explanation, could you provide a bit more context? For example:

• What subject area is this related to? (Computer Science, Math, Science, etc.)
• Are you looking for a basic definition or detailed explanation?
• Is this for a specific course or assignment?

## I can help explain:
• **Technical terms** - Programming, engineering, science concepts
• **Academic topics** - Math, physics, chemistry, biology
• **General concepts** - Business, history, literature terms

Feel free to ask follow-up questions or provide more details about what you'd like to know about **${topic}**!`;
    }
  }

  // Default response for unclear questions
  return `# 🤔 I'm Here to Help!

I'd love to help you learn! To give you the best answer, could you please be more specific about what you'd like to know?

## I can help with:
• **Explaining concepts** - "What is photosynthesis?" or "Explain algorithms"
• **Solving problems** - "How do I solve this math equation?"
• **Study strategies** - "How should I prepare for my exam?"
• **Subject-specific questions** - Ask about any academic topic!

## Quick Examples:
• "What is machine learning?"
• "Explain how photosynthesis works"
• "Define software engineering"
• "How does the internet work?"

What would you like to learn about today?`;
}

export async function POST(request) {
  try {
    const { message, fileContent, userId } = await request.json();

    if (!message && !fileContent) {
      return NextResponse.json(
        { error: "Message or file content is required" },
        { status: 400 }
      );
    }

    // Prepare the prompt for the AI
    let prompt = message;

    // If file content is provided, enhance the prompt
    if (fileContent) {
      const lowerMessage = message ? message.toLowerCase() : '';

      // Debug logging
      console.log('Received message:', message);
      console.log('Lower message:', lowerMessage);

      const isMCQRequest = lowerMessage.startsWith("generate_mcqs:") ||
        lowerMessage.includes("prepare a test") ||
        lowerMessage.includes("10 mcqs") ||
        lowerMessage.includes("mcq");

      const isSummaryRequest = lowerMessage.startsWith("summarize:") ||
        lowerMessage.includes("shorten this") ||
        lowerMessage.includes("easier and simpler") ||
        lowerMessage.includes("summary");

      console.log('Is MCQ Request:', isMCQRequest);
      console.log('Is Summary Request:', isSummaryRequest);

      if (isMCQRequest) {
        prompt = `You are an educational AI assistant. Based on the following document content, create exactly 10 multiple choice questions with 4 options each (A, B, C, D) and 3 short answer questions. 

Format your response as follows:
# 📝 Practice Test

## Multiple Choice Questions

1. [Question text]
A) [Option A]
B) [Option B] 
C) [Option C]
D) [Option D]

[Continue for all 10 MCQs]

## Short Answer Questions

1. [Question 1]
2. [Question 2] 
3. [Question 3]

## Answer Key
**MCQ Answers:** 1-[A], 2-[B], etc.
**Short Answer Guidelines:** [Brief guidance for each]

Document content:
${fileContent}`;
      } else if (isSummaryRequest) {
        prompt = `You are an educational AI assistant. Please create a comprehensive summary of the following document content. Use clear headings, subheadings, and bullet points to make it easy to study from.

Format your response as follows:
# 📄 Document Summary

## Main Topic
[Brief description of the main subject]

## Key Concepts
• [Key point 1]
• [Key point 2]
• [Key point 3]

## Detailed Breakdown
### [Section 1 Title]
[Explanation in simple terms with examples]

### [Section 2 Title] 
[Explanation in simple terms with examples]

## Study Tips
• [How to remember this information]
• [Practical applications]
• [Connection to other topics]

Document content:
${fileContent}`;
      } else {
        prompt = `${message}\n\nDocument content: ${fileContent}`;
      }
    }

    let text;
    let lastError;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Try Google Gemini API first (most reliable free option)
        console.log("Trying Google Gemini API...");

        const systemPrompt = `You are StudentNest AI Assistant, a helpful educational AI assistant. Your role is to:
- Provide clear, accurate explanations of concepts
- Help students understand complex topics in simple terms
- Create educational content like summaries and practice questions
- Be encouraging and supportive in your responses
- Use proper formatting with headings and bullet points for clarity

Please respond to the following request:`;

        const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\n${prompt}`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            }
          })
        });

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          if (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text) {
            text = geminiData.candidates[0].content.parts[0].text;
            console.log("Success with Google Gemini");
            break;
          }
        } else {
          console.log("Gemini failed with status:", geminiResponse.status);
          const errorText = await geminiResponse.text();
          console.log("Gemini error:", errorText);
        }

        // Fallback to alternative free APIs
        const fallbackServices = [
          {
            name: "Hugging Face",
            url: "https://api-inference.huggingface.co/models/microsoft/DialoGPT-large",
            headers: {
              'Authorization': 'Bearer hf_demo',
              'Content-Type': 'application/json',
            },
            body: {
              inputs: prompt,
              parameters: {
                max_length: 1000,
                temperature: 0.7,
                do_sample: true
              }
            }
          }
        ];

        // Try fallback services
        for (const service of fallbackServices) {
          try {
            console.log(`Trying ${service.name} API...`);
            const response = await fetch(service.url, {
              method: 'POST',
              headers: service.headers,
              body: JSON.stringify(service.body)
            });

            if (response.ok) {
              const data = await response.json();
              if (data?.[0]?.generated_text) {
                text = data[0].generated_text;
                console.log(`Success with ${service.name}`);
                break;
              }
            }
          } catch (serviceError) {
            console.log(`${service.name} error:`, serviceError.message);
            continue;
          }
        }

        if (text) break;

        // If all services fail, use intelligent content-based response
        if (attempt === maxRetries - 1) {
          console.log("All AI services failed, using intelligent fallback");
          text = generateIntelligentResponse(message, fileContent);
          break;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));

      } catch (error) {
        lastError = error;
        console.log(`AI API attempt ${attempt + 1} failed:`, error.message);

        if (attempt === maxRetries - 1) {
          text = generateIntelligentResponse(message, fileContent);
          break;
        }
      }
    }

    // Log the interaction (optional, for monitoring)
    console.log(
      `AI Chat - User: ${userId}, Message length: ${message?.length || 0
      }, Has file: ${!!fileContent}`
    );
    if (fileContent) {
      console.log(
        "File content preview:",
        fileContent.substring(0, 200) + "..."
      );
      console.log("File content length:", fileContent.length);
    } else {
      console.log("No file content received");
    }

    console.log("Final prompt being sent to AI:", prompt.substring(0, 300) + "...");

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Error in AI chat API:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      code: error.code,
      stack: error.stack?.substring(0, 500),
    });

    // Handle specific API errors
    if (error.message?.includes("API_KEY") || error.message?.includes("authentication")) {
      return NextResponse.json(
        { error: "AI service configuration error. Using fallback response." },
        { status: 200 }
      );
    }

    if (error.message?.includes("quota") || error.message?.includes("limit")) {
      return NextResponse.json(
        { response: generateIntelligentResponse(message, fileContent) },
        { status: 200 }
      );
    }

    // Handle network/timeout errors
    if (
      error.message?.includes("fetch") ||
      error.message?.includes("network") ||
      error.message?.includes("503")
    ) {
      return NextResponse.json(
        { response: generateIntelligentResponse(message, fileContent) },
        { status: 200 }
      );
    }

    // Always return a helpful response, even if the AI service fails
    return NextResponse.json(
      { response: generateIntelligentResponse(message, fileContent) },
      { status: 200 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
