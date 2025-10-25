"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useTheme } from './ThemeProvider';
import StudyBuddyLogo from './StudyBuddyLogo';
import Toast from './Toast';

export default function AIChatInterface({ user }) {
  const { theme, toggleTheme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [showFileActions, setShowFileActions] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatHistory();
  }, [user]);

  const displayToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const loadChatHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          text: msg.message,
          sender: msg.is_user ? 'user' : 'ai',
          timestamp: new Date(msg.created_at)
        }));
        setMessages(formattedMessages);
      } else {
        // Welcome message for new users
        setMessages([{
          id: 'welcome',
          text: "# 👋 Welcome to StudentNest!\n\nI'm your **AI assistant** and I can help you with:\n\n• **General Questions** - Ask me anything you'd like to know\n• **Conversations** - Have a friendly chat about any topic\n• **Information** - Get explanations and answers\n\nHow can I help you today?",
          sender: 'ai',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      
      // Check if it's a table not found error
      if (error.message && error.message.includes('relation "ai_chat_history" does not exist')) {
        console.warn('AI chat history table not found. Please run the database setup script.');
        displayToast('Chat history table not found. Please contact admin to set up the database.', 'warning');
      } else {
        displayToast('Failed to load chat history', 'error');
      }
      
      // Show welcome message even if history loading fails
      setMessages([{
        id: 'welcome',
        text: "# 👋 Welcome to StudentNest!\n\nI'm your **AI assistant** and I can help you with:\n\n• **General Questions** - Ask me anything you'd like to know\n• **Conversations** - Have a friendly chat about any topic\n• **Information** - Get explanations and answers\n\n## How can I assist you today?",
        sender: 'ai',
        timestamp: new Date()
      }]);
    }
  };

  const saveMessageToHistory = async (message, isUser) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('ai_chat_history')
        .insert({
          user_id: user.id,
          message: message,
          is_user: isUser
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving chat message:', error);
      
      // Don't show error toast for table not found - just log it
      if (error.message && error.message.includes('relation "ai_chat_history" does not exist')) {
        console.warn('AI chat history table not found. Messages will not be persisted.');
      } else {
        // Only show toast for other types of errors
        displayToast('Failed to save message to history', 'warning');
      }
    }
  };



  const callGeminiAPI = async (prompt) => {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: prompt,
            userId: user?.id
          })
        });

        if (!response.ok) {
          const rawBody = await response.text().catch(() => '');
          let errorData = {};

          if (rawBody) {
            try {
              errorData = JSON.parse(rawBody);
            } catch {
              errorData = { error: rawBody };
            }
          }

          console.error('AI API Error:', errorData);
          console.error('Response status:', response.status);
          console.error('Response headers:', Object.fromEntries(response.headers.entries()));

          if (response.status === 500 && errorData.error?.includes('configuration')) {
            throw new Error('AI service is not configured. Please check the setup guide.');
          }

          if (response.status === 503 && attempt < maxRetries - 1) {
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          if (response.status === 503) {
            if (errorData.error?.includes('high demand') || errorData.error?.includes('overloaded')) {
              throw new Error('🤖 The AI service is experiencing high demand. The system will automatically retry your request. Please wait a moment...');
            }
            if (errorData.error?.includes('network') || errorData.error?.includes('connection')) {
              throw new Error('🌐 Network connection issue. Please check your internet and try again.');
            }
            throw new Error('🔧 AI service is temporarily unavailable. Please try again in a few moments.');
          }

          throw new Error(errorData.error || 'Failed to get AI response. Please try again.');
        }

        const data = await response.json();
        return data.response;
      } catch (error) {
        lastError = error;

        if (error?.name === 'AbortError' && attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        if (attempt < maxRetries - 1 && (error?.message?.includes('network') || error?.message?.includes('fetch'))) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        console.error('Error calling AI API:', error);
        throw error;
      }
    }

    console.error('Error calling AI API:', lastError);
    throw lastError;
  };



  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setToastMessage('Please upload only PDF or TXT files.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setUploadedFile(file);
    setIsProcessingFile(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract text from file');
      }

      const data = await response.json();
      setExtractedText(data.text);
      setShowFileActions(true);
      
    } catch (error) {
      console.error('Error processing file:', error);
      setToastMessage('Failed to process the file. Please try again.');
      setToastType('error');
      setShowToast(true);
      setUploadedFile(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleSummarize = async () => {
    if (!extractedText) return;
    
    const prompt = `SUMMARIZE: Please shorten this content in easier and simpler wording, include examples with headings and subheadings`;
    await sendMessageWithPrompt(prompt);
    resetFileState();
  };

  const handleMCQs = async () => {
    if (!extractedText) return;
    
    const prompt = `GENERATE_MCQS: Please prepare a test for me from this file with 10 MCQs and 3 short answers (give the answers at the bottom so I don't get a proper glance and solve these questions myself and then see the answers)`;
    await sendMessageWithPrompt(prompt);
    resetFileState();
  };

  const sendMessageWithPrompt = async (prompt) => {
    const userMessage = {
      id: Date.now(),
      text: `Processing uploaded file: ${uploadedFile.name}`,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Call the AI API with file content
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          fileContent: extractedText,
          userId: user?.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiResponse = data.response;
      
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Save both messages to database
      await saveMessageToHistory(userMessage.text, true);
      await saveMessageToHistory(aiMessage.text, false);
      
    } catch (error) {
      console.error('Error calling AI API:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error processing your file. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      displayToast('Failed to get AI response', 'error');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const resetFileState = () => {
    setUploadedFile(null);
    setExtractedText('');
    setShowFileActions(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    const messageToSend = inputMessage.trim();
    
    if (!messageToSend) return;
    
    setIsLoading(true);
    setIsTyping(true);
    
    const newUserMessage = {
      id: Date.now(),
      text: messageToSend,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
     await saveMessageToHistory(messageToSend, true);
    
    try {
      const aiResponse = await callGeminiAPI(messageToSend);
      
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
       await saveMessageToHistory(aiResponse, false);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I apologize, but I'm having trouble processing your request right now. Please try again later.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      displayToast('Failed to get AI response', 'error');
    } finally {
      setInputMessage('');
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };



  const formatMessage = (text) => {
    // Split text into lines and process each line for markdown-like formatting
    return text.split('\n').map((line, index) => {
      let formattedLine = line;
      
      // Handle headings (## or ###)
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="text-lg font-semibold mt-4 mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>
            {line.substring(4)}
          </h3>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-xl font-bold mt-4 mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>
            {line.substring(3)}
          </h2>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="text-2xl font-bold mt-4 mb-3" style={{ color: 'hsl(var(--card-foreground))' }}>
            {line.substring(2)}
          </h1>
        );
      }
      
      // Handle bullet points
      if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
        const bulletContent = line.substring(2);
        return (
          <div key={index} className="flex items-start mb-1">
            <span className="mr-2 mt-1" style={{ color: 'hsl(var(--primary))' }}>•</span>
            <span>{processBoldText(bulletContent)}</span>
          </div>
        );
      }
      
      // Handle numbered lists
      const numberedMatch = line.match(/^(\d+\.)\s(.*)/);
      if (numberedMatch) {
        return (
          <div key={index} className="flex items-start mb-1">
            <span className="mr-2 mt-1 font-medium" style={{ color: 'hsl(var(--primary))' }}>{numberedMatch[1]}</span>
            <span>{processBoldText(numberedMatch[2])}</span>
          </div>
        );
      }
      
      // Handle empty lines
      if (line.trim() === '') {
        return <br key={index} />;
      }
      
      // Handle regular text with bold formatting
      return (
        <span key={index} className="block mb-1">
          {processBoldText(line)}
        </span>
      );
    });
  };
  
  const processBoldText = (text) => {
    // Handle **bold** text
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-semibold">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-full font-inter" style={{ backgroundColor: 'hsl(var(--background))' }}>
      {/* Chat Header */}
      <div className="border-b p-6" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <StudyBuddyLogo size="medium" showText={false} />
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>StudentNest AI Assistant</h2>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Hello! I'm here to help you with your studies. What topic are you interested in today?</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors hover:bg-opacity-80"
            style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
            title="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
        style={{ maxHeight: 'calc(100% - 200px)', backgroundColor: 'hsl(var(--muted) / 0.3)' }}
      >
        {messages.length === 0 ? (
          <div className="text-center mt-12" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <div className="text-5xl mb-6">💬</div>
              <p className="text-xl font-medium mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>Start a conversation!</p>
              <p className="text-base" style={{ color: 'hsl(var(--muted-foreground))' }}>Ask me anything you'd like to know!</p>
            </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-2xl px-6 py-4 rounded-2xl shadow-sm"
                style={{
                  backgroundColor: message.sender === 'user' ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                  color: message.sender === 'user' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--card-foreground))',
                  border: message.sender === 'user' ? 'none' : '1px solid hsl(var(--border))'
                }}
              >

                <div className="whitespace-pre-wrap text-base leading-relaxed">
                  {formatMessage(message.text)}
                </div>
                <div className="text-xs mt-2" style={{
                  color: message.sender === 'user' ? 'hsl(var(--primary-foreground) / 0.7)' : 'hsl(var(--muted-foreground))'
                }}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>



      {/* File Upload Area */}
      {showFileActions && (
        <div className="p-4 border-t" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.5)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
                <svg className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium" style={{ color: 'hsl(var(--card-foreground))' }}>{uploadedFile?.name}</span>
            </div>
            <button
              onClick={resetFileState}
              className="transition-colors"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              onMouseEnter={(e) => e.target.style.color = 'hsl(var(--card-foreground))'}
              onMouseLeave={(e) => e.target.style.color = 'hsl(var(--muted-foreground))'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSummarize}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              style={{ 
                backgroundColor: 'hsl(var(--success))', 
                color: 'hsl(var(--success-foreground))',
                borderColor: 'hsl(var(--success))',
                focusRingColor: 'hsl(var(--success))'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.opacity = '0.9';
                  e.target.style.borderColor = 'hsl(var(--success-foreground))';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.opacity = '1';
                  e.target.style.borderColor = 'hsl(var(--success))';
                }
              }}
            >
              📝 Summarize
            </button>
            <button
              onClick={handleMCQs}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              style={{ 
                backgroundColor: 'hsl(var(--secondary))', 
                color: 'hsl(var(--secondary-foreground))',
                borderColor: 'hsl(var(--secondary))',
                focusRingColor: 'hsl(var(--secondary))'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.opacity = '0.9';
                  e.target.style.borderColor = 'hsl(var(--secondary-foreground))';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.opacity = '1';
                  e.target.style.borderColor = 'hsl(var(--secondary))';
                }
              }}
            >
              📋 MCQs
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-6" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}>
        <div className="flex space-x-4 items-end mb-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors flex items-center space-x-2 text-sm ${isProcessingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ 
              borderColor: 'hsl(var(--border))', 
              color: 'hsl(var(--muted-foreground))',
              backgroundColor: 'hsl(var(--muted) / 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!isProcessingFile) {
                e.target.style.borderColor = 'hsl(var(--primary))';
                e.target.style.backgroundColor = 'hsl(var(--primary) / 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isProcessingFile) {
                e.target.style.borderColor = 'hsl(var(--border))';
                e.target.style.backgroundColor = 'hsl(var(--muted) / 0.3)';
              }
            }}
          >
            {isProcessingFile ? (
              <>
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'hsl(var(--primary))' }}></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Upload PDF or TXT</span>
              </>
            )}
          </label>
          
          <button
            onClick={() => {
              const text = prompt("Paste your text content here (since PDF text extraction failed):");
              if (text && text.trim()) {
                setExtractedText(text);
                setUploadedFile({ name: "Manual Text Input" });
                setShowFileActions(true);
              }
            }}
            className="px-4 py-2 border-2 rounded-lg transition-colors flex items-center space-x-2 text-sm"
            style={{ 
              borderColor: 'hsl(var(--primary))', 
              color: 'hsl(var(--primary))',
              backgroundColor: 'hsl(var(--background))'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'hsl(var(--primary) / 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'hsl(var(--background))';
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Paste Text</span>
          </button>
        </div>
        <div className="flex space-x-4 items-end">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 resize-none text-base leading-relaxed"
            style={{
              backgroundColor: 'hsl(var(--background))',
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--foreground))',
              focusRingColor: 'hsl(var(--primary))',
              focusBorderColor: 'hsl(var(--primary))'
            }}
            rows={2}
            disabled={isLoading}
            suppressHydrationWarning={true}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && inputMessage.trim()) {
                e.target.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && inputMessage.trim()) {
                e.target.style.opacity = '1';
              }
            }}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: 'hsl(var(--primary-foreground))' }}></div>
                <span>Sending...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Send</span>
                <span>📤</span>
              </div>
            )}
          </button>
        </div>
      </div>



      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}