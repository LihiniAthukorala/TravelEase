import React, { useState } from "react";
import axios from "axios";
import { useSnackbar } from "notistack";

const Feedback = () => {
  const [feedback, setFeedback] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    message: "",
  });

  const { enqueueSnackbar } = useSnackbar();

  const validateForm = () => {
    let tempErrors = {};
    let isValid = true;

    // Name validation
    if (!feedback.name.trim()) {
      tempErrors.name = "Name is required";
      isValid = false;
    } else if (feedback.name.length < 2) {
      tempErrors.name = "Name must be at least 2 characters long";
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!feedback.email) {
      tempErrors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(feedback.email)) {
      tempErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    // Message validation
    if (!feedback.message.trim()) {
      tempErrors.message = "Message is required";
      isValid = false;
    } else if (feedback.message.length < 10) {
      tempErrors.message = "Message must be at least 10 characters long";
      isValid = false;
    } else if (feedback.message.length > 500) {
      tempErrors.message = "Message cannot exceed 500 characters";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFeedback({ ...feedback, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      enqueueSnackbar('Please fix the errors in the form', { variant: 'error' });
      return;
    }

    try {
      await axios.post('http://localhost:5001/api/feedback', feedback);
      enqueueSnackbar('Feedback submitted successfully!', { variant: 'success' });
      setFeedback({ name: "", email: "", message: "" });
    } catch (error) {
      enqueueSnackbar('Failed to submit feedback', { variant: 'error' });
    }
  };

  const pageStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f4f4f4",
  };

  const formStyle = {
    width: "100%",
    maxWidth: "400px",
    background: "#fff",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    textAlign: "center",
  };

  const labelStyle = {
    display: "block",
    textAlign: "left",
    fontWeight: "bold",
    marginBottom: "5px",
    fontSize: "14px",
    color: "#333",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: "15px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
  };

  const textareaStyle = {
    ...inputStyle,
    height: "100px",
    resize: "none",
  };

  const buttonStyle = {
    width: "100%",
    padding: "12px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    transition: "background 0.3s",
  };

  const buttonHoverStyle = {
    backgroundColor: "#0056b3",
  };

  const errorStyle = {
    color: "#dc2626",
    fontSize: "12px",
    marginTop: "-10px",
    marginBottom: "10px",
    textAlign: "left",
  };

  return (
    <div style={pageStyle}>
      <form style={formStyle} onSubmit={handleSubmit}>
        <h2 style={{ marginBottom: "15px", color: "#333" }}>Feedback Form</h2>

        <label style={labelStyle} htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          value={feedback.name}
          onChange={handleChange}
          style={inputStyle}
          required
        />
        {errors.name && <div style={errorStyle}>{errors.name}</div>}

        <label style={labelStyle} htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          value={feedback.email}
          onChange={handleChange}
          style={inputStyle}
          required
        />
        {errors.email && <div style={errorStyle}>{errors.email}</div>}

        <label style={labelStyle} htmlFor="message">Message:</label>
        <textarea
          id="message"
          name="message"
          value={feedback.message}
          onChange={handleChange}
          style={textareaStyle}
          required
        />
        {errors.message && <div style={errorStyle}>{errors.message}</div>}

        <button
          type="submit"
          style={{ ...buttonStyle }}
          onMouseOver={(e) => (e.target.style.background = buttonHoverStyle.backgroundColor)}
          onMouseOut={(e) => (e.target.style.background = buttonStyle.backgroundColor)}
        >
          Submit Feedback
        </button>
      </form>
    </div>
  );
};

export default Feedback;
