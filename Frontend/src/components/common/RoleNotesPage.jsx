import React, { useEffect, useState } from "react";
import { FaPlus, FaSearch, FaThumbtack, FaTrash } from "react-icons/fa";

import {
  createNote,
  deleteNote,
  getNotes,
  getNotesByDate,
  searchNotes,
  togglePinNote,
} from "../../services/note.service";

const RoleNotesPage = ({
  title,
  eyebrow = "Notes",
  description = "Save reminders, pin important items, and search your notes quickly.",
}) => {
  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState("");
  const [search, setSearch] = useState("");

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

  const addNote = async () => {
    if (!noteInput.trim()) return;

    try {
      await createNote(noteInput.trim());
      setNoteInput("");
      loadNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const removeNote = async (id) => {
    try {
      await deleteNote(id);
      setNotes((current) => current.filter((note) => note._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const togglePin = async (id) => {
    try {
      await togglePinNote(id);
      loadNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async () => {
    try {
      if (!search.trim()) {
        loadNotes();
        return;
      }

      const data = Number.isNaN(Date.parse(search))
        ? await searchNotes(search.trim())
        : await getNotesByDate(search.trim());
      setNotes(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 text-gray-800 transition-colors dark:bg-neutral-900 dark:text-gray-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
            {description}
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-neutral-800">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNote()}
              placeholder="Write a note..."
              className="min-h-11 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/30 dark:border-gray-600 dark:bg-neutral-900 dark:text-gray-100 dark:placeholder-gray-400"
            />
            <button
              onClick={addNote}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700"
            >
              <FaPlus />
              Add Note
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              placeholder="Search note or date (yyyy-mm-dd)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="min-h-11 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-neutral-900 dark:text-gray-100 dark:placeholder-gray-400"
            />
            <button
              onClick={handleSearch}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
            >
              <FaSearch />
              Search
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {notes.map((note) => (
            <div
              key={note._id}
              className={`group flex items-start justify-between gap-4 rounded-2xl border p-4 shadow-sm transition ${
                note.isPinned
                  ? "border-yellow-300 bg-yellow-100 text-yellow-950 dark:border-yellow-500/60 dark:bg-yellow-500/15 dark:text-yellow-100"
                  : "border-gray-200 bg-white dark:border-gray-700 dark:bg-neutral-800"
              }`}
            >
              <div className="min-w-0">
                <p className="break-words text-base font-medium">{note.note}</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {note.date ? new Date(note.date).toLocaleDateString() : ""}
                </p>
              </div>

              <div className="flex shrink-0 gap-2 opacity-80 transition group-hover:opacity-100">
                <button
                  onClick={() => togglePin(note._id)}
                  className={`rounded-lg p-2 transition hover:bg-black/5 dark:hover:bg-white/10 ${
                    note.isPinned ? "text-yellow-600 dark:text-yellow-300" : "text-gray-400"
                  }`}
                  aria-label={note.isPinned ? "Unpin note" : "Pin note"}
                >
                  <FaThumbtack />
                </button>
                <button
                  onClick={() => removeNote(note._id)}
                  className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                  aria-label="Delete note"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>

        {notes.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white/70 p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-neutral-800/70 dark:text-gray-400">
            No notes found.
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleNotesPage;
