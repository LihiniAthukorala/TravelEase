import React from "react";
import Sidebar from "../components/Sidebar";
import UserTable from "../components/UserTable";

const Users = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="w-full h-full overflow-auto p-4">
          <UserTable />
        </div>
      </div>
    </div>
  );
};

export default Users;
