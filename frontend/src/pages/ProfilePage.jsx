import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [existingPassword, setExistingPassword] = useState("");
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/users/users/${userId}`
        );
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    if (userId) {
      fetchUserProfile();
    } else {
      navigate("/login"); // Redirect to login if userId is not found
    }
  }, [userId, navigate]);

  // Handle password change
  const handleChangePassword = async () => {
    if (!newPassword || !existingPassword) {
      alert("Please enter both existing and new passwords.");
      return;
    }

    // Verify the existing password
    try {
      const response = await axios.post(
        `http://localhost:3000/api/users/users/verify-password/${userId}`,
        { password: existingPassword }
      );

      if (response.data.isValid) {
        // Update to the new password
        await axios.put(`http://localhost:3000/api/users/users/${userId}`, {
          password: newPassword,
        });
        alert("Password updated successfully!");
        setIsEditingPassword(false); // Hide password edit form after update
      } else {
        setPasswordError("Existing password is incorrect.");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Failed to update password.");
    }
  };

  // Handle form submission for profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.put(
        `http://localhost:3000/api/users/users/${userId}`,
        {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        }
      );
      alert("Profile updated successfully!");
      setUser(response.data);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center">
      <div className="bg-gray-50 w-1/2 py-10 px-5 relative">
        <div className="flex items-center justify-center">
          <h1 className="text-3xl font-semibold text-center text-gray-700 mb-8">
            User Profile
          </h1>
        </div>

        {user ? (
          <div className="bg-white shadow-lg rounded-lg p-6">
            {/* Profile Picture */}
            <div className="flex items-center space-x-4">
              <img
                src={
                  user.profilePicture ||
                  "data:image/png;base64,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"
                }
                alt="Profile"
                className="w-20 h-20 rounded-full"
              />
              <div>
                <h2 className="text-xl font-semibold">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-500">{user.email}</p>
              </div>
            </div>

            {/* Profile Update Form */}
            <form onSubmit={handleUpdateProfile} className="mt-6">
              <div className="space-y-4">
                <input
                  type="text"
                  value={user.firstName}
                  onChange={(e) =>
                    setUser({ ...user, firstName: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="First Name"
                />
                <input
                  type="text"
                  value={user.lastName}
                  onChange={(e) =>
                    setUser({ ...user, lastName: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Last Name"
                />
                <input
                  type="email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Email"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 mt-4 rounded"
              >
                Update Profile
              </button>
            </form>

            {/* Change Password Section */}
            <div className="mt-6">
              <button
                onClick={() => setIsEditingPassword(!isEditingPassword)}
                className="text-blue-500"
              >
                {isEditingPassword ? "Cancel" : "Change Password"}
              </button>

              {isEditingPassword && (
                <div className="mt-4">
                  <div className="space-y-4">
                    <input
                      type="password"
                      value={existingPassword}
                      onChange={(e) => setExistingPassword(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Existing Password"
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="New Password"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    className="w-full bg-green-500 text-white py-2 mt-4 rounded"
                  >
                    Update Password
                  </button>
                  {passwordError && (
                    <p className="text-red-500 mt-2">{passwordError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
