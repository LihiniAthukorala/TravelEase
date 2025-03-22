import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useSnackbar } from "notistack";

const FeedbackCard = ({ feedback }) => {
  const cardStyle = {
    width: "100%",
    maxWidth: "300px", // Smaller card size
    background: "#fff",
    padding: "15px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    textAlign: "left",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  };

  const cardHoverStyle = {
    transform: "scale(1.05)",
    boxShadow: "0 6px 12px rgba(0,0,0,0.2)",
  };

  const titleStyle = {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "8px",
    color: "#333",
  };

  const textStyle = {
    fontSize: "13px",
    color: "#555",
    marginBottom: "4px",
  };

  return (
    <div
      style={cardStyle}
      className="feedback-card"
      onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
      onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardStyle)}
    >
      <div style={titleStyle}>⭐ Feedback from {feedback.name}</div>
      <p style={textStyle}>
        <strong>Email:</strong> {feedback.email}
      </p>
      <p style={textStyle}>
        <strong>Message:</strong> {feedback.message}
      </p>
      <p style={textStyle}>
        <strong>Date:</strong> {new Date(feedback.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
};

const FeedbackView = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/feedback');
        if (response.data && response.data.feedback) {
          setFeedbacks(response.data.feedback);
        }
      } catch (error) {
        console.error('Error fetching feedback:', error);
        setError(error.response?.data?.message || 'Failed to load feedback');
        enqueueSnackbar('Failed to load feedback', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [enqueueSnackbar]);

  const containerStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)", // 3 cards per row
    gap: "25px", // Increased gap between cards
    padding: "30px",
    backgroundColor: "#f9f9f9",
    minHeight: "100vh",
    justifyContent: "center",
    alignItems: "center",
  };

  const headerStyle = {
    textAlign: "center",
    fontSize: "24px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "20px",
  };

  const buttonContainerStyle = {
    display: "flex",
    justifyContent: "flex-end",
    padding: "20px 30px",
  };

  const buttonStyle = {
    padding: "10px 20px",
    backgroundColor: "#4F46E5",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    cursor: "pointer",
    textDecoration: "none",
    transition: "background-color 0.3s ease",
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '1rem'
      }}>
        <p style={{ color: '#EF4444' }}>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            ...buttonStyle,
            backgroundColor: '#3B82F6'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={buttonContainerStyle}>
        <Link to="/feedback" style={buttonStyle}>
          ✍️ Create Feedback
        </Link>
      </div>
      <h2 style={headerStyle}>📝 All Customer Feedback</h2>
      <div style={containerStyle}>
        {feedbacks.length > 0 ? (
          feedbacks.map((feedback) => (
            <FeedbackCard 
              key={feedback._id} 
              feedback={feedback}
            />
          ))
        ) : (
          <div style={{
            textAlign: 'center',
            width: '100%',
            padding: '2rem',
            color: '#666'
          }}>
            No feedback available yet. Be the first to leave feedback!
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackView;
