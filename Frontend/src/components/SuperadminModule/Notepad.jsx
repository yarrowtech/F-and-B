import React, { useState, useEffect } from "react";
import { FaTrash, FaEdit, FaSave } from "react-icons/fa";
import { motion } from "framer-motion";

const Notepad = () => {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

  // Load notes from localStorage on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("adminNotes")) || [];
    setNotes(saved);
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("adminNotes", JSON.stringify(notes));
  }, [notes]);

  // Add or save a note
  const addNote = () => {
    if (!input.trim()) return;

    if (editingIndex !== null) {
      const updated = [...notes];
      updated[editingIndex] = {
        ...updated[editingIndex],
        text: input.trim(),
        editedAt: new Date().toISOString(),
      };
      setNotes(updated);
      setEditingIndex(null);
    } else {
      setNotes([
        ...notes,
        {
          text: input.trim(),
          createdAt: new Date().toISOString(),
        },
      ]);
    }

    setInput("");
  };

  // Delete a note by index
  const deleteNote = (index) => {
    const updated = notes.filter((_, i) => i !== index);
    setNotes(updated);
  };

  // Start editing a note
  const editNote = (index) => {
    setInput(notes[index].text);
    setEditingIndex(index);
  };

  // Format date display
  const formatDate = (iso) =>
    new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <div className="p-4 sm:p-6 md:p-10 bg-gray-100 dark:bg-zinc-900 min-h-screen overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto flex flex-col h-[80vh]"
      >
        {/* Title */}
        <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
          Notes
        </h2>

        {/* Input */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write a note..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none dark:bg-zinc-800 dark:text-white dark:border-zinc-600"
          />
          <button
            onClick={addNote}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg flex items-center justify-center gap-2"
          >
            {editingIndex !== null ? (
              <>
                <FaSave /> Save
              </>
            ) : (
              "Add"
            )}
          </button>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {notes.length === 0 ? (
            <p className="text-center text-gray-400 mt-16">
              No notes yet. Add one above!
            </p>
          ) : (
            notes.map((note, i) => (
              <div
                key={i}
                className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4 flex justify-between items-start"
              >
                <div className="flex-1 pr-4">
                  <p className="text-gray-800 dark:text-white break-words mb-2">
                    {note.text}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {note.editedAt
                      ? `Edited: ${formatDate(note.editedAt)}`
                      : `Created: ${formatDate(note.createdAt)}`}
                  </p>
                </div>
                <div className="flex gap-3 mt-1 text-lg">
                  <button
                    onClick={() => editNote(i)}
                    className="text-yellow-600 hover:text-yellow-800"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => deleteNote(i)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Notepad;
