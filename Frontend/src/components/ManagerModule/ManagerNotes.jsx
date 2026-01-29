import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaEdit, FaSave } from "react-icons/fa";

const ManagerNotes = () => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const savedNotes = localStorage.getItem("managerNotes");
    if (savedNotes) setNotes(JSON.parse(savedNotes));
  }, []);

  useEffect(() => {
    localStorage.setItem("managerNotes", JSON.stringify(notes));
  }, [notes]);

  const handleAddNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, newNote.trim()]);
      setNewNote("");
    }
  };

  const handleDelete = (index) => {
    const updated = [...notes];
    updated.splice(index, 1);
    setNotes(updated);
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditValue(notes[index]);
  };

  const handleSave = (index) => {
    const updated = [...notes];
    updated[index] = editValue.trim();
    setNotes(updated);
    setEditingIndex(null);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen text-black dark:text-white">
      <h2 className="text-3xl font-bold mb-6 text-left text-black dark:text-green-400">
        Manager Notes
      </h2>

      {/* Add Note Input */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Write a note..."
          className="flex-1 px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-black dark:text-white"
        />
        <button
          onClick={handleAddNote}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          <FaPlus />
        </button>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No notes yet.</p>
      ) : (
        <ul className="space-y-4">
          {notes.map((note, index) => (
            <li
              key={index}
              className="bg-white dark:bg-gray-800 shadow p-4 rounded-md flex justify-between items-start"
            >
              {editingIndex === index ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 p-2 border rounded resize-none bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-black dark:text-white"
                  rows={2}
                />
              ) : (
                <p className="flex-1 text-black dark:text-white">{note}</p>
              )}

              <div className="flex items-center gap-2 ml-4">
                {editingIndex === index ? (
                  <button
                    onClick={() => handleSave(index)}
                    className="text-green-600 hover:text-green-800 dark:hover:text-green-400"
                  >
                    <FaSave />
                  </button>
                ) : (
                  <button
                    onClick={() => handleEdit(index)}
                    className="text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                  >
                    <FaEdit />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(index)}
                  className="text-red-600 hover:text-red-800 dark:hover:text-red-400"
                >
                  <FaTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ManagerNotes;
