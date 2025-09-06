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

  useEffect(() => {
    fetchLectures();
    fetchUserLikes();
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
      if (data) {
        newUserLikes.add(handoutId);
      } else {
        newUserLikes.delete(handoutId);
      }
      setUserLikes(newUserLikes);

      // Refresh lectures to get updated like counts
      fetchLectures();
    } catch (err) {
      console.error('Error toggling like:', err);
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

  const openPDF = (fileUrl) => {
    window.open(fileUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-red-600 text-center">
          <p>{error}</p>
          <button 
            onClick={fetchLectures}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Course Lectures</h2>
      
      <div className="space-y-4">
        {lectures.map((lecture) => (
          <div key={lecture.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Lecture Header */}
            <div 
              className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setExpandedLecture(expandedLecture === lecture.id ? null : lecture.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-2 py-1 rounded whitespace-nowrap">
                    Lecture {lecture.lecture_number}
                  </span>
                  <h3 className="font-medium text-gray-900 break-words">{lecture.title}</h3>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {lecture.handouts?.filter(h => h.is_approved).length || 0} handouts
                  </span>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedLecture === lecture.id ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {lecture.description && (
                <p className="text-sm text-gray-600 mt-2 break-words">{lecture.description}</p>
              )}
            </div>

            {/* Lecture Content */}
            {expandedLecture === lecture.id && (
              <div className="p-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Handouts Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Handouts
                      </h4>
                      {lecture.handouts?.filter(handout => handout.is_approved).length === 0 && (
                        <label className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-700">
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
                            <div key={handout.id} className="flex items-start flex-col p-3 bg-gray-50 rounded-lg gap-3">
                              <div className="flex items-start space-x-3 flex-1 min-w-0">
                                <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1 w-40">
                                  <p className="text-sm font-medium text-gray-900 break-words">{handout.title}</p>
                                  <p className="text-xs text-gray-500 mt-2">
                                    {(handout.file_size / 1024 / 1024).toFixed(1)} MB
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start space-x-2 flex-shrink-0">
                                <button
                                  onClick={() => toggleLike(handout.id)}
                                  className={`flex items-center  px-2 py-1 rounded text-sm whitespace-nowrap ${
                                    userLikes.has(handout.id)
                                      ? 'bg-red-100 text-red-600'
                                      : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                                  } transition-colors`}
                                >
                                  <svg className="w-4 h-4" fill={userLikes.has(handout.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  <span>{handout.like_count}</span>
                                </button>
                                <button
                                  onClick={() => openPDF(handout.file_url)}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors whitespace-nowrap"
                                >
                                  Open PDF
                                </button>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm">No handouts available</p>
                          <p className="text-xs text-gray-400 mt-1">Upload your own materials for approval</p>
                        </div>
                      )}
                      
                      {uploadingFile === lecture.id && (
                        <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          <span className="text-sm text-blue-600">Uploading...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Videos Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 break-words">{video.title}</p>
                                    {video.duration && (
                                      <p className="text-sm text-gray-500">
                                        Duration: {video.duration}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <a 
                                  href={video.youtube_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors inline-flex items-center justify-center"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                  Watch on YouTube
                                </a>
                              </div>
                            ) : (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <p className="text-sm font-medium text-yellow-800">Video Coming Soon</p>
                                <p className="text-xs text-yellow-600 mt-1">
                                  This lecture video is currently being processed and will be available shortly.
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        // Only show "Video Coming Soon" for non-admin users when no videos exist
                        !isAdminMode() && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-yellow-800">Video Coming Soon</p>
                            <p className="text-xs text-yellow-600 mt-1">
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
      
      {lectures.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p>No lectures available for this course yet.</p>
        </div>
      )}
    </div>
  );
};

export default LectureSystem;