import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';

const UpdateFeedback = () => {
  const [feedback, setFeedback] = useState({
    name: '',
    email: '',
    message: ''
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.feedbackToEdit) {
      setFeedback(location.state.feedbackToEdit);
    } else {
      navigate('/feedbackview');
    }
  }, [location.state, navigate]);

  const handleChange = (e) => {
    setFeedback({ ...feedback, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5001/api/feedback/${feedback._id}`, feedback, {
        headers: { Authorization: `Bearer ${token}` }
      });

      enqueueSnackbar('Feedback updated successfully!', { variant: 'success' });
      navigate('/feedbackview');
    } catch (error) {
      console.error('Update error:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to update feedback', { 
        variant: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const pageStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f4f4f4',
    padding: '20px'
  };

  const formStyle = {
    width: '100%',
    maxWidth: '500px',
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem'
  };

  const buttonStyle = {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#4F46E5',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginRight: '1rem'
  };

  return (
    <div style={pageStyle}>
      <div style={formStyle}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
          Update Feedback
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={feedback.name}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={feedback.email}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label htmlFor="message" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={feedback.message}
              onChange={handleChange}
              style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
              required
            />
          </div>

          <div style={{ display: 'flex', marginTop: '1.5rem' }}>
            <button
              type="submit"
              style={buttonStyle}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Feedback'}
            </button>
            <button
              type="button"
              style={{ ...buttonStyle, backgroundColor: '#6B7280' }}
              onClick={() => navigate('/feedbackview')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateFeedback;
