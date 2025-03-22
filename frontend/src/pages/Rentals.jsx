import React from "react";
import Sidebar from "../components/Sidebar";
import RentalTable from "../components/RentalTable";

const Rentals = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="w-full h-full overflow-auto p-4">
          <RentalTable />
        </div>
      </div>
    </div>
  );
};

export default Rentals;
