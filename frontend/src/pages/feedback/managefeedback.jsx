import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSnackbar } from "notistack";

const ManageFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get("http://localhost:5001/api/feedback", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFeedbacks(response.data.feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      enqueueSnackbar("Failed to load feedback", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5001/api/feedback/${feedbackId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFeedbacks((prev) => prev.filter((f) => f._id !== feedbackId));
      enqueueSnackbar("Feedback deleted successfully!", { variant: "success" });
    } catch (error) {
      console.error("Error deleting feedback:", error);
      enqueueSnackbar("Failed to delete feedback", { variant: "error" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    enqueueSnackbar("Logged out successfully", { variant: "success" });
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white">
        <div className="p-6">
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <p className="text-gray-400 text-sm">Event Management System</p>
        </div>
        <nav className="mt-5">
          <Link to="/admin-dashboard" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100">
            <span className="ml-3">Dashboard</span>
          </Link>
          <Link to="/admin/users" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100">
            <span className="ml-3">Users</span>
          </Link>
          <Link to="/admin/events" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100">
            <span className="ml-3">Events</span>
          </Link>
          <Link to="/admin/payment-approvals" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100">
                                <span className="ml-3">Payment Approvals</span>
                              </Link>
           <Link to="/managefeedback" className="flex items-center px-6 py-3 bg-gray-800 text-gray-100">
                      <span className="ml-3">Feedback Manage</span>
                    </Link>
          
          <button onClick={handleLogout} className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100 w-full text-left">
            <span className="ml-3">Logout</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Feedback</h1>
        </div>

        {/* Feedback List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feedbacks.length > 0 ? (
                feedbacks.map((feedback) => (
                  <tr key={feedback._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{feedback.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{feedback.email}</td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs overflow-hidden overflow-ellipsis">
                        {feedback.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => handleDeleteFeedback(feedback._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No feedback found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageFeedback;
