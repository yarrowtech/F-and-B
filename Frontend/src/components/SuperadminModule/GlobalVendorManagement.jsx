import React from "react";
import UserManagement from "./UserManagement";

const GlobalVendorManagement = () => (
  <UserManagement
    forceTab="globalVendors"
    hideTabs
    title="Global Vendor Management"
    allowGlobalVendorActions
    globalVendorDetailsScope="professional"
  />
);

export default GlobalVendorManagement;
