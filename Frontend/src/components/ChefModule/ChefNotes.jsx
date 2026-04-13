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

const ChefPersonalNotes = () => {

  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState("");
  const [search, setSearch] = useState("");

  /* LOAD NOTES */

  const loadNotes = async () => {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (error) {
      console.error("Error loading notes", error);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  /* ADD NOTE */

  const addNote = async () => {
    if (!noteInput.trim()) return;

    try {
      await createNote(noteInput);
      setNoteInput("");
      loadNotes();
    } catch (error) {
      console.error("Add note error", error);
    }
  };

  /* DELETE NOTE */

  const removeNote = async (id) => {
    try {
      await deleteNote(id);
      setNotes(notes.filter((n) => n._id !== id));
    } catch (error) {
      console.error("Delete error", error);
    }
  };

  /* PIN NOTE */

  const togglePin = async (id) => {
    try {
      await togglePinNote(id);
      loadNotes();
    } catch (error) {
      console.error("Pin error", error);
    }
  };

  /* SEARCH (WORD OR DATE) */

  const handleSearch = async () => {

    if (!search.trim()) {
      return loadNotes();
    }

    try {

      if (!isNaN(Date.parse(search))) {
        const data = await getNotesByDate(search);
        setNotes(data);
      } else {
        const data = await searchNotes(search);
        setNotes(data);
      }

    } catch (error) {
      console.error("Search error", error);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto bg-gray-50 dark:bg-neutral-900 min-h-screen">

      <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6">
        Chef Personal Notes
      </h2>

      {/* ADD NOTE */}

      <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">

        <input
          type="text"
          placeholder="Write a note..."
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          className="flex-1 p-3 border rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
        />

        <button
          onClick={addNote}
          className="px-4 sm:px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center shrink-0"
        >
          <FaPlus />
        </button>

      </div>


      {/* SEARCH */}

      <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8">

        <input
          placeholder="Search note or date (yyyy-mm-dd)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-3 border rounded-lg text-sm sm:text-base"
        />

        <button
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg shrink-0"
        >
          <FaSearch />
        </button>

      </div>


      {/* NOTES */}

      <div className="grid gap-4">

        {notes.map((note) => (

          <div
            key={note._id}
            className={`flex justify-between items-start p-4 rounded-lg shadow transition
            ${note.isPinned
              ? "bg-yellow-100 border-l-4 border-yellow-500"
              : "bg-white dark:bg-neutral-800"
            }`}
          >

            <div>

              <p className="text-gray-800 dark:text-white text-lg">
                {note.note}
              </p>

              <p className="text-sm text-gray-500 mt-1">
                {new Date(note.date).toLocaleDateString()}
              </p>

            </div>

            <div className="flex gap-3">

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

export default ChefPersonalNotes;