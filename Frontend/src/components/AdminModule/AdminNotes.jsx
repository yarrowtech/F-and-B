


import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaThumbtack, FaSearch } from "react-icons/fa";

import {
  getNotes,
  createNote,
  deleteNote,
  togglePinNote,
  searchNotes,
  getNotesByDate
} from "../../services/note.service";

const AdminNotes = () => {

  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState("");
  const [search, setSearch] = useState("");

  /* LOAD NOTES */

  const loadNotes = async () => {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  /* ADD NOTE */

  const addNote = async () => {
    if (!noteInput.trim()) return;

    await createNote(noteInput);
    setNoteInput("");
    loadNotes();
  };

  /* DELETE */

  const removeNote = async (id) => {
    await deleteNote(id);
    setNotes(notes.filter((n) => n._id !== id));
  };

  /* PIN */

  const togglePin = async (id) => {
    await togglePinNote(id);
    loadNotes();
  };

  /* SEARCH WORD OR DATE */

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
    <div className="p-8 max-w-5xl mx-auto">

      <h2 className="text-3xl font-bold mb-6">
        Admin Personal Notes
      </h2>

      {/* ADD NOTE */}

      <div className="flex gap-3 mb-6">

        <input
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          placeholder="Write a note..."
          className="flex-1 p-3 rounded border focus:ring-2 focus:ring-green-500"
        />

        <button
          onClick={addNote}
          className="bg-green-600 hover:bg-green-700 text-white px-4 rounded flex items-center"
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
          className="flex-1 p-3 border rounded"
        />

        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 rounded"
        >
          <FaSearch />
        </button>

      </div>


      {/* NOTES */}

      <div className="grid gap-4">

        {notes.map((note) => (

          <div
            key={note._id}
            className={`group flex justify-between items-start p-4 rounded-lg shadow transition
            ${note.isPinned
                ? "bg-yellow-100 border-l-4 border-yellow-500"
                : "bg-white dark:bg-neutral-800"
            }`}
          >

            <div>

              <p className="text-lg text-gray-800 dark:text-white">
                {note.note}
              </p>

              <p className="text-sm text-gray-500 mt-1">
                {new Date(note.date).toLocaleDateString()}
              </p>

            </div>

            {/* ACTIONS */}

            <div className="flex gap-3 opacity-70 group-hover:opacity-100">

              <button
                onClick={() => togglePin(note._id)}
                className={`text-lg ${
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

      {notes.length === 0 && (
        <p className="text-center text-gray-500 mt-10">
          No notes found
        </p>
      )}

    </div>
  );
};

export default AdminNotes;