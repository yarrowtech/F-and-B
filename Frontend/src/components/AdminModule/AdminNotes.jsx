// import React, { useState, useEffect } from "react";
// import { FaPlus, FaTrash, FaEdit, FaSave } from "react-icons/fa";

// const AdminNotes = () => {
//   const [notes, setNotes] = useState([]);
//   const [newNote, setNewNote] = useState("");
//   const [editingIndex, setEditingIndex] = useState(null);
//   const [editValue, setEditValue] = useState("");

//   // Load saved notes from localStorage
//   useEffect(() => {
//     const savedNotes = localStorage.getItem("adminNotes");
//     if (savedNotes) setNotes(JSON.parse(savedNotes));
//   }, []);

//   // Save notes to localStorage
//   useEffect(() => {
//     localStorage.setItem("adminNotes", JSON.stringify(notes));
//   }, [notes]);

//   const handleAddNote = () => {
//     if (newNote.trim()) {
//       setNotes([...notes, newNote.trim()]);
//       setNewNote("");
//     }
//   };

//   const handleDelete = (index) => {
//     const updated = [...notes];
//     updated.splice(index, 1);
//     setNotes(updated);
//   };

//   const handleEdit = (index) => {
//     setEditingIndex(index);
//     setEditValue(notes[index]);
//   };

//   const handleSave = (index) => {
//     const updated = [...notes];
//     updated[index] = editValue.trim();
//     setNotes(updated);
//     setEditingIndex(null);
//   };

//   return (
//     <div className="p-6 max-w-3xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
//      <h2 className="text-3xl font-bold mb-6 text-left text-black-700 dark:text-green-400">
//             Notes
//           </h2>

//       {/* Add Note Input */}
//       <div className="flex gap-3 mb-6">
//         <input
//           type="text"
//           value={newNote}
//           onChange={(e) => setNewNote(e.target.value)}
//           placeholder="Write a note..."
//           className="flex-1 px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
//         />
//         <button
//           onClick={handleAddNote}
//           className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
//         >
//           <FaPlus />
//         </button>
//       </div>

//       {/* Notes List */}
//       {notes.length === 0 ? (
//         <p className="text-gray-500 dark:text-gray-400">No notes yet.</p>
//       ) : (
//         <ul className="space-y-4">
//           {notes.map((note, index) => (
//             <li
//               key={index}
//               className="bg-white dark:bg-gray-800 shadow p-4 rounded-md flex justify-between items-start"
//             >
//               {editingIndex === index ? (
//                 <textarea
//                   value={editValue}
//                   onChange={(e) => setEditValue(e.target.value)}
//                   className="flex-1 p-2 border rounded resize-none bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
//                   rows={2}
//                 />
//               ) : (
//                 <p className="flex-1 text-gray-800 dark:text-gray-100">{note}</p>
//               )}

//               <div className="flex items-center gap-2 ml-4">
//                 {editingIndex === index ? (
//                   <button
//                     onClick={() => handleSave(index)}
//                     className="text-green-600 hover:text-green-800 dark:hover:text-green-400"
//                   >
//                     <FaSave />
//                   </button>
//                 ) : (
//                   <button
//                     onClick={() => handleEdit(index)}
//                     className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400"
//                   >
//                     <FaEdit />
//                   </button>
//                 )}
//                 <button
//                   onClick={() => handleDelete(index)}
//                   className="text-red-600 hover:text-red-800 dark:hover:text-red-400"
//                 >
//                   <FaTrash />
//                 </button>
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// };

// export default AdminNotes;



import React, { useState, useEffect, useRef } from "react";
import { FaPlus, FaTrash, FaEdit, FaSave } from "react-icons/fa";

const AdminNotes = () => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef(null);

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("adminNotes");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setNotes(parsed);
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  // Persist notes
  useEffect(() => {
    localStorage.setItem("adminNotes", JSON.stringify(notes));
  }, [notes]);

  const handleAddNote = () => {
    const text = newNote.trim();
    if (!text) return;
    setNotes((prev) => [...prev, text]);
    setNewNote("");
    // Return focus on desktop for fast add loops
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleDelete = (index) => {
    setNotes((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditValue(notes[index]);
  };

  const handleSave = (index) => {
    const val = editValue.trim();
    setNotes((prev) => prev.map((n, i) => (i === index ? val : n)));
    setEditingIndex(null);
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Sticky Header (mobile) / Static Title (desktop) */}
      <header className="md:static sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto w-full px-4 py-4">
          <h2 className="text-2xl md:text-3xl font-bold text-green-700 dark:text-green-400">
            Notes
          </h2>
        </div>
      </header>

      {/* Desktop Composer (top). Hidden on mobile; mobile uses bottom dock */}
      <div className="hidden md:block border-b border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60">
        <div className="max-w-6xl mx-auto px-4 py-4 flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
            placeholder="Write a note..."
            className="flex-1 px-4 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleAddNote}
            className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition"
            aria-label="Add note"
            title="Add note"
          >
            <FaPlus />
            <span className="hidden lg:inline">Add</span>
          </button>
        </div>
      </div>

      {/* Notes List */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 pb-28 md:pb-6">
        {notes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No notes yet. Add your first note below.
          </p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {notes.map((note, index) => (
              <li
                key={index}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-md p-4 flex flex-col"
              >
                {editingIndex === index ? (
                  <>
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      rows={3}
                      className="w-full resize-y rounded-md px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => handleSave(index)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white"
                        aria-label="Save note"
                        title="Save"
                      >
                        <FaSave />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                        aria-label="Cancel editing"
                        title="Cancel"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap break-words">{note}</p>
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => handleEdit(index)}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        aria-label="Edit note"
                        title="Edit"
                      >
                        <FaEdit />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        className="inline-flex items-center gap-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        aria-label="Delete note"
                        title="Delete"
                      >
                        <FaTrash />
                        <span>Delete</span>
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Mobile Bottom Composer Dock */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
        <div className="px-4 py-3 flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
            placeholder="Write a note..."
            className="flex-1 px-4 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleAddNote}
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
            aria-label="Add note"
            title="Add note"
          >
            <FaPlus />
          </button>
        </div>
        <div className="h-3" />
      </div>
    </div>
  );
};

export default AdminNotes;
