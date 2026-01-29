import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";

const InventoryPersonalNotes = () => {
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem("inventoryPersonalNotes");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");

  useEffect(() => {
    localStorage.setItem("inventoryPersonalNotes", JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    if (input.trim() !== "") {
      setNotes([{ id: Date.now(), text: input }, ...notes]);
      setInput("");
    }
  };

  const deleteNote = (id) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-neutral-900 min-h-screen">
      <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
        Inventory Personal Notes
      </h2>

      {/* Add New Note */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center">
        <input
          type="text"
          placeholder="Write a quick note..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full sm:w-80 p-3 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={addNote}
          className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center mt-2 sm:mt-0 transition-all"
        >
          <FaPlus className="mr-2" /> Add
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-lg shadow-md"
          >
            <span className="text-gray-800 dark:text-gray-100 text-md">{note.text}</span>
            <button
              onClick={() => deleteNote(note.id)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded flex items-center transition-all"
            >
              <FaTrash className="mr-2" /> Delete
            </button>
          </div>
        ))}
      </div>

      {notes.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-8 text-lg">
          No personal notes yet.
        </p>
      )}
    </div>
  );
};

export default InventoryPersonalNotes;
