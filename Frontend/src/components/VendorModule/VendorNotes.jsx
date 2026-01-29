import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaEdit, FaSave } from "react-icons/fa";

const VendorNotes = () => {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("isDark");
    if (saved !== null) return saved === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const savedNotes = JSON.parse(localStorage.getItem("vendorNotes")) || [];
    setNotes(savedNotes);
  }, []);

  useEffect(() => {
    localStorage.setItem("vendorNotes", JSON.stringify(notes));
  }, [notes]);


  const addNote = () => {
    if (!input.trim()) return;
    setNotes([{ text: input, date: new Date().toLocaleString() }, ...notes]);
    setInput("");
  };

  const deleteNote = (index) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  const editNote = (index) => {
    setEditingIndex(index);
    setInput(notes[index].text);
  };

  const saveNote = () => {
    if (editingIndex !== null) {
      const updatedNotes = [...notes];
      updatedNotes[editingIndex] = { ...updatedNotes[editingIndex], text: input };
      setNotes(updatedNotes);
      setInput("");
      setEditingIndex(null);
    }
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors">
      <h1 className="text-2xl font-bold mb-4">Notes</h1>

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Write a note..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border p-2 rounded flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
        {editingIndex !== null ? (
          <button
            onClick={saveNote}
            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FaSave /> Save
          </button>
        ) : (
          <button
            onClick={addNote}
            className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FaPlus /> Add
          </button>
        )}
      </div>

      {/* Notes List */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow transition-colors">
        {notes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No notes yet. Add your first note!</p>
        ) : (
          <ul>
            {notes.map((note, index) => (
              <li
                key={index}
                className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 py-2"
              >
                <div>
                  <p className="font-medium">{note.text}</p>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{note.date}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editNote(index)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded flex items-center gap-1"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => deleteNote(index)}
                    className="bg-red-500 text-white px-2 py-1 rounded flex items-center gap-1"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VendorNotes;
