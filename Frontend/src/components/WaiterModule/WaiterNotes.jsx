import React, { useState, useEffect } from "react";
import { FaPlus, FaSearch, FaTrash, FaThumbtack } from "react-icons/fa";

import {
  getNotes,
  createNote,
  deleteNote,
  togglePinNote,
  searchNotes,
  getNotesByDate
} from "../../services/note.service";

const WaiterNotes = () => {

  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState("");
  const [search, setSearch] = useState("");

  const loadNotes = async () => {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const addNote = async () => {
    if (!noteInput.trim()) return;

    await createNote(noteInput);
    setNoteInput("");
    loadNotes();
  };

  const removeNote = async (id) => {
    await deleteNote(id);
    setNotes((prev) => prev.filter((n) => n._id !== id));
  };

  const togglePin = async (id) => {
    await togglePinNote(id);
    loadNotes();
  };

  const handleSearch = async () => {

    if (!search.trim()) {
      return loadNotes();
    }

    if (!isNaN(Date.parse(search))) {
      const data = await getNotesByDate(search);
      setNotes(data);
    } else {
      const data = await searchNotes(search);
      setNotes(data);
    }
  };

  return (
    <div className="p-6">

      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-8 max-w-5xl mx-auto">

        <h2 className="text-3xl font-semibold mb-6">
          Waiter Personal Notes
        </h2>

        {/* ADD NOTE */}

        <div className="flex gap-3 mb-5">

          <input
            type="text"
            placeholder="Write a note..."
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            className="flex-1 p-4 border rounded-lg focus:ring-2 focus:ring-green-500"
          />

          <button
            onClick={addNote}
            className="bg-green-600 hover:bg-green-700 text-white w-14 rounded-lg flex items-center justify-center"
          >
            <FaPlus />
          </button>

        </div>

        {/* SEARCH */}

        <div className="flex gap-3 mb-8">

          <input
            placeholder="Search note or date (yyyy-mm-dd)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-4 border rounded-lg"
          />

          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white w-14 rounded-lg flex items-center justify-center"
          >
            <FaSearch />
          </button>

        </div>

        {/* NOTES */}

        {notes.length === 0 ? (
          <p className="text-center text-gray-500 mt-20 text-lg">
            No notes found
          </p>
        ) : (
          <div className="space-y-4">

            {notes.map((note) => (

              <div
                key={note._id}
                className={`flex justify-between items-center p-4 rounded-lg shadow-sm
                ${note.isPinned
                    ? "bg-yellow-100 border-l-4 border-yellow-500"
                    : "bg-gray-50 dark:bg-neutral-800"
                }`}
              >

                <div>

                  <p className="text-lg">
                    {note.note}
                  </p>

                  <p className="text-sm text-gray-500">
                    {new Date(note.date).toLocaleDateString()}
                  </p>

                </div>

                <div className="flex gap-4 text-lg">

                  <button
                    onClick={() => togglePin(note._id)}
                    className={`${
                      note.isPinned
                        ? "text-yellow-600"
                        : "text-gray-400"
                    }`}
                  >
                    <FaThumbtack />
                  </button>

                  <button
                    onClick={() => removeNote(note._id)}
                    className="text-red-500"
                  >
                    <FaTrash />
                  </button>

                </div>

              </div>

            ))}

          </div>
        )}

      </div>

    </div>
  );
};

export default WaiterNotes;