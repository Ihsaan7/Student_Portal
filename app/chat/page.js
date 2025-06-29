"use client";
import DashboardLayout from "../components/DashboardLayout";
import { useState } from "react";

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(1);
  const [message, setMessage] = useState("");

  const chats = [
    {
      id: 1,
      name: "CS101 - Programming Fundamentals",
      instructor: "Dr. Sarah Johnson",
      lastMessage: "Great work on the assignment!",
      time: "2 min ago",
      unread: 2,
      online: true
    },
    {
      id: 2,
      name: "MATH201 - Calculus II",
      instructor: "Prof. Michael Chen",
      lastMessage: "The exam will be next week",
      time: "1 hour ago",
      unread: 0,
      online: false
    },
    {
      id: 3,
      name: "ENG101 - Academic Writing",
      instructor: "Dr. Emily Davis",
      lastMessage: "Please submit your essay by Friday",
      time: "3 hours ago",
      unread: 1,
      online: true
    },
    {
      id: 4,
      name: "Student Support",
      instructor: "Academic Advisor",
      lastMessage: "Your course registration is confirmed",
      time: "1 day ago",
      unread: 0,
      online: false
    }
  ];

  const messages = [
    {
      id: 1,
      sender: "instructor",
      message: "Hello! How can I help you with the programming assignment?",
      time: "10:30 AM"
    },
    {
      id: 2,
      sender: "student",
      message: "Hi Dr. Johnson, I'm having trouble with the loop concept in the assignment.",
      time: "10:32 AM"
    },
    {
      id: 3,
      sender: "instructor",
      message: "I'd be happy to help! Could you share the specific code you're working with?",
      time: "10:35 AM"
    },
    {
      id: 4,
      sender: "student",
      message: "Sure, here's what I have so far...",
      time: "10:40 AM"
    },
    {
      id: 5,
      sender: "instructor",
      message: "Great work on the assignment! Your approach is correct, but let me suggest a small optimization...",
      time: "2 min ago"
    }
  ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      // Here you would typically send the message to your backend
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const selectedChatData = chats.find(chat => chat.id === selectedChat);

  return (
    <DashboardLayout currentPage="/chat">
      <div className="max-w-7xl mx-auto h-[calc(100vh-200px)]">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat & Communication</h1>
          <p className="text-gray-600">Connect with your instructors and get academic support.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex">
          {/* Chat List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                    selectedChat === chat.id ? 'bg-indigo-50 border-indigo-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold">
                            {chat.instructor.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        {chat.online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium text-gray-900">{chat.name}</h3>
                        <p className="text-sm text-gray-600">{chat.instructor}</p>
                      </div>
                    </div>
                    {chat.unread > 0 && (
                      <div className="bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {chat.unread}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                    <span className="text-xs text-gray-500">{chat.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 flex flex-col">
            {selectedChatData ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center">
                  <div className="relative">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold text-sm">
                        {selectedChatData.instructor.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    {selectedChatData.online && (
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-white"></div>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900">{selectedChatData.name}</h3>
                    <p className="text-sm text-gray-600">{selectedChatData.instructor}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.sender === 'student'
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender === 'student' ? 'text-indigo-100' : 'text-gray-500'
                        }`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 21l1.8-4A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-gray-500">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 