"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import DashboardLayout from "../components/DashboardLayout";
import LoadingSpinner from "../components/LoadingSpinner";

export default function VUTipsPage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      
      // Load from database
      const { data, error } = await supabase
        .from('vu_tips_sections')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error loading VU Tips sections:', error);
        setError('Failed to load VU Tips sections: ' + (error.message || 'Unknown error'));
        // Fallback to default sections
        setSections([
          {
            id: 1,
            title: "Study Techniques",
            description: "Effective study methods for VU students",
            video_id: null,
            order_index: 1,
            is_active: true
          },
          {
            id: 2,
            title: "Exam Preparation",
            description: "Tips for preparing for VU exams",
            video_id: null,
            order_index: 2,
            is_active: true
          }
        ]);
        return;
      }

      if (data && data.length > 0) {
        setSections(data);
      } else {
        // No data in database, use default sections
        setSections([
          {
            id: 1,
            title: "Study Techniques",
            description: "Effective study methods for VU students",
            video_id: null,
            order_index: 1,
            is_active: true
          },
          {
            id: 2,
            title: "Exam Preparation",
            description: "Tips for preparing for VU exams",
            video_id: null,
            order_index: 2,
            is_active: true
          }
        ]);
      }
    } catch (err) {
      console.error('Error in loadSections:', err);
      // Fallback to default sections
      setSections([
        {
          id: 1,
          title: "Study Techniques",
          description: "Effective study methods for VU students",
          video_id: null,
          order_index: 1,
          is_active: true
        },
        {
          id: 2,
          title: "Exam Preparation",
          description: "Tips for preparing for VU exams",
          video_id: null,
          order_index: 2,
          is_active: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openVideo = (videoId, title) => {
    if (!videoId) {
      alert('Video not available yet. Please check back later!');
      return;
    }

    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    try {
      // Try multiple Google Drive URL formats for better compatibility
      const urls = [
        `https://drive.google.com/file/d/${videoId}/preview`,
        `https://drive.google.com/file/d/${videoId}/view`,
        `https://drive.google.com/open?id=${videoId}`
      ];
      
      let popup = null;
      
      // Try the preview URL first (works better for embedding)
      popup = window.open(
        urls[0],
        `VUTips_${title}`,
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no`
      );
      
      if (!popup) {
        // Popup blocked, try direct link in new tab
        popup = window.open(urls[1], '_blank');
      }
      
      if (!popup) {
        // Still blocked, show instructions
        alert(`Unable to open video popup. Please:\n\n1. Allow popups for this site\n2. Or manually open: https://drive.google.com/file/d/${videoId}/view\n\nMake sure the video is shared as "Anyone with the link"`);
      }
    } catch (error) {
      console.error('Error opening video:', error);
      alert(`Unable to open video. Please check:\n\n1. Video is shared as "Anyone with the link"\n2. File ID is correct: ${videoId}\n3. Video exists in Google Drive`);
    }
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="/vu-tips">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="large" variant="primary" />
            <p className="mt-4 text-lg" style={{ color: 'hsl(var(--foreground))' }}>Loading VU Tips...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="/vu-tips">
      <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center sm:justify-start mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4" style={{ backgroundColor: 'hsl(var(--primary))' }}>
              <svg className="w-7 h-7" style={{ color: 'hsl(var(--primary-foreground))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>VU Tips</h1>
              <p className="text-sm sm:text-base" style={{ color: 'hsl(var(--muted-foreground))' }}>Essential tips and guidance for VU students</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: 'hsl(var(--destructive) / 0.1)', borderColor: 'hsl(var(--destructive) / 0.2)', color: 'hsl(var(--destructive))' }}>
            {error}
          </div>
        )}

        {/* Info notice for default sections */}
        {sections.length === 2 && sections[0].id === 1 && sections[1].id === 2 && (
          <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: 'hsl(var(--accent) / 0.1)', borderColor: 'hsl(var(--accent) / 0.2)', color: 'hsl(var(--accent))' }}>
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium mb-1">Default VU Tips Sections</p>
                <p className="text-sm">
                  These are sample sections. Administrators can add custom video content and manage sections from the admin panel.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sections Layout - 2 sections stacked vertically */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <div 
              key={section.id} 
              className="rounded-xl shadow-sm border-2 p-6 w-full"
              style={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))',
                borderLeftColor: 'hsl(var(--primary))',
                borderLeftWidth: '4px'
              }}
            >
              {/* Section Header */}
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                  <span className="font-bold text-lg">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-semibold mb-1" style={{ color: 'hsl(var(--card-foreground))' }}>
                    {section.title}
                  </h2>
                  <p className="text-sm sm:text-base" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {section.description}
                  </p>
                </div>
              </div>

              {/* Video Content Area */}
              <div className="w-full">
                <div 
                  className="relative w-full h-0 pb-[56.25%] rounded-lg overflow-hidden shadow-lg cursor-pointer group transition-all duration-200 hover:shadow-xl"
                  style={{ backgroundColor: 'hsl(var(--muted))' }}
                  onClick={() => openVideo(section.video_id, section.title)}
                >
                  {section.video_id ? (
                    <>
                      {/* Video Available */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:from-primary/30 group-hover:to-secondary/30 transition-all duration-200" style={{ borderRadius: '8px' }}></div>
                        
                        <div className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                          <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                        
                        <div className="relative z-10">
                          <h4 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors" style={{ color: 'hsl(var(--card-foreground))' }}>
                            Watch Video
                          </h4>
                          <div className="inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm group-hover:shadow-md transition-all duration-200" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                            Play Now
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* No Video Available */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                        <div className="text-6xl mb-6 opacity-50">🎥</div>
                        <h4 className="text-xl font-semibold mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Video Coming Soon
                        </h4>
                        <p className="text-base mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          This section will be updated with helpful video content
                        </p>
                        <div className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'hsl(var(--accent) / 0.1)', color: 'hsl(var(--accent))' }}>
                          Under Development
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {sections.length === 0 && !loading && (
          <div className="py-20 text-center">
            <div className="text-6xl mb-6">💡</div>
            <h3 className="text-2xl font-semibold mb-3" style={{ color: 'hsl(var(--foreground))' }}>No VU Tips Available</h3>
            <p className="text-base" style={{ color: 'hsl(var(--muted-foreground))' }}>
              VU Tips sections will appear here once they are added by administrators.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}