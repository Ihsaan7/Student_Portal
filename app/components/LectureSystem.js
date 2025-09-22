'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminVideoManager from './AdminVideoManager';
import AdminVideoPanel from './AdminVideoPanel';
import { isAdminMode } from './AdminOnlyButton';

const LectureSystem = ({ courseCode, user }) => {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedLecture, setExpandedLecture] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [userLikes, setUserLikes] = useState(new Set());
  const [userUnlikes, setUserUnlikes] = useState(new Set());
  const [showUnlikeModal, setShowUnlikeModal] = useState(false);
  const [selectedHandoutId, setSelectedHandoutId] = useState(null);
  const [unlikeReason, setUnlikeReason] = useState('');

  useEffect(() => {
    fetchLectures();
    fetchUserLikes();
    fetchUserUnlikes();
  }, [courseCode]);

  const fetchLectures = async () => {
    try {
      setLoading(true);
      
      // First check if tables exist by testing a simple query
      const { data: testData, error: testError } = await supabase
        .from('lectures')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('Database tables not found:', testError);
        setError('Database tables not set up. Please run the lecture-system-setup.sql script in your Supabase SQL Editor first.');
        return;
      }
      
      // Fetch lectures with handouts and videos
      const { data: lecturesData, error: lecturesError } = await supabase
        .from('lectures')
        .select(`
          *,
          handouts:handouts(
            *,
            like_count:handout_likes(count)
          ),
          videos:lecture_videos(*)
        `)
        .eq('course_code', courseCode)
        .order('lecture_number');

      if (lecturesError) throw lecturesError;

      // Process the data to include like counts
      const processedLectures = lecturesData.map(lecture => ({
        ...lecture,
        handouts: lecture.handouts.map(handout => ({
          ...handout,
          like_count: handout.like_count?.[0]?.count || 0
        }))
      }));

      setLectures(processedLectures);
    } catch (err) {
      console.error('Error fetching lectures:', err);
      setError('Failed to load lectures. Please check if the database is properly set up.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLikes = async () => {
    if (!user) return;
    
    try {
      const { data: likesData, error } = await supabase
        .from('handout_likes')
        .select('handout_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const likedHandouts = new Set(likesData.map(like => like.handout_id));
      setUserLikes(likedHandouts);
    } catch (err) {
      console.error('Error fetching user likes:', err);
    }
  };

  const fetchUserUnlikes = async () => {
    if (!user) return;
    
    try {
      const { data: unlikesData, error } = await supabase
        .from('handout_unlikes')
        .select('handout_id')
        .eq('user_id', user.id);

      if (error) {
        // Table might not exist yet, ignore error
        console.log('Unlikes table not found, skipping...');
        return;
      }

      const unlikedHandouts = new Set(unlikesData.map(unlike => unlike.handout_id));
      setUserUnlikes(unlikedHandouts);
    } catch (err) {
      console.error('Error fetching user unlikes:', err);
    }
  };

  const toggleLike = async (handoutId) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('toggle_handout_like', {
          handout_id_param: handoutId,
          user_id_param: user.id
        });

      if (error) throw error;

      // Update local state
      const newUserLikes = new Set(userLikes);
      const newUserUnlikes = new Set(userUnlikes);
      
      if (data) {
        newUserLikes.add(handoutId);
        newUserUnlikes.delete(handoutId); // Remove from unlikes if liked
      } else {
        newUserLikes.delete(handoutId);
      }
      
      setUserLikes(newUserLikes);
      setUserUnlikes(newUserUnlikes);

      // Refresh lectures to get updated counts
      fetchLectures();
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleUnlikeClick = (handoutId) => {
    setSelectedHandoutId(handoutId);
    setShowUnlikeModal(true);
  };

  const submitUnlike = async () => {
    if (!user || !selectedHandoutId || !unlikeReason.trim()) return;

    try {
      const { data, error } = await supabase
        .rpc('toggle_handout_unlike', {
          handout_id_param: selectedHandoutId,
          user_id_param: user.id,
          reason_param: unlikeReason.trim()
        });

      if (error) throw error;

      // Update local state
      const newUserUnlikes = new Set(userUnlikes);
      const newUserLikes = new Set(userLikes);
      
      if (data) {
        newUserUnlikes.add(selectedHandoutId);
        newUserLikes.delete(selectedHandoutId); // Remove from likes if unliked
      } else {
        newUserUnlikes.delete(selectedHandoutId);
      }
      
      setUserUnlikes(newUserUnlikes);
      setUserLikes(newUserLikes);

      // Close modal and reset
      setShowUnlikeModal(false);
      setSelectedHandoutId(null);
      setUnlikeReason('');

      // Refresh lectures to get updated counts
      fetchLectures();
    } catch (err) {
      console.error('Error submitting unlike:', err);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  const handleFileUpload = async (lectureId, file) => {
    if (!user || !file) return;

    try {
      setUploadingFile(lectureId);

      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${courseCode}_lecture_${lectureId}_${Date.now()}.${fileExt}`;
      const filePath = `handouts/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath);

      // Save handout record to database
      const { error: insertError } = await supabase
        .from('handouts')
        .insert({
          lecture_id: lectureId,
          title: file.name,
          file_url: publicUrl,
          file_name: fileName,
          file_size: file.size,
          uploaded_by: user.id,
          is_approved: false // Requires admin approval
        });

      if (insertError) throw insertError;

      // Refresh lectures
      fetchLectures();
      alert('File uploaded successfully! It will be available after admin approval.');
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(null);
    }
  };

  const openPDF = async (fileUrl, handoutId, lectureId) => {
    // Track handout download/view
    if (user && handoutId && lectureId) {
      try {
        await supabase.rpc('track_handout_access', {
          p_user_id: user.id,
          p_handout_id: handoutId,
          p_course_code: courseCode,
          p_lecture_id: lectureId,
          p_download_type: 'view'
        });
      } catch (error) {
        console.error('Error tracking handout access:', error);
      }
    }
    
    window.open(fileUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="rounded-xl shadow-sm border-2 p-6" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <div className="animate-pulse">
          <div className="h-6 rounded w-1/4 mb-4" style={{ backgroundColor: 'hsl(var(--muted))' }}></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded" style={{ backgroundColor: 'hsl(var(--muted) / 0.5)' }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl shadow-sm border-2 p-6" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <div className="text-center" style={{ color: 'hsl(var(--destructive))' }}>
          <p>{error}</p>
          <button 
            onClick={fetchLectures}
            className="mt-2 text-sm transition-colors"
            style={{ color: 'hsl(var(--primary))' }}
            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none rounded-xl shadow-md border-2 p-4 sm:p-6" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
      <h2 className="text-xl font-bold mb-6" style={{ color: 'hsl(var(--card-foreground))' }}>Course Lectures</h2>
      
      <div className="space-y-4 w-full">
        {lectures.map((lecture) => (
          <div key={lecture.id} className="w-full border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: 'hsl(var(--border))' }}>
            {/* Lecture Header */}
            <div 
              className="p-4 sm:p-6 cursor-pointer transition-colors w-full"
              style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'hsl(var(--muted) / 0.5)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'hsl(var(--muted) / 0.3)'}
              onClick={() => setExpandedLecture(expandedLecture === lecture.id ? null : lecture.id)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 flex-1 min-w-0">
                  <span className="text-sm font-semibold px-3 py-1 rounded whitespace-nowrap self-start" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                    Lecture {lecture.lecture_number}
                  </span>
                  <h3 className="text-lg font-semibold break-words" style={{ color: 'hsl(var(--card-foreground))' }}>{lecture.title}</h3>
                </div>
                <div className="flex items-center justify-between sm:justify-end space-x-2 flex-shrink-0">
                  <span className="text-sm whitespace-nowrap" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {lecture.handouts?.filter(h => h.is_approved).length || 0} handouts
                  </span>
                  <svg 
                    className={`w-6 h-6 transition-transform ${
                      expandedLecture === lecture.id ? 'rotate-180' : ''
                    }`}
                    style={{ color: 'hsl(var(--muted-foreground))' }} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {lecture.description && (
                <p className="text-sm mt-3 break-words" style={{ color: 'hsl(var(--muted-foreground))' }}>{lecture.description}</p>
              )}
            </div>

            {/* Lecture Content */}
            {expandedLecture === lecture.id && (
              <div className="p-4 sm:p-6 border-t w-full" style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 w-full">
                  {/* Handouts Section */}
                  <div className="w-full min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center" style={{ color: 'hsl(var(--card-foreground))' }}>
                        <svg className="w-4 h-4 mr-2" style={{ color: 'hsl(var(--primary))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Handouts
                      </h4>
                      {lecture.handouts?.filter(handout => handout.is_approved).length === 0 && (
                        <label className="cursor-pointer text-sm transition-colors" style={{ color: 'hsl(var(--primary))' }} onMouseEnter={(e) => e.target.style.opacity = '0.8'} onMouseLeave={(e) => e.target.style.opacity = '1'}>
                          + Upload
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.ppt,.pptx"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) handleFileUpload(lecture.id, file);
                            }}
                            disabled={uploadingFile === lecture.id}
                          />
                        </label>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {lecture.handouts?.filter(handout => handout.is_approved).length > 0 ? (
                        lecture.handouts
                          .filter(handout => handout.is_approved)
                          .map((handout) => (
                            <div key={handout.id} className="w-full rounded-lg p-4 sm:p-5 border hover:shadow-md transition-shadow" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                              <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-3 w-full">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'hsl(var(--destructive) / 0.1)' }}>
                                  <svg className="w-6 h-6" style={{ color: 'hsl(var(--destructive))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-base sm:text-lg font-semibold break-words mb-1" style={{ color: 'hsl(var(--card-foreground))' }}>{handout.title}</p>
                                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    {(handout.file_size / 1024 / 1024).toFixed(1)} MB
                                  </p>
                                  {handout.uploader_name && (
                                    <p className="text-xs mt-1" style={{ color: 'hsl(var(--primary))' }}>
                                      📤 Uploaded by {handout.uploader_name}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mt-4 space-y-3 sm:space-y-0 sm:space-x-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                     onClick={() => toggleLike(handout.id)}
                                     className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200"
                                    style={{
                                      backgroundColor: userLikes.has(handout.id) ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted) / 0.5)',
                                      color: userLikes.has(handout.id) ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                      borderColor: userLikes.has(handout.id) ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--border))'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!userLikes.has(handout.id)) {
                                        e.target.style.backgroundColor = 'hsl(var(--primary) / 0.05)';
                                        e.target.style.color = 'hsl(var(--primary))';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!userLikes.has(handout.id)) {
                                        e.target.style.backgroundColor = 'hsl(var(--muted) / 0.5)';
                                        e.target.style.color = 'hsl(var(--muted-foreground))';
                                      }
                                    }}
                                   >
                                     <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                     </svg>
                                     <span className="hidden sm:inline">{handout.like_count || 0} Likes</span>
                                     <span className="sm:hidden">{handout.like_count || 0}</span>
                                   </button>
                                  
                                  <button
                                    onClick={() => handleUnlikeClick(handout.id)}
                                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200"
                                    style={{
                                      backgroundColor: userUnlikes.has(handout.id) ? 'hsl(var(--destructive) / 0.1)' : 'hsl(var(--muted) / 0.5)',
                                      color: userUnlikes.has(handout.id) ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))',
                                      borderColor: userUnlikes.has(handout.id) ? 'hsl(var(--destructive) / 0.3)' : 'hsl(var(--border))'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!userUnlikes.has(handout.id)) {
                                        e.target.style.backgroundColor = 'hsl(var(--destructive) / 0.05)';
                                        e.target.style.color = 'hsl(var(--destructive))';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!userUnlikes.has(handout.id)) {
                                        e.target.style.backgroundColor = 'hsl(var(--muted) / 0.5)';
                                        e.target.style.color = 'hsl(var(--muted-foreground))';
                                      }
                                    }}
                                  >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <span className="hidden sm:inline">{handout.unlike_count || 0} Issues</span>
                                    <span className="sm:hidden">{handout.unlike_count || 0}</span>
                                  </button>
                                </div>
                                <button
                                  onClick={() => openPDF(handout.file_url, handout.id, lecture.id)}
                                  className="px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors w-full sm:w-auto"
                                  style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                                  onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                                >
                                  📄 Open PDF
                                </button>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          <svg className="w-8 h-8 mx-auto mb-3" style={{ color: 'hsl(var(--muted))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-base font-medium">No handouts available</p>
                          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>Upload your own materials for approval</p>
                        </div>
                      )}
                      
                      {uploadingFile === lecture.id && (
                        <div className="flex items-center justify-center p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: 'hsl(var(--primary))' }}></div>
                          <span className="text-sm" style={{ color: 'hsl(var(--primary))' }}>Uploading...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Videos Section */}
                  <div className="w-full min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center" style={{ color: 'hsl(var(--card-foreground))' }}>
                        <svg className="w-4 h-4 mr-2" style={{ color: 'hsl(var(--primary))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Video Lecture
                      </h4>
                      <AdminVideoManager 
                        lectureId={lecture.id} 
                        courseCode={courseCode}
                        onVideoAdded={() => fetchLectures()}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      {lecture.videos?.length > 0 ? (
                        lecture.videos.map((video) => (
                          <div key={video.id}>
                            {video.youtube_url ? (
                              <div className="w-full rounded-lg p-4" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
                                  <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'hsl(var(--destructive) / 0.1)' }}>
                                    <svg className="w-5 h-5" style={{ color: 'hsl(var(--destructive))' }} fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium break-words text-sm sm:text-base" style={{ color: 'hsl(var(--card-foreground))' }}>{video.title}</p>
                                    {video.duration && (
                                      <p className="text-xs sm:text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        Duration: {video.duration}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <a 
                                  href={video.youtube_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full py-2 px-3 sm:px-4 rounded transition-colors inline-flex items-center justify-center text-sm sm:text-base font-medium"
                                  style={{ backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }}
                                  onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                                >
                                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                  Watch on YouTube
                                </a>
                              </div>
                            ) : (
                              <div className="border rounded-lg p-4 text-center" style={{ backgroundColor: 'hsl(var(--warning) / 0.1)', borderColor: 'hsl(var(--warning) / 0.3)' }}>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: 'hsl(var(--warning) / 0.2)' }}>
                                  <svg className="w-4 h-4" style={{ color: 'hsl(var(--warning))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <p className="text-sm font-medium" style={{ color: 'hsl(var(--warning))' }}>Video Coming Soon</p>
                                <p className="text-xs mt-1" style={{ color: 'hsl(var(--warning))' }}>
                                  This lecture video is currently being processed and will be available shortly.
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        // Only show "Video Coming Soon" for non-admin users when no videos exist
                        !isAdminMode() && (
                          <div className="border rounded-lg p-4 text-center" style={{ backgroundColor: 'hsl(var(--warning) / 0.1)', borderColor: 'hsl(var(--warning) / 0.3)' }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: 'hsl(var(--warning) / 0.2)' }}>
                              <svg className="w-4 h-4" style={{ color: 'hsl(var(--warning))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium" style={{ color: 'hsl(var(--warning))' }}>Video Coming Soon</p>
                            <p className="text-xs mt-1" style={{ color: 'hsl(var(--warning))' }}>
                              Lecture videos are being prepared and will be uploaded soon.
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Admin Video Management Panel */}
      <AdminVideoPanel courseCode={courseCode} />
      
      {/* Admin Panel */}
      {isAdminMode() && (
        <div className="mt-8 rounded-lg p-6" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--card-foreground))' }}>Admin Panel</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              className="px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              Add New Lecture
            </button>
            <button
              className="px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              Add New Handout
            </button>
          </div>
        </div>
      )}
      
      {lectures.length === 0 && (
        <div className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <svg className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(var(--muted))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p>No lectures available for this course yet.</p>
        </div>
      )}
      
      {/* Unlike Modal */}
      {showUnlikeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'hsl(var(--card))' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--card-foreground))' }}>Report an Issue</h3>
            <p className="mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Please let us know what's wrong with this handout so we can improve it:
            </p>
            <textarea
              value={unlikeReason}
              onChange={(e) => setUnlikeReason(e.target.value)}
              placeholder="e.g., PDF is corrupted, content is incorrect, file won't open..."
              className="w-full p-3 border rounded-lg resize-none h-24 focus:ring-2 focus:border-transparent"
              style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
              maxLength={500}
            />
            <div className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {unlikeReason.length}/500 characters
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={() => {
                  setShowUnlikeModal(false);
                  setSelectedHandoutId(null);
                  setUnlikeReason('');
                }}
                className="px-4 py-2 transition-colors order-2 sm:order-1"
                style={{ color: 'hsl(var(--muted-foreground))' }}
                onMouseEnter={(e) => e.target.style.color = 'hsl(var(--foreground))'}
                onMouseLeave={(e) => e.target.style.color = 'hsl(var(--muted-foreground))'}
              >
                Cancel
              </button>
              <button
                onClick={submitUnlike}
                disabled={!unlikeReason.trim()}
                className="px-4 py-2 rounded-lg transition-colors order-1 sm:order-2 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: !unlikeReason.trim() ? 'hsl(var(--muted))' : 'hsl(var(--warning))', 
                  color: !unlikeReason.trim() ? 'hsl(var(--muted-foreground))' : 'hsl(var(--warning-foreground))' 
                }}
                onMouseEnter={(e) => {
                  if (unlikeReason.trim()) {
                    e.target.style.opacity = '0.9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (unlikeReason.trim()) {
                    e.target.style.opacity = '1';
                  }
                }}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LectureSystem;