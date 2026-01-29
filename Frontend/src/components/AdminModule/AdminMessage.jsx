// import React, { useState } from "react";
// import { FaPaperPlane } from "react-icons/fa";

// const AdminMessages = () => {
//   const [tab, setTab] = useState("vendor");
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [messageInput, setMessageInput] = useState("");

//   const messages = {
//     vendor: [
//       {
//         id: 1,
//         name: "Vendor A",
//         messages: [
//           { from: "admin", content: "Hi Vendor A, status update?", time: "10:00 AM" },
//           { from: "vendor", content: "Facing delivery delays", time: "10:05 AM" },
//         ],
//       },
//       {
//         id: 2,
//         name: "Vendor B",
//         messages: [
//           { from: "admin", content: "Hello Vendor B", time: "Yesterday" },
//           { from: "vendor", content: "Payment confirmed.", time: "Yesterday" },
//         ],
//       },
//     ],
//     superadmin: [
//       {
//         id: 3,
//         name: "Super Admin",
//         messages: [
//           { from: "admin", content: "Policy review pending?", time: "Today" },
//           { from: "superadmin", content: "Scheduled for 3 PM.", time: "Today" },
//         ],
//       },
//     ],
//     manager: [
//       {
//         id: 4,
//         name: "Manager X",
//         messages: [
//           { from: "admin", content: "Submit team report", time: "8:00 AM" },
//           { from: "manager", content: "Done", time: "8:30 AM" },
//         ],
//       },
//     ],
//   };

//   const userList = messages[tab];

//   const handleSend = () => {
//     if (!messageInput.trim() || !selectedUser) return;

//     selectedUser.messages.push({
//       from: "admin",
//       content: messageInput,
//       time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//     });

//     setMessageInput("");
//   };

//   return (
//     <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-300">
//       {/* Sidebar */}
//       <aside className="w-72 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
//         <div className="p-4 border-b dark:border-gray-700">
//           <h2 className="text-xl font-bold">Admin Chat</h2>
//         </div>

//         {/* Tabs */}
//         <div className="flex space-x-2 px-2 mt-2 mb-4 overflow-x-auto">
//           {["vendor", "superadmin", "manager"].map((role) => (
//             <button
//               key={role}
//               onClick={() => {
//                 setTab(role);
//                 setSelectedUser(null);
//               }}
//               className={`capitalize px-3 py-1 rounded text-sm font-medium whitespace-nowrap flex-shrink-0 ${
//                 tab === role
//                   ? "bg-green-600 text-white"
//                   : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-green-500 hover:text-white"
//               }`}
//             >
//               {role.replace(/([A-Z])/g, " $1")}
//             </button>
//           ))}
//         </div>

//         {/* User List */}
//         <ul className="space-y-1 overflow-y-auto flex-1 px-2 pb-4">
//           {userList.map((u) => (
//             <li key={u.id}>
//               <button
//                 onClick={() => setSelectedUser(u)}
//                 className={`w-full text-left px-4 py-2 rounded-md ${
//                   selectedUser?.id === u.id
//                     ? "bg-green-100 dark:bg-green-900"
//                     : "hover:bg-gray-200 dark:hover:bg-gray-700"
//                 }`}
//               >
//                 <p className="font-medium">{u.name}</p>
//                 <p className="text-xs text-gray-500">
//                   Last: {u.messages.at(-1)?.time}
//                 </p>
//               </button>
//             </li>
//           ))}
//         </ul>
//       </aside>

//       {/* Chat Panel */}
//       <main className="flex-1 flex flex-col">
//         {selectedUser ? (
//           <>
//             {/* Chat Header */}
//             <div className="px-6 py-3 border-b bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
//               <h3 className="text-lg font-bold">{selectedUser.name}</h3>
//             </div>

//             {/* Messages */}
//             <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-50 dark:bg-gray-900">
//               {selectedUser.messages.map((msg, i) => (
//                 <div
//                   key={i}
//                   className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg text-sm shadow ${
//                     msg.from === "admin"
//                       ? "bg-green-600 text-white ml-auto"
//                       : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
//                   }`}
//                 >
//                   <p>{msg.content}</p>
//                   <p className="text-[10px] mt-1 text-right opacity-70">{msg.time}</p>
//                 </div>
//               ))}
//             </div>

//             {/* Input */}
//             <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
//               <div className="flex gap-2">
//                 <input
//                   value={messageInput}
//                   onChange={(e) => setMessageInput(e.target.value)}
//                   onKeyDown={(e) => e.key === "Enter" && handleSend()}
//                   placeholder="Type a message..."
//                   className="flex-1 rounded-md px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
//                 />
//                 <button
//                   onClick={handleSend}
//                   className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
//                 >
//                   <FaPaperPlane />
//                 </button>
//               </div>
//             </div>
//           </>
//         ) : (
//           <div className="flex items-center justify-center h-full text-gray-400 text-lg">
//             Select a conversation to begin
//           </div>
//         )}
//       </main>
//     </div>
//   );
// };

// export default AdminMessages;





import React, { useMemo, useState } from "react";
import { FaPaperPlane, FaBars, FaTimes } from "react-icons/fa";

/** Responsive AdminMessages
 * - Desktop: persistent left sidebar
 * - Mobile: top bar with hamburger; sidebar becomes slide-in drawer
 * - State-backed threads (no direct mutation)
 * - Smooth dark mode & Tailwind-friendly
 */
const AdminMessages = () => {
  const initialThreads = useMemo(
    () => ({
      vendor: [
        {
          id: 1,
          name: "Vendor A",
          messages: [
            { from: "admin", content: "Hi Vendor A, status update?", time: "10:00 AM" },
            { from: "vendor", content: "Facing delivery delays", time: "10:05 AM" },
          ],
        },
        {
          id: 2,
          name: "Vendor B",
          messages: [
            { from: "admin", content: "Hello Vendor B", time: "Yesterday" },
            { from: "vendor", content: "Payment confirmed.", time: "Yesterday" },
          ],
        },
      ],
      superadmin: [
        {
          id: 3,
          name: "Super Admin",
          messages: [
            { from: "admin", content: "Policy review pending?", time: "Today" },
            { from: "superadmin", content: "Scheduled for 3 PM.", time: "Today" },
          ],
        },
      ],
      manager: [
        {
          id: 4,
          name: "Manager X",
          messages: [
            { from: "admin", content: "Submit team report", time: "8:00 AM" },
            { from: "manager", content: "Done", time: "8:30 AM" },
          ],
        },
      ],
    }),
    []
  );

  const [tab, setTab] = useState("vendor");
  const [threads, setThreads] = useState(initialThreads);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const userList = threads[tab] || [];
  const selectedUser = userList.find((u) => u.id === selectedUserId) || null;

  const switchRole = (role) => {
    setTab(role);
    setSelectedUserId(null);
    setMobileOpen(false);
  };

  const selectUser = (id) => {
    setSelectedUserId(id);
    setMobileOpen(false);
  };

  const handleSend = () => {
    if (!messageInput.trim() || !selectedUser) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setThreads((prev) => {
      const next = { ...prev };
      next[tab] = next[tab].map((u) =>
        u.id === selectedUser.id
          ? {
              ...u,
              messages: [...u.messages, { from: "admin", content: messageInput.trim(), time: now }],
            }
          : u
      );
      return next;
    });

    setMessageInput("");
  };

  const Sidebar = (
    <aside className="w-72 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-xl font-bold">Admin Chat</h2>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 px-2 mt-2 mb-4 overflow-x-auto">
        {["vendor", "superadmin", "manager"].map((role) => (
          <button
            key={role}
            onClick={() => switchRole(role)}
            className={`capitalize px-3 py-1 rounded text-sm font-medium whitespace-nowrap flex-shrink-0 ${
              tab === role
                ? "bg-green-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-green-500 hover:text-white"
            }`}
          >
            {role.replace(/([A-Z])/g, " $1")}
          </button>
        ))}
      </div>

      {/* User List */}
      <ul className="space-y-1 overflow-y-auto flex-1 px-2 pb-4">
        {userList.map((u) => (
          <li key={u.id}>
            <button
              onClick={() => selectUser(u.id)}
              className={`w-full text-left px-4 py-2 rounded-md ${
                selectedUserId === u.id
                  ? "bg-green-100 dark:bg-green-900"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <p className="font-medium">{u.name}</p>
              <p className="text-xs text-gray-500">
                Last: {u.messages.at(-1)?.time}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );

  return (
    <div className="flex h-[100dvh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-300">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">{Sidebar}</div>

      {/* Mobile Drawer */}
      <div className={`md:hidden fixed inset-0 z-40 ${mobileOpen ? "" : "pointer-events-none"}`}>
        {/* Backdrop */}
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0"}`}
        />
        {/* Panel */}
        <div
          className={`absolute left-0 top-0 h-full w-72 transform transition-transform ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {Sidebar}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-gray-800 dark:border-gray-700">
          <button
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md bg-gray-200 dark:bg-gray-700"
          >
            <FaBars />
          </button>
          <h3 className="text-base font-semibold truncate">
            {selectedUser ? selectedUser.name : "Admin Chat"}
          </h3>
          <button
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-md bg-gray-200 dark:bg-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        {/* Chat Header (Desktop) */}
        {selectedUser && (
          <div className="hidden md:block px-6 py-3 border-b bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold">{selectedUser.name}</h3>
          </div>
        )}

        {/* Empty State */}
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-lg px-6">
            <div className="text-center space-y-2">
              <p className="font-medium">Select a conversation to begin</p>
              <p className="text-sm opacity-80">
                Use the <span className="font-semibold">menu</span> on mobile or the left panel on desktop.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-3 bg-gray-50 dark:bg-gray-900">
              {selectedUser.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] sm:max-w-md px-4 py-2 rounded-lg text-sm shadow break-words ${
                    msg.from === "admin"
                      ? "bg-green-600 text-white ml-auto"
                      : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className="text-[10px] mt-1 text-right opacity-70">{msg.time}</p>
                </div>
              ))}
            </div>

            {/* Composer */}
            <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-md px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleSend}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminMessages;
