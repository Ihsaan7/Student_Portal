"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { isAdminMode, getAdminData } from "./AdminOnlyButton";
import AdminVideoManager from "./AdminVideoManager";

const AdminVideoPanel = ({ courseCode }) => {
  const [adminMode, setAdminMode] = useState(false);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingVideo, setEditingVideo] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const isAdmin = isAdminMode();
    setAdminMode(isAdmin);
    if (isAdmin) {
      fetchLecturesWithVideos();
    }
  }, [courseCode]);

  const fetchLecturesWithVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lectures')
        .select(`
          *,
          videos:lecture_videos(*)
        `)
        .eq('course_code', courseCode)
        .order('lecture_number');

      if (error) throw error;
      setLectures(data || []);
    } catch (error) {
      console.error('Error fetching lectures:', error);
      setMessage('Error loading lectures: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const { error } = await supabase
        .from('lecture_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      setMessage('Video deleted successfully!');
      fetchLecturesWithVideos();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting video:', error);
      setMessage('Error deleting video: ' + error.message);
    }
  };

  const handleEditVideo = async (videoId, updatedData) => {
    try {
      const { error } = await supabase
        .from('lecture_videos')
        .update({
          title: updatedData.title,
          youtube_url: updatedData.youtube_url,
          youtube_video_id: updatedData.youtube_video_id,
          duration: updatedData.duration,
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId);

      if (error) throw error;

      setMessage('Video updated successfully!');
      setEditingVideo(null);
      fetchLecturesWithVideos();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating video:', error);
      setMessage('Error updating video: ' + error.message);
    }
  };

  const extractYouTubeId = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  if (!adminMode) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div>
          <span className="text-purple-700">Loading video management panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-purple-900 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Admin Video Management - {courseCode}
        </h3>
        <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded">
          {lectures.reduce((total, lecture) => total + (lecture.videos?.length || 0), 0)} videos total
        </span>
      </div>

      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.includes('Error') 
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        {lectures.map((lecture) => (
          <div key={lecture.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">
                Lecture {lecture.lecture_number}: {lecture.title}
              </h4>
              <AdminVideoManager 
                lectureId={lecture.id} 
                courseCode={courseCode}
                onVideoAdded={fetchLecturesWithVideos}
                hasExistingVideos={lecture.videos && lecture.videos.length > 0}
              />
            </div>

            {lecture.videos && lecture.videos.length > 0 ? (
              <div className="space-y-3">
                {lecture.videos.map((video) => (
                  <div key={video.id} className="bg-gray-50 rounded-lg p-3">
                    {editingVideo === video.id ? (
                      <EditVideoForm 
                        video={video}
                        onSave={(updatedData) => handleEditVideo(video.id, updatedData)}
                        onCancel={() => setEditingVideo(null)}
                        extractYouTubeId={extractYouTubeId}
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{video.title}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                {video.duration && <span>Duration: {video.duration}</span>}
                                <a 
                                  href={video.youtube_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  View on YouTube
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingVideo(video.id)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit video"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete video"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No videos added yet</p>
            )}
          </div>
        ))}
      </div>

      {lectures.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p>No lectures found for {courseCode}</p>
        </div>
      )}
    </div>
  );
};

// Edit Video Form Component
const EditVideoForm = ({ video, onSave, onCancel, extractYouTubeId }) => {
  const [formData, setFormData] = useState({
    title: video.title || '',
    youtube_url: video.youtube_url || '',
    duration: video.duration || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidYouTubeUrl = (url) => {
    return extractYouTubeId(url) !== null;
  };

  const formatDuration = (duration) => {
    const regex = /^(?:(\d+):)?(\d{1,2}):(\d{2})$/;
    return regex.test(duration);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Please enter a video title');
      return;
    }

    if (!isValidYouTubeUrl(formData.youtube_url)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    if (formData.duration && !formatDuration(formData.duration)) {
      setError('Duration format should be MM:SS or HH:MM:SS (e.g., 10:30 or 1:05:30)');
      return;
    }

    setLoading(true);
    const videoId = extractYouTubeId(formData.youtube_url);
    
    await onSave({
      ...formData,
      title: formData.title.trim(),
      youtube_url: formData.youtube_url.trim(),
      youtube_video_id: videoId,
      duration: formData.duration.trim() || null
    });
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Video Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          YouTube URL *
        </label>
        <input
          type="url"
          value={formData.youtube_url}
          onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Duration (Optional)
        </label>
        <input
          type="text"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          placeholder="10:30 or 1:05:30"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      {error && (
        <div className="p-2 bg-red-50 text-red-700 border border-red-200 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default AdminVideoPanel;