import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './components/Home';
import Login from './User/Login';
import Register from './User/Register';
import UserDashboard from './User/UserDashboard';
import AdminDashboard from './User/AdminDashboard';
import AdminUsers from './User/AdminUsers';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import PaymentCart from './pages/payment/PaymentCart';
import Feedback from './pages/feedback/feedback';
import Managefeedback from './pages/feedback/managefeedback';
import Feedbackview from './pages/feedback/feedbackview';
import UpdateProfile from './User/UpdateProfile';
import AdminUpdateProfile from './User/AdminUpdateProfile';
import PendingApproval from './pages/payment/PendingApproval';
import PaymentApproval from './pages/admin/PaymentApproval';
import PaymentDetails from './pages/admin/PaymentDetails';
import UserPaymentHistory from './pages/payment/UserPaymentHistory';
import EditPayment from './pages/payment/EditPayment';
// Import Event Components
import CreateEvent from './Events/CreateEvent';
import MyEvents from './Events/MyEvents';
import AdminEvents from './Events/AdminEvents';
import EventDetail from './Events/EventDetail';
import BrowseEvents from './Events/BrowseEvents';
import EventRegistration from './Events/EventRegistration';
import UpdateFeedback from './pages/feedback/UpdateFeedback';
import UserFeedbackView from './pages/feedback/UserFeedbackView';
import EditEvent from './Events/EditEvent';

const App = () => {
  const location = useLocation();
  const hideHeader = ['/admin-dashboard', '/admin/events', '/admin/users', '/admin/approvals'].includes(location.pathname);

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        {!hideHeader && <Header />}
        <main className="flex-grow">
          <Routes>
            {/* Public routes */}
            <Route path='/' element={<Home />} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/payment' element={<PaymentCart />} />
            <Route path='/pending-approval' element={<PendingApproval />} />
            <Route path='/events' element={<BrowseEvents />} />
            <Route path='/events/:id' element={<EventDetail />} />
            <Route path='/feedback' element={<Feedback />} />
            <Route path='/managefeedback' element={<Managefeedback />} />
            <Route path='/feedbackview' element={<Feedbackview />} />
            <Route path='/update-feedback' element={<UpdateFeedback />} />
            <Route path='/user-feedback' element={<UserFeedbackView />} />

            {/* User routes */}
            <Route element={<ProtectedRoute />}>
              <Route path='/dashboard' element={<UserDashboard />} />
              <Route path='/update-profile' element={<UpdateProfile />} />
              <Route path='/create-event' element={<CreateEvent />} />
              <Route path='/my-events' element={<MyEvents />} />
              <Route path='/events/:id/edit' element={<EditEvent />} />
              <Route path="/events/:id/register" element={<EventRegistration />} />
              <Route path="/payments/history" element={<UserPaymentHistory />} />
              <Route path="/payments/:paymentId/edit" element={<EditPayment />} />
            </Route>
            
            {/* Admin routes */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path='/admin-dashboard' element={<AdminDashboard />} />
              <Route path='/admin/users' element={<AdminUsers />} />
              <Route path='/admin/events' element={<AdminEvents />} />
              <Route path='/admin/approvals' element={<AdminEvents />} />
              <Route path='/admin/payment-approvals' element={<PaymentApproval />} />
              <Route path='/admin/payments/:id' element={<PaymentDetails />} />
              <Route path='/admin/profile' element={<AdminUpdateProfile />} />
              <Route path='/admin/events/:id' element={<EventDetail />} />
            </Route>
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
};

export default App;


