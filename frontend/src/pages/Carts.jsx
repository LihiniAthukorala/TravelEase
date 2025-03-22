import React from "react";
import Sidebar from "../components/Sidebar";
import CartTable from "../components/CartTable";

const Carts = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <CartTable />
      </div>
    </div>
  );
};

export default Carts;
