import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaEdit, FaSave } from "react-icons/fa";

const VendorNotes = () => {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

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
    <div className="min-h-screen bg-gray-50 px-4 py-6 text-gray-800 transition-colors dark:bg-neutral-900 dark:text-gray-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
            Notes
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Vendor Personal Notes</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
            Save supplier reminders, edit follow-ups, and keep vendor tasks clear in light or dark mode.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-neutral-800 sm:flex-row">
          <input
            type="text"
            placeholder="Write a note..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (editingIndex !== null ? saveNote() : addNote())}
            className="min-h-11 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/30 dark:border-gray-600 dark:bg-neutral-900 dark:text-gray-100 dark:placeholder-gray-400"
          />
          {editingIndex !== null ? (
            <button
              onClick={saveNote}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
            >
              <FaSave />
              Save Note
            </button>
          ) : (
            <button
              onClick={addNote}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700"
            >
              <FaPlus />
              Add Note
            </button>
          )}
        </div>

        <div className="grid gap-4">
          {notes.map((note, index) => (
            <div
              key={`${note.date}-${index}`}
              className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-neutral-800"
            >
              <div className="min-w-0">
                <p className="break-words text-base font-medium">{note.text}</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{note.date}</p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <button
                  onClick={() => editNote(index)}
                  className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-yellow-600"
                >
                  <FaEdit />
                  Edit
                </button>
                <button
                  onClick={() => deleteNote(index)}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600"
                >
                  <FaTrash />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {notes.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white/70 p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-neutral-800/70 dark:text-gray-400">
            No notes yet. Add your first note.
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorNotes;
