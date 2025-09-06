"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { isAdminMode, getAdminData } from "./AdminOnlyButton";

const AdminCourseGuidanceManager = ({ courseCode, existingGuidance, onContentUpdated }) => {
  const [adminMode, setAdminMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contentData, setContentData] = useState({
    main_video_title: '',
    main_video_url: '',
    duration: '',
    guidance_points: [{ point: '' }]
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setAdminMode(isAdminMode());
  }, []);

  useEffect(() => {
    if (existingGuidance && isModalOpen) {
      setContentData({
        main_video_title: existingGuidance.main_video_title || '',
        main_video_url: existingGuidance.main_video_url || '',
        duration: existingGuidance.duration || '',
        guidance_points: existingGuidance.guidance_points && existingGuidance.guidance_points.length > 0 
          ? existingGuidance.guidance_points 
          : [{ point: '' }]
      });
    }
  }, [existingGuidance, isModalOpen]);

  // Extract video ID from YouTube URL
  const extractYouTubeId = (url) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/).*[?&]v=|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Validate YouTube URL
  const isValidYouTubeUrl = (url) => {
    if (!url.trim()) return true; // Empty URL is valid (optional)
    return extractYouTubeId(url) !== null;
  };

  // Format duration (e.g., "10:30" or "1:05:30")
  const formatDuration = (duration) => {
    if (!duration.trim()) return true; // Empty duration is valid (optional)
    const regex = /^(?:(\d+):)?(\d{1,2}):(\d{2})$/;
    return regex.test(duration);
  };

  const handleAddGuidancePoint = () => {
    setContentData({
      ...contentData,
      guidance_points: [...contentData.guidance_points, { point: '' }]
    });
  };

  const handleRemoveGuidancePoint = (index) => {
    if (contentData.guidance_points.length > 1) {
      const newPoints = contentData.guidance_points.filter((_, i) => i !== index);
      setContentData({ ...contentData, guidance_points: newPoints });
    }
  };

  const handleGuidancePointChange = (index, value) => {
    const newPoints = [...contentData.guidance_points];
    newPoints[index] = { point: value };
    setContentData({ ...contentData, guidance_points: newPoints });
  };

  const handleSaveContent = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!contentData.main_video_title.trim()) {
      setMessage('Please enter a video title');
      return;
    }

    if (contentData.main_video_url && !isValidYouTubeUrl(contentData.main_video_url)) {
      setMessage('Please enter a valid YouTube URL or leave it empty');
      return;
    }

    if (contentData.duration && !formatDuration(contentData.duration)) {
      setMessage('Duration format should be MM:SS or HH:MM:SS (e.g., 10:30 or 1:05:30)');
      return;
    }

    // Filter out empty guidance points
    const validGuidancePoints = contentData.guidance_points.filter(point => point.point.trim());

    if (validGuidancePoints.length === 0) {
      setMessage('Please add at least one guidance point');
      return;
    }

    setLoading(true);

    try {
      const adminData = getAdminData();
      const videoId = extractYouTubeId(contentData.main_video_url);
      
      const dataToSave = {
        course_code: courseCode,
        main_video_title: contentData.main_video_title.trim(),
        main_video_url: contentData.main_video_url.trim() || null,
        youtube_video_id: videoId,
        duration: contentData.duration.trim() || null,
        guidance_points: validGuidancePoints,
        updated_by: adminData?.user_id || null
      };

      let result;
      if (existingGuidance) {
        // Update existing guidance
        result = await supabase
          .from('course_guidance')
          .update(dataToSave)
          .eq('course_code', courseCode)
          .select();
      } else {
        // Insert new guidance
        result = await supabase
          .from('course_guidance')
          .insert({
            ...dataToSave,
            created_by: adminData?.user_id || null
          })
          .select();
      }

      if (result.error) throw result.error;

      setMessage(existingGuidance ? 'Content updated successfully!' : 'Content added successfully!');
      
      // Close modal after success
      setTimeout(() => {
        setIsModalOpen(false);
        setMessage('');
      }, 1500);
      
      // Notify parent component
      if (onContentUpdated) {
        onContentUpdated(result.data[0]);
      }

    } catch (error) {
      console.error('Error saving content:', error);
      setMessage('Error saving content: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setContentData({
      main_video_title: '',
      main_video_url: '',
      duration: '',
      guidance_points: [{ point: '' }]
    });
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

  const buttonText = existingGuidance ? 'Update Content' : 'Add Content';
  const modalTitle = existingGuidance ? 'Update Course Guidance' : 'Add Course Guidance';

  return (
    <>
      {/* Add/Update Content Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {existingGuidance ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          )}
        </svg>
        {buttonText}
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleModalClick}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{modalTitle}</h3>
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
            <form onSubmit={handleSaveContent} className="p-6 space-y-6">
              {/* Video Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Title *
                </label>
                <input
                  type="text"
                  value={contentData.main_video_title}
                  onChange={(e) => setContentData({ ...contentData, main_video_title: e.target.value })}
                  placeholder="e.g., How to Attempt this Course"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              {/* YouTube URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube URL (Optional)
                </label>
                <input
                  type="url"
                  value={contentData.main_video_url}
                  onChange={(e) => setContentData({ ...contentData, main_video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supports YouTube URLs (public, unlisted, or private). Leave empty if no video.
                </p>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Optional)
                </label>
                <input
                  type="text"
                  value={contentData.duration}
                  onChange={(e) => setContentData({ ...contentData, duration: e.target.value })}
                  placeholder="10:30 or 1:05:30"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Format: MM:SS or HH:MM:SS (e.g., 10:30 or 1:05:30)
                </p>
              </div>

              {/* Guidance Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Guidelines *
                </label>
                <div className="space-y-3">
                  {contentData.guidance_points.map((point, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-2">
                        <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={point.point}
                          onChange={(e) => handleGuidancePointChange(index, e.target.value)}
                          placeholder={`Enter guidance point ${index + 1}...`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 resize-none"
                          rows="2"
                        />
                      </div>
                      {contentData.guidance_points.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveGuidancePoint(index)}
                          className="text-red-500 hover:text-red-700 mt-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddGuidancePoint}
                  className="mt-3 inline-flex items-center px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Another Point
                </button>
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
                      {existingGuidance ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    buttonText
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

export default AdminCourseGuidanceManager;