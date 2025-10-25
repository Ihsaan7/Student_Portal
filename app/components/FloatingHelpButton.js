"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function FloatingHelpButton() {
  const [showModal, setShowModal] = useState(false);
  const pathname = usePathname();

  // Don't show on home page
  if (pathname === '/home' || pathname === '/') {
    return null;
  }

  // Video links for each section (you can update these later)
  const videoLinks = {
    '/calendar': 'https://www.youtube.com/embed/VIDEO_ID_HERE', // Replace with actual video ID
    '/progress': 'https://www.youtube.com/embed/VIDEO_ID_HERE',
    '/ai-chat': 'https://www.youtube.com/embed/VIDEO_ID_HERE',
    '/notes': 'https://www.youtube.com/embed/VIDEO_ID_HERE',
    '/course-selection': 'https://www.youtube.com/embed/VIDEO_ID_HERE',
    '/student-services': 'https://www.youtube.com/embed/VIDEO_ID_HERE',
    '/chat': 'https://www.youtube.com/embed/VIDEO_ID_HERE',
    '/profile': 'https://www.youtube.com/embed/VIDEO_ID_HERE',
    '/notices': 'https://www.youtube.com/embed/VIDEO_ID_HERE',
    '/handbook': 'https://www.youtube.com/embed/VIDEO_ID_HERE',
    '/datesheet': 'https://www.youtube.com/embed/VIDEO_ID_HERE',
    '/course': 'https://www.youtube.com/embed/VIDEO_ID_HERE'
  };

  // Page titles for the modal
  const pageTitles = {
    '/calendar': 'Calendar & Events',
    '/progress': 'Progress Tracking',
    '/ai-chat': 'AI Assistant',
    '/notes': 'Notes Management',
    '/course-selection': 'Course Selection',
    '/student-services': 'Student Services',
    '/chat': 'Chat & Communication',
    '/profile': 'Profile Settings',
    '/notices': 'Notices & Announcements',
    '/handbook': 'Student Handbook',
    '/datesheet': 'Exam Datesheet',
    '/course': 'Course Materials'
  };

  const currentVideo = videoLinks[pathname];
  const currentTitle = pageTitles[pathname] || 'How to Use This Page';

  // Don't show if no video is configured for this page
  if (!currentVideo) {
    return null;
  }

  return (
    <>
      {/* Floating Help Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowModal(true)}
          className="w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl group"
          style={{
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))'
          }}
          title="Watch tutorial video"
        >
          <div className="flex items-center justify-center">
            <svg 
              className="w-6 h-6 transition-transform group-hover:scale-110" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          
          {/* Pulse animation */}
          <div 
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ backgroundColor: 'hsl(var(--primary))' }}
          ></div>
        </button>
      </div>

      {/* Video Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: 'hsl(var(--background) / 0.8)' }}
            onClick={() => setShowModal(false)}
          ></div>
          
          {/* Modal Content */}
          <div 
            className="relative w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden"
            style={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))'
            }}
          >
            {/* Modal Header */}
            <div 
              className="flex items-center justify-between p-6 border-b"
              style={{ borderColor: 'hsl(var(--border))' }}
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
                >
                  <svg 
                    className="w-5 h-5" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ color: 'hsl(var(--primary))' }}
                  >
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <div>
                  <h2 
                    className="text-xl font-semibold"
                    style={{ color: 'hsl(var(--card-foreground))' }}
                  >
                    How to Use: {currentTitle}
                  </h2>
                  <p 
                    className="text-sm"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    Watch this tutorial to learn how to use this section
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg transition-colors hover:bg-opacity-20"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Video Container */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={currentVideo}
                title={`Tutorial: ${currentTitle}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            {/* Modal Footer */}
            <div 
              className="p-4 border-t"
              style={{ 
                borderColor: 'hsl(var(--border))',
                backgroundColor: 'hsl(var(--muted) / 0.3)'
              }}
            >
              <div className="flex items-center justify-between">
                <p 
                  className="text-sm"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  💡 Tip: You can access this tutorial anytime using the help button
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))'
                  }}
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}