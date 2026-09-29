import {
  FaBoxes,
  FaChartLine,
  FaComments,
  FaCreditCard,
  FaFileAlt,
  FaStickyNote,
  FaTachometerAlt,
  FaUserCircle,
  FaUsers,
  FaCartPlus,
} from "react-icons/fa";

export const VENDOR_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: FaTachometerAlt },
  { id: "new-order", label: "New Order", icon: FaCartPlus, globalOnly: true },
  { id: "subscription", label: "Subscription", icon: FaCreditCard },
  { id: "my-products", label: "My Products", icon: FaBoxes },
  { id: "inventory", label: "Inventory", icon: FaBoxes },
  { id: "vendor-management", label: "Management", icon: FaUsers },
  { id: "account", label: "Account", icon: FaUserCircle },
  { id: "analytics", label: "Analytics", icon: FaChartLine },
  { id: "reports", label: "Reports", icon: FaFileAlt },
  { id: "negotiations", label: "Negotiations", icon: FaComments },
  { id: "notes", label: "Notes", icon: FaStickyNote },
];

export const getVendorNavItems = () => {
  let vendorType = "";
  try { vendorType = JSON.parse(localStorage.getItem("user") || "{}").vendorType; } catch { /* No cached profile. */ }
  return VENDOR_NAV_ITEMS.filter((item) => !item.globalOnly || vendorType === "global");
};
