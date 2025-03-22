import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Users from "./pages/Users";
import Products from "./pages/Products";
import Carts from "./pages/Carts";
import Rentals from "./pages/Rentals";
import ProductPage from "./pages/ProductPage";
import AddToCartPage from "./pages/AddToCartPage";
import LoginPage from "./pages/LoginPage";
import CartPage from "./pages/CartPage";
import RentalPage from "./pages/RentalPage";
import RentItemForm from "./pages/RentItemForm";
import RentedItemsPage from "./pages/RentedItemsPage";
import TravelPackages from "./pages/TravelPackages ";
import PaymentPage from "./pages/paymentPage";
import CreateTravelPackage from "./pages/CreateTravelPackage";
import TravelPackageDetails from "./pages/TravelPackageDetails";
import RegisterPage from "./pages/RegisterPage";
import TravelPackageView from "./pages/TravelPackageView";
import Navbar from "./components/Navbar";
import ProfilePage from "./pages/ProfilePage";
import AdminBookingPage from "./pages/AdminBookingPage";
import BookingPage from "./pages/BookingPage";

// This component will conditionally render the Navbar
const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";
  const isRegisterPage = location.pathname === "/register";
  const isUserPage = location.pathname === "/users";
  const isCartsPage = location.pathname === "/carts";
  const isRentalPage = location.pathname === "/rentals";
  const isProductPage = location.pathname === "/products";
  const isAdminBookingPage = location.pathname === "/adminbooking";

  return (
    <>
      {/* Only render Navbar if not on login page */}
      {!isLoginPage &&
        !isCartsPage &&
        !isRentalPage &&
        !isProductPage &&
        !isRegisterPage &&
        !isAdminBookingPage &&
        !isUserPage && <Navbar />}
      <Routes>
        <Route path="/users" element={<Users />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/products" element={<Products />} />
        <Route path="/carts" element={<Carts />} />
        <Route path="/rentals" element={<Rentals />} />
        <Route path="/userproducts" element={<ProductPage />} />
        <Route path="/addtocart" element={<AddToCartPage />} />
        <Route path="/" element={<LoginPage />} />
        <Route path="/usercart" element={<CartPage />} />
        <Route path="/userrental" element={<RentalPage />} />
        <Route path="/rentform" element={<RentItemForm />} />
        <Route path="/rentcheckout" element={<RentedItemsPage />} />
        <Route path="/travelPackages" element={<TravelPackages />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/adminbooking" element={<AdminBookingPage />} />
        <Route
          path="/travelPackages/Create"
          element={<CreateTravelPackage />}
        />
        <Route path="/travelPackages/:id" element={<TravelPackageDetails />} />
        <Route path="/travelPackagesview/:id" element={<TravelPackageView />} />
        <Route path="/bookings/:id" element={<BookingPage />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
