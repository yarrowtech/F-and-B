// import React, { useState } from "react";
// import {
//   FaInfoCircle,
//   FaCheckCircle,
//   FaExclamationTriangle,
//   FaTimesCircle,
// } from "react-icons/fa";

// const AdminNotifications = () => {
//   const [notifications, setNotifications] = useState([
//     {
//       id: 1,
//       type: "info",
//       title: "New Vendor Registered",
//       message: "Vendor A has joined the platform.",
//       time: "2 mins ago",
//       read: false,
//     },
//     {
//       id: 2,
//       type: "success",
//       title: "Payment Received",
//       message: "₹4,000 received from Manager Y.",
//       time: "10 mins ago",
//       read: false,
//     },
//     {
//       id: 3,
//       type: "warning",
//       title: "Subscription Expiring",
//       message: "Super Admin's plan expires in 3 days.",
//       time: "1 hour ago",
//       read: true,
//     },
//     {
//       id: 4,
//       type: "error",
//       title: "Login Attempt Blocked",
//       message: "Unauthorized login detected from IP 192.168.1.22.",
//       time: "Yesterday",
//       read: true,
//     },
//   ]);

//   const getTypeStyle = (type) => {
//     switch (type) {
//       case "info":
//         return { icon: <FaInfoCircle />, color: "blue" };
//       case "success":
//         return { icon: <FaCheckCircle />, color: "green" };
//       case "warning":
//         return { icon: <FaExclamationTriangle />, color: "yellow" };
//       case "error":
//         return { icon: <FaTimesCircle />, color: "red" };
//       default:
//         return { icon: <FaInfoCircle />, color: "gray" };
//     }
//   };

//   const markAsRead = (id) =>
//     setNotifications((prev) =>
//       prev.map((n) => (n.id === id ? { ...n, read: true } : n))
//     );

//   return (
//     <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all">
//       <h2 className="text-3xl font-bold mb-6">🔔 Notifications</h2>

//       {notifications.length === 0 ? (
//         <p className="text-gray-500 dark:text-gray-400">No notifications to show.</p>
//       ) : (
//         <div className="space-y-4">
//           {notifications.map((note) => {
//             const { icon, color } = getTypeStyle(note.type);
//             return (
//               <div
//                 key={note.id}
//                 className={`flex items-start gap-4 p-4 rounded-lg shadow-sm border border-${color}-200 dark:border-${color}-600 bg-white dark:bg-gray-800 transition-all ${
//                   note.read ? "opacity-70" : "opacity-100"
//                 }`}
//               >
//                 <div
//                   className={`text-${color}-600 dark:text-${color}-400 text-xl`}
//                 >
//                   {icon}
//                 </div>
//                 <div className="flex-1">
//                   <h4 className="font-semibold">{note.title}</h4>
//                   <p className="text-sm text-gray-600 dark:text-gray-300">{note.message}</p>
//                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{note.time}</p>
//                 </div>
//                 {!note.read && (
//                   <button
//                     onClick={() => markAsRead(note.id)}
//                     className="text-xs text-green-600 dark:text-green-400 hover:underline"
//                   >
//                     Mark as read
//                   </button>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// };

// export default AdminNotifications;





import React, { useState } from "react";
import {
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
} from "react-icons/fa";

const TYPE_STYLES = {
  info: {
    icon: <FaInfoCircle />,
    container: "border-blue-200 dark:border-blue-600",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  success: {
    icon: <FaCheckCircle />,
    container: "border-green-200 dark:border-green-600",
    iconColor: "text-green-600 dark:text-green-400",
  },
  warning: {
    icon: <FaExclamationTriangle />,
    container: "border-yellow-200 dark:border-yellow-600",
    iconColor: "text-yellow-600 dark:text-yellow-400",
  },
  error: {
    icon: <FaTimesCircle />,
    container: "border-red-200 dark:border-red-600",
    iconColor: "text-red-600 dark:text-red-400",
  },
  default: {
    icon: <FaInfoCircle />,
    container: "border-gray-200 dark:border-gray-600",
    iconColor: "text-gray-600 dark:text-gray-400",
  },
};

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "info",
      title: "New Vendor Registered",
      message: "Vendor A has joined the platform.",
      time: "2 mins ago",
      read: false,
    },
    {
      id: 2,
      type: "success",
      title: "Payment Received",
      message: "₹4,000 received from Manager Y.",
      time: "10 mins ago",
      read: false,
    },
    {
      id: 3,
      type: "warning",
      title: "Subscription Expiring",
      message: "Super Admin's plan expires in 3 days.",
      time: "1 hour ago",
      read: true,
    },
    {
      id: 4,
      type: "error",
      title: "Login Attempt Blocked",
      message: "Unauthorized login detected from IP 192.168.1.22.",
      time: "Yesterday",
      read: true,
    },
  ]);

  const markAsRead = (id) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all">
      <h2 className="text-3xl font-bold mb-6">🔔 Notifications</h2>

      {notifications.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No notifications to show.
        </p>
      ) : (
        <div className="space-y-4">
          {notifications.map((note) => {
            const styles = TYPE_STYLES[note.type] || TYPE_STYLES.default;
            return (
              <div
                key={note.id}
                className={`flex items-start gap-4 p-4 rounded-lg shadow-sm border bg-white dark:bg-gray-800 transition-all ${styles.container} ${
                  note.read ? "opacity-70" : "opacity-100"
                }`}
              >
                <div className={`text-xl ${styles.iconColor}`}>
                  {styles.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{note.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {note.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {note.time}
                  </p>
                </div>
                {!note.read && (
                  <button
                    onClick={() => markAsRead(note.id)}
                    className="text-xs text-green-600 dark:text-green-400 hover:underline"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
