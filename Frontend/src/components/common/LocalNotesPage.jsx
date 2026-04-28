import React, { useEffect, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";

const LocalNotesPage = ({
  storageKey,
  title,
  description = "Keep quick reminders for your shift and remove them when they are done.",
}) => {
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(notes));
  }, [notes, storageKey]);

  const addNote = () => {
    if (!input.trim()) return;

    setNotes([
      {
        id: Date.now(),
        text: input.trim(),
        date: new Date().toLocaleString(),
      },
      ...notes,
    ]);
    setInput("");
  };

  const deleteNote = (id) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 text-gray-800 transition-colors dark:bg-neutral-900 dark:text-gray-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
            Notes
          </p>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
            {description}
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-neutral-800 sm:flex-row">
          <input
            type="text"
            placeholder="Write a quick note..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addNote()}
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

        <div className="grid gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-neutral-800"
            >
              <div className="min-w-0">
                <p className="break-words text-base font-medium">{note.text}</p>
                {note.date && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {note.date}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteNote(note.id)}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600"
              >
                <FaTrash />
                Delete
              </button>
            </div>
          ))}
        </div>

        {notes.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white/70 p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-neutral-800/70 dark:text-gray-400">
            No personal notes yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalNotesPage;
