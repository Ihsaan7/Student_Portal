"use client";

import { useTheme } from './ThemeProvider';

export default function StudyBuddyLogo({ size = "medium", showText = true, className = "" }) {
  const { theme } = useTheme();
  
  const sizes = {
    small: { width: 32, height: 32 },
    medium: { width: 48, height: 48 },
    large: { width: 64, height: 64 },
    xlarge: { width: 80, height: 80 }
  };

  const currentSize = sizes[size] || sizes.medium;

  // Theme-aware colors
  const colors = {
    // Background circle - dark gray/green gradient
    background: theme === 'dark' ? '#1F2937' : '#374151', // Dark gray
    // Book pages - white/light gray
    bookPages: theme === 'dark' ? '#F9FAFB' : '#FFFFFF',
    // Bookmark - green accent
    bookmark: '#10B981', // Green
    // Graduation cap - green
    graduationCap: '#059669', // Darker green
    // Study dots - green
    studyDots: '#10B981',
    // Lines - light color
    lines: theme === 'dark' ? '#E5E7EB' : '#F3F4F6'
  };

  if (showText) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="relative" style={{ width: currentSize.width, height: currentSize.height }}>
          <svg width={currentSize.width} height={currentSize.height} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Background Circle with gradient */}
            <defs>
              <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.background} />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <circle cx="24" cy="24" r="24" fill="url(#bgGradient)"/>
            
            {/* Book Icon */}
            <path d="M14 12C14 10.8954 14.8954 10 16 10H20C21.1046 10 22 10.8954 22 12V36C22 37.1046 21.1046 38 20 38H16C14.8954 38 14 37.1046 14 36V12Z" fill={colors.bookPages}/>
            <path d="M26 12C26 10.8954 26.8954 10 28 10H32C33.1046 10 34 10.8954 34 12V36C34 37.1046 33.1046 38 32 38H28C26.8954 38 26 37.1046 26 36V12Z" fill={colors.bookPages}/>
            
            {/* Bookmark */}
            <path d="M22 10V20L24 18L26 20V10" fill={colors.bookmark}/>
            
            {/* Graduation Cap */}
            <path d="M24 6L36 12L24 18L12 12L24 6Z" fill={colors.graduationCap}/>
            <path d="M33 14V20C33 22 28.5 24 24 24C19.5 24 15 22 15 20V14" stroke={colors.graduationCap} strokeWidth="1.5" fill="none"/>
            
            {/* Study Elements */}
            <circle cx="18" cy="28" r="1" fill={colors.studyDots}/>
            <circle cx="30" cy="28" r="1" fill={colors.studyDots}/>
            <path d="M16 32H20M28 32H32" stroke={colors.lines} strokeWidth="1" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="flex flex-col">
          <span 
            className="text-xl font-bold"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            StudentNest
          </span>
          <span 
            className="text-sm"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            Learning Portal
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width: currentSize.width, height: currentSize.height }}>
      <svg width={currentSize.width} height={currentSize.height} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background Circle with gradient */}
        <defs>
          <linearGradient id={`bgGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.background} />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="24" fill={`url(#bgGradient-${size})`}/>
        
        {/* Book Icon */}
        <path d="M14 12C14 10.8954 14.8954 10 16 10H20C21.1046 10 22 10.8954 22 12V36C22 37.1046 21.1046 38 20 38H16C14.8954 38 14 37.1046 14 36V12Z" fill={colors.bookPages}/>
        <path d="M26 12C26 10.8954 26.8954 10 28 10H32C33.1046 10 34 10.8954 34 12V36C34 37.1046 33.1046 38 32 38H28C26.8954 38 26 37.1046 26 36V12Z" fill={colors.bookPages}/>
        
        {/* Bookmark */}
        <path d="M22 10V20L24 18L26 20V10" fill={colors.bookmark}/>
        
        {/* Graduation Cap */}
        <path d="M24 6L36 12L24 18L12 12L24 6Z" fill={colors.graduationCap}/>
        <path d="M33 14V20C33 22 28.5 24 24 24C19.5 24 15 22 15 20V14" stroke={colors.graduationCap} strokeWidth="1.5" fill="none"/>
        
        {/* Study Elements */}
        <circle cx="18" cy="28" r="1" fill={colors.studyDots}/>
        <circle cx="30" cy="28" r="1" fill={colors.studyDots}/>
        <path d="M16 32H20M28 32H32" stroke={colors.lines} strokeWidth="1" strokeLinecap="round"/>
      </svg>
    </div>
  );
}