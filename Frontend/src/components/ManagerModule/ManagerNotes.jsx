import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaTrash,
  FaThumbtack,
  FaSearch
} from "react-icons/fa";

import {
  getNotes,
  createNote,
  deleteNote,
  togglePinNote,
  searchNotes,
  getNotesByDate
} from "../../services/note.service";

const ManagerNotes = () => {

  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState("");
  const [search, setSearch] = useState("");

  /* LOAD NOTES */

  const loadNotes = async () => {
    const data = await getNotes();
    setNotes(data);
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

  /* SEARCH (WORD OR DATE) */

  const handleSearch = async () => {

    if (!search.trim()) return loadNotes();

    // check if search is date
    if (!isNaN(Date.parse(search))) {
      const data = await getNotesByDate(search);
      setNotes(data);
    } else {
      const data = await searchNotes(search);
      setNotes(data);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">

      <h2 className="mb-6 text-2xl font-bold sm:text-3xl">
        Manager Personal Notes
      </h2>

      {/* ADD NOTE */}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">

        <input
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          placeholder="Write a note..."
          className="flex-1 p-3 rounded border focus:ring-2 focus:ring-green-500"
        />

        <button
          onClick={addNote}
          className="flex items-center justify-center rounded bg-green-600 px-4 py-3 text-white hover:bg-green-700 sm:w-auto"
        >
          <FaPlus />
        </button>

      </div>


      {/* SEARCH */}

      <div className="mb-8 flex flex-col gap-3 sm:flex-row">

        <input
          placeholder="Search note or date (yyyy-mm-dd)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-3 border rounded"
        />

        <button
          onClick={handleSearch}
          className="rounded bg-blue-600 px-4 py-3 text-white sm:w-auto"
        >
          <FaSearch />
        </button>

      </div>


      {/* PINNED NOTES */}

      <div className="grid gap-4">

        {notes.map((note) => (

          <div
            key={note._id}
            className={`group flex flex-col gap-4 rounded-lg p-4 shadow transition sm:flex-row sm:justify-between sm:items-start
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

            <div className="flex gap-3 opacity-70 transition group-hover:opacity-100 sm:self-start">

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

export default ManagerNotes;
