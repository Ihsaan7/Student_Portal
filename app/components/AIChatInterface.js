"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import Toast from './Toast';

export default function AIChatInterface({ user }) {
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
          sender: msg.sender,
          timestamp: new Date(msg.created_at)
        }));
        setMessages(formattedMessages);
      } else {
        // Welcome message for new users
        setMessages([{
          id: 'welcome',
          text: "# 👋 Welcome to StudyBuddy!\n\nI'm your **AI assistant** and I can help you with:\n\n• **General Questions** - Ask me anything you'd like to know\n• **Conversations** - Have a friendly chat about any topic\n• **Information** - Get explanations and answers\n\nHow can I help you today?",
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
        text: "# 👋 Welcome to StudyBuddy!\n\nI'm your **AI assistant** and I can help you with:\n\n• **General Questions** - Ask me anything you'd like to know\n• **Conversations** - Have a friendly chat about any topic\n• **Information** - Get explanations and answers\n\n## How can I assist you today?",
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
        const errorData = await response.json().catch(() => ({}));
        console.error('AI API Error:', errorData);
        console.error('Response status:', response.status);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.status === 500 && errorData.error?.includes('configuration')) {
          throw new Error('AI service is not configured. Please check the setup guide.');
        } else if (response.status === 503) {
          // Handle different types of 503 errors with specific messages
          if (errorData.error?.includes('high demand') || errorData.error?.includes('overloaded')) {
            throw new Error('🤖 The AI service is experiencing high demand. The system will automatically retry your request. Please wait a moment...');
          } else if (errorData.error?.includes('network') || errorData.error?.includes('connection')) {
            throw new Error('🌐 Network connection issue. Please check your internet and try again.');
          } else {
            throw new Error('🔧 AI service is temporarily unavailable. Please try again in a few moments.');
          }
        } else {
          throw new Error(errorData.error || 'Failed to get AI response. Please try again.');
        }
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error calling AI API:', error);
      throw error;
    }
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
    
    const prompt = `Can you shorten this in easier and simpler wording, include examples with headings and subheadings:\n\n${extractedText}`;
    await sendMessageWithPrompt(prompt);
    resetFileState();
  };

  const handleMCQs = async () => {
    if (!extractedText) return;
    
    const prompt = `Can you prepare a test for me from this file of 10 MCQs and 3 short answers (give the answers at the bottom so I don't get a proper glance and solve these questions myself and then see the answers):\n\n${extractedText}`;
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
      const response = await callGeminiAPI(prompt);
      
      const aiMessage = {
        id: Date.now() + 1,
        text: response,
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
          <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-gray-800">
            {line.substring(4)}
          </h3>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-xl font-bold mt-4 mb-2 text-gray-900">
            {line.substring(3)}
          </h2>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="text-2xl font-bold mt-4 mb-3 text-gray-900">
            {line.substring(2)}
          </h1>
        );
      }
      
      // Handle bullet points
      if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
        const bulletContent = line.substring(2);
        return (
          <div key={index} className="flex items-start mb-1">
            <span className="text-blue-600 mr-2 mt-1">•</span>
            <span>{processBoldText(bulletContent)}</span>
          </div>
        );
      }
      
      // Handle numbered lists
      const numberedMatch = line.match(/^(\d+\.)\s(.*)/);
      if (numberedMatch) {
        return (
          <div key={index} className="flex items-start mb-1">
            <span className="text-blue-600 mr-2 mt-1 font-medium">{numberedMatch[1]}</span>
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
    <div className="flex flex-col h-full bg-white font-inter">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-white">S</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">StudyBuddy</h2>
            <p className="text-sm text-gray-600">Hello! I'm here to help you with your studies. What topic are you interested in today?</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 custom-scrollbar"
        style={{ maxHeight: 'calc(100% - 200px)' }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">
              <div className="text-5xl mb-6">💬</div>
              <p className="text-xl font-medium text-gray-900 mb-2">Start a conversation!</p>
              <p className="text-base text-gray-600">Ask me anything you'd like to know!</p>
            </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl px-6 py-4 rounded-2xl shadow-sm ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >

                <div className="whitespace-pre-wrap text-base leading-relaxed">
                  {formatMessage(message.text)}
                </div>
                <div className={`text-xs mt-2 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
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
        <div className="p-4 border-t border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">{uploadedFile?.name}</span>
            </div>
            <button
              onClick={resetFileState}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              📝 Summarize
            </button>
            <button
              onClick={handleMCQs}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              📋 MCQs
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-6 bg-white">
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
            className={`px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center space-x-2 text-sm text-gray-600 ${isProcessingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProcessingFile ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
        </div>
        <div className="flex space-x-4 items-end">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500 text-base leading-relaxed"
            rows={2}
            disabled={isLoading}
            suppressHydrationWarning={true}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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