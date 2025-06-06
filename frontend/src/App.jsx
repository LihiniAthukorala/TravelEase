import React from 'react';
import { Routes, Route, useLocation, BrowserRouter as Router } from 'react-router-dom';
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
import ManageTour from './pages/admin/ManageTour';
import CreateTour from './pages/admin/CreateTour';

import AdminOrders from './pages/admin/AdminOrders'; // Add this import
import StockTracking from './pages/admin/StockTracking'; // Add this import
import InventoryReports from './pages/admin/InventoryReports'; // Add this import

// Import new components
import CampingEquipment from './pages/CampingEquipment';
import CampingEquipmentDetail from './pages/CampingEquipmentDetail';
import ManageCampingEquipment from './pages/admin/ManageCampingEquipment';
import RentalCheckoutPage from './pages/cart/RentalCheckoutPage';
import TourDetails from './pages/TourDetails';

// Import CartProvider and CartPage
import { CartProvider } from './context/CartContext';
import CartPage from './pages/cart/CartPage';

// Add this import at the top with other imports
import EditTour from './pages/admin/EditTour';
import AllBookings from './pages/admin/AllBookings';

import TourPaymentPage from './pages/tours/TourPaymentPage';

// Add this import at the top with other imports
import BookingDetails from './pages/admin/BookingDetails';

// Add these imports at the top with other imports
import UserBookings from './pages/user/UserBookings';
import UserOrders from './pages/user/UserOrders';

import ManageSuppliers from './pages/admin/ManageSuppliers';

import EditUser from './User/EditUser';

const App = () => {
  const location = useLocation();
  const hideHeader = ['/admin-dashboard', '/admin/events', '/admin/users', '/admin/approvals'].includes(location.pathname);

  return (
    <AuthProvider>
      <CartProvider>
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

              {/* Camping Equipment Routes */}
              <Route path="/camping-equipment" element={<CampingEquipment />} />
              <Route path="/camping-equipment/:id" element={<CampingEquipmentDetail />} />

              {/* Cart Routes */}
              <Route path="/cart" element={<CartPage />} />
              <Route path="/rental-checkout" element={<RentalCheckoutPage />} />

              <Route path="/tour-details/:id" element={<TourDetails />} /> {/* Move this here */}

              {/* Tour Routes */}
              <Route path="/tours" element={<TourDetails />} />
              <Route path="/tours/:id" element={<TourDetails />} />
              <Route path="/tour-payment" element={<TourPaymentPage />} />

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
                {/* Add new user routes */}
                <Route path="/user/bookings" element={<UserBookings />} />
                <Route path="/user/orders" element={<UserOrders />} />
              </Route>
              <Route path='/admin/manage-tour' element={<ManageTour />} />
              <Route path='/admin/create-tour' element={<CreateTour />} />
              {/* Admin routes */}
              <Route element={<ProtectedRoute adminOnly={true} />}>
                <Route path='/admin-dashboard' element={<AdminDashboard />} />
                <Route path='/admin/users' element={<AdminUsers />} />
                <Route path='/admin/events' element={<AdminEvents />} />
                <Route path='/admin/approvals' element={<AdminEvents />} />
                <Route path='/admin/payment-approvals' element={<PaymentApproval />} />
                <Route path='/admin/payments/:id' element={<PaymentDetails />} />
                <Route path='/admin/bookings/:id' element={<BookingDetails />} />
                <Route path='/admin/all-bookings' element={<AllBookings />} />
                <Route path='/admin/profile' element={<AdminUpdateProfile />} />
                <Route path='/admin/events/:id' element={<EventDetail />} />
                <Route path="/admin/camping-equipment" element={<ManageCampingEquipment />} />
                <Route path="/admin/orders" element={<AdminOrders />} /> {/* Add this route for orders */}
                <Route path="/admin/stock-tracking" element={<StockTracking />} /> {/* Add this route */}
                <Route path='/admin/edit-tour/:id' element={<EditTour />} />
                <Route path='/admin/all-bookings' element={<AllBookings />} />
                <Route path='/admin/manage-suppliers' element={<ManageSuppliers />} />
                <Route path="/admin/inventory-reports" element={<InventoryReports />} /> {/* Add this route */}
                <Route path="/admin/users/:userId/edit" element={<EditUser />} />
              </Route>
               
              
            </Routes>
          </main>
        </div>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;


