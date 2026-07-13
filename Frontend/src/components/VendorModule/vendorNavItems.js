import {
  FaBoxes,
  FaChartLine,
  FaGlobe,
  FaStickyNote,
  FaTachometerAlt,
  FaUserCircle,
  FaUsers,
} from "react-icons/fa";

export const VENDOR_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: FaTachometerAlt },
  { id: "my-products", label: "My Products", icon: FaBoxes },
  { id: "inventory", label: "Inventory", icon: FaBoxes },
  { id: "vendor-management", label: "Management", icon: FaUsers },
  { id: "account", label: "Account", icon: FaUserCircle },
  { id: "analytics", label: "Analytics", icon: FaChartLine },
  { id: "upgrade-request", label: "Upgrade", icon: FaGlobe },
  { id: "notes", label: "Notes", icon: FaStickyNote },
];
