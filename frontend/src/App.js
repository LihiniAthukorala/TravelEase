import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EditUser from './User/EditUser';
// Import your other components here
// import Home from './Home';
// import Login from './User/Login';
// ... other imports

function App() {
  return (
    <Router>
      <Routes>
        {/* Your existing routes - keep these as they are */}
        {/* <Route path="/" element={<Home />} /> */}
        {/* <Route path="/login" element={<Login />} /> */}
        {/* ... other routes */}

        {/* Make sure this route is not nested within any other route that might prevent it from matching */}
        <Route path="/admin/users/:userId/edit" element={<EditUser />} />
        
        {/* Your other existing routes */}
      </Routes>
    </Router>
  );
}

export default App;