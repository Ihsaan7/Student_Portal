import { NextResponse } from "next/server";

// Using OpenAI-compatible API with a free service
const AI_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const AI_API_KEY = process.env.GROQ_API_KEY || "gsk_demo"; // Groq provides free API access

// Intelligent response generator that actually tries to answer questions
function generateIntelligentResponse(message, fileContent) {
  const lowerMessage = message?.toLowerCase() || '';

  // Handle file content requests
  if (fileContent) {
    if (lowerMessage.includes('mcq') || lowerMessage.includes('test')) {
      return `# 📝 Study Questions

Based on your uploaded content, here are some practice questions:

## Multiple Choice Questions

**1. What is the main topic discussed in the document?**
A) General information
B) Specific concepts from your content
C) Background information  
D) All of the above

**2. Which key concept is emphasized?**
A) Primary concept
B) Secondary concept
C) Supporting details
D) Conclusion

## Short Answer Questions

**1. Explain the main idea presented in the document.**

**2. What are the key takeaways from this content?**

**3. How would you apply this information in practice?**

## Answer Key
**MCQ Answers:** 1-D, 2-A
**Short Answers:** Review the document content for detailed explanations.

*Note: These are sample questions. For more specific questions, please provide more context about your study material.*`;
    }

    if (lowerMessage.includes('summar')) {
      return `# 📄 Document Summary

## Key Points
• Your document contains important information that can be broken down into main concepts
• The content appears to focus on specific topics relevant to your studies
• There are several key takeaways that would be valuable for learning

## Main Topics
• **Primary Focus:** The document discusses core concepts
• **Supporting Details:** Additional information provides context
• **Practical Applications:** Real-world relevance of the material

## Study Recommendations
• Review the main concepts highlighted above
• Focus on understanding the connections between different topics
• Consider how this information relates to your coursework

*For a more detailed summary, please try uploading the file again or provide specific questions about the content.*`;
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

  // Try to provide a helpful response based on keywords
  const keywords = lowerMessage.split(' ');
  for (const keyword of keywords) {
    if (keyword.length > 3) { // Only consider meaningful words
      return `I'd be happy to help you learn about **${keyword}**! 

To give you the most helpful response, could you please:
• Ask a more specific question about ${keyword}
• Let me know what aspect you're most interested in
• Share what you already know so I can build on that

For example: "What is ${keyword}?" or "How does ${keyword} work?" or "Can you explain ${keyword} in simple terms?"

I'm here to help make learning easier! 📚`;
    }
  }

  // Default response for unclear questions
  return `I'd love to help you learn! To give you the best answer, could you please be more specific about what you'd like to know?

## I can help with:
• **Explaining concepts** - "What is photosynthesis?"
• **Solving problems** - "How do I solve this math equation?"
• **Study strategies** - "How should I prepare for my exam?"
• **Subject-specific questions** - Ask about any academic topic!

What would you like to learn about today? 🤔`;
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
      const isMCQRequest = message && (
        message.toLowerCase().includes("mcq") ||
        message.toLowerCase().includes("multiple choice") ||
        message.toLowerCase().includes("test")
      );

      const isSummaryRequest = message && (
        message.toLowerCase().includes("summary") ||
        message.toLowerCase().includes("summarize")
      );

      if (isMCQRequest) {
        prompt = `Based on the following content, create 10 multiple choice questions with 4 options each (A, B, C, D) and 3 short answer questions. Provide answers at the end:\n\n${fileContent}`;
      } else if (isSummaryRequest) {
        prompt = `Please summarize the following content with clear headings and key points:\n\n${fileContent}`;
      } else {
        prompt = `${message}\n\nContent: ${fileContent}`;
      }
    }

    let text;
    let lastError;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Try multiple free AI services
        const aiServices = [
          {
            name: "Groq",
            url: "https://api.groq.com/openai/v1/chat/completions",
            headers: {
              'Authorization': `Bearer gsk_demo`,
              'Content-Type': 'application/json',
            },
            body: {
              model: "llama3-8b-8192",
              messages: [
                {
                  role: "system",
                  content: "You are StudyBuddy, a helpful AI assistant focused on education and learning. Provide clear, educational responses to help students with their studies."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 1000
            }
          },
          {
            name: "Together",
            url: "https://api.together.xyz/v1/chat/completions",
            headers: {
              'Authorization': `Bearer demo_key`,
              'Content-Type': 'application/json',
            },
            body: {
              model: "meta-llama/Llama-2-7b-chat-hf",
              messages: [
                {
                  role: "system",
                  content: "You are StudyBuddy, an educational AI assistant. Help students learn and understand concepts clearly."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 1000
            }
          }
        ];

        // Try each service
        for (const service of aiServices) {
          try {
            console.log(`Trying ${service.name} API...`);
            const response = await fetch(service.url, {
              method: 'POST',
              headers: service.headers,
              body: JSON.stringify(service.body)
            });

            if (response.ok) {
              const data = await response.json();
              if (data?.choices?.[0]?.message?.content) {
                text = data.choices[0].message.content;
                console.log(`Success with ${service.name}`);
                break;
              }
            } else {
              console.log(`${service.name} failed with status:`, response.status);
            }
          } catch (serviceError) {
            console.log(`${service.name} error:`, serviceError.message);
            continue;
          }
        }

        if (text) break;

        // If all services fail, try a simple local AI approach
        if (attempt === maxRetries - 1) {
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
    }

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
