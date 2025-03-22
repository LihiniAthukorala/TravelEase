import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';

const UserFeedbackView = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchUserFeedback = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const userResponse = await axios.get('http://localhost:5001/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const feedbackResponse = await axios.get('http://localhost:5001/api/feedback', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Filter feedback for current user
        const userFeedback = feedbackResponse.data.feedback.filter(
          f => f.email === userResponse.data.user.email
        );
        setFeedbacks(userFeedback);
      } catch (error) {
        console.error('Error fetching feedback:', error);
        setError(error.response?.data?.message || 'Failed to load feedback');
        enqueueSnackbar('Failed to load feedback', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserFeedback();
  }, [navigate, enqueueSnackbar]);

  const handleDelete = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/feedback/${feedbackId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFeedbacks(feedbacks.filter(f => f._id !== feedbackId));
      enqueueSnackbar('Feedback deleted successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to delete feedback', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Feedback</h1>
          <Link
            to="/feedback"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add New Feedback
          </Link>
        </div>

        {feedbacks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">You haven't submitted any feedback yet.</p>
            <Link 
              to="/feedback"
              className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Submit Your First Feedback
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {feedbacks.map((feedback) => (
              <div 
                key={feedback._id} 
                className="bg-white rounded-lg shadow p-6 transition-transform hover:scale-105"
              >
                <h3 className="text-lg font-medium mb-2">{feedback.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{feedback.email}</p>
                <p className="text-gray-800 mb-4">{feedback.message}</p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => navigate('/update-feedback', { 
                      state: { feedbackToEdit: feedback }
                    })}
                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(feedback._id)}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8 text-center">
          <Link
            to="/dashboard"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserFeedbackView;
