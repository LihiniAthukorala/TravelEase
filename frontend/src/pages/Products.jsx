import React from "react";
import Sidebar from "../components/Sidebar";
import ProductTable from "../components/ProductTable";

const Products = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="w-full h-full overflow-auto p-4">
          <ProductTable />
        </div>
      </div>
    </div>
  );
};

export default Products;
