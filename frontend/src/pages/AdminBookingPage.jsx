import React from "react";
import Sidebar from "../components/Sidebar";
import Booking from "../components/Booking";

const AdminBookingPage = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <Booking />
      </div>
    </div>
  );
};

export default AdminBookingPage;
