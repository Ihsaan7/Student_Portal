"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { isAdminMode, getAdminData } from "./AdminOnlyButton";

const AdminVideoManager = ({ lectureId, courseCode, onVideoAdded, hasExistingVideos = false }) => {
  const [adminMode, setAdminMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoData, setVideoData] = useState({
    title: '',
    youtube_url: '',
    duration: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setAdminMode(isAdminMode());
  }, []);

  // Extract video ID from YouTube URL
  const extractYouTubeId = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/).*[?&]v=|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Validate YouTube URL
  const isValidYouTubeUrl = (url) => {
    return extractYouTubeId(url) !== null;
  };

  // Format duration (e.g., "10:30" or "1:05:30")
  const formatDuration = (duration) => {
    const regex = /^(?:(\d+):)?(\d{1,2}):(\d{2})$/;
    return regex.test(duration);
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!videoData.title.trim()) {
      setMessage('Please enter a video title');
      return;
    }

    if (!isValidYouTubeUrl(videoData.youtube_url)) {
      setMessage('Please enter a valid YouTube URL');
      return;
    }

    if (videoData.duration && !formatDuration(videoData.duration)) {
      setMessage('Duration format should be MM:SS or HH:MM:SS (e.g., 10:30 or 1:05:30)');
      return;
    }

    setLoading(true);

    try {
      const adminData = getAdminData();
      const videoId = extractYouTubeId(videoData.youtube_url);
      
      const { data, error } = await supabase
        .from('lecture_videos')
        .insert({
          lecture_id: lectureId,
          title: videoData.title.trim(),
          youtube_url: videoData.youtube_url.trim(),
          youtube_video_id: videoId,
          duration: videoData.duration.trim() || null,
          is_available: true,
          added_by: adminData?.user_id || null
        })
        .select();

      if (error) throw error;

      setMessage('Video added successfully!');
      setVideoData({ title: '', youtube_url: '', duration: '' });
      
      // Close modal after success
      setTimeout(() => {
        setIsModalOpen(false);
        setMessage('');
      }, 1500);
      
      // Notify parent component
      if (onVideoAdded) {
        onVideoAdded(data);
      }

    } catch (error) {
      console.error('Error adding video:', error);
      setMessage('Error adding video: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setVideoData({ title: '', youtube_url: '', duration: '' });
    setMessage('');
  };

  const handleModalClick = (e) => {
    // Close modal if clicking on backdrop
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!adminMode) {
    return null;
  }

  return (
    <>
      {/* Add Video Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        {hasExistingVideos ? 'Add Another Video' : 'Add Video'}
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleModalClick}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{hasExistingVideos ? 'Add Another Video to Lecture' : 'Add Video to Lecture'}</h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddVideo} className="p-6 space-y-4">
              {/* Video Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Title *
                </label>
                <input
                  type="text"
                  value={videoData.title}
                  onChange={(e) => setVideoData({ ...videoData, title: e.target.value })}
                  placeholder="Enter video title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              {/* YouTube URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube URL *
                </label>
                <input
                  type="url"
                  value={videoData.youtube_url}
                  onChange={(e) => setVideoData({ ...videoData, youtube_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supports YouTube URLs (public, unlisted, or private)
                </p>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Optional)
                </label>
                <input
                  type="text"
                  value={videoData.duration}
                  onChange={(e) => setVideoData({ ...videoData, duration: e.target.value })}
                  placeholder="10:30 or 1:05:30"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Format: MM:SS or HH:MM:SS (e.g., 10:30 or 1:05:30)
                </p>
              </div>

              {/* Message */}
              {message && (
                <div className={`p-3 rounded-md text-sm ${
                  message.includes('Error') 
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {message}
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    'Add Video'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminVideoManager;