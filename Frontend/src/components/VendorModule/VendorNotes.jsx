import React, { useState, useEffect } from "react";
import { Pencil, Plus, Save, Trash2 } from "lucide-react";

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
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-600 dark:text-green-400">
          Vendor
        </p>
        <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
          Personal Notes
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Save supplier reminders, edit follow-ups, and keep vendor tasks clear.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:flex-row">
        <input
          type="text"
          placeholder="Write a note..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (editingIndex !== null ? saveNote() : addNote())}
          className="min-h-11 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-100"
        />
        {editingIndex !== null ? (
          <button
            onClick={saveNote}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <Save size={15} />
            Save Note
          </button>
        ) : (
          <button
            onClick={addNote}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <Plus size={15} />
            Add Note
          </button>
        )}
      </div>

      <div className="grid gap-3">
        {notes.map((note, index) => (
          <div
            key={`${note.date}-${index}`}
            className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
          >
            <div className="min-w-0">
              <p className="break-words text-sm font-medium text-gray-800 dark:text-gray-100">
                {note.text}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{note.date}</p>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <button
                onClick={() => editNote(index)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
              >
                <Pencil size={13} />
                Edit
              </button>
              <button
                onClick={() => deleteNote(index)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {notes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400 dark:border-neutral-700 dark:bg-neutral-800">
          No notes yet. Add your first note.
        </div>
      )}
    </div>
  );
};

export default VendorNotes;
