import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";

const cheifPersonalNotes = () => {
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem("cheifPersonalNotes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("cheifPersonalNotes", JSON.stringify(notes));
    } catch {}
  }, [notes]);

  const addNote = () => {
    const text = input.trim();
    if (!text) return;
    setNotes((prev) => [{ id: Date.now(), text }, ...prev]);
    setInput("");
  };

  const deleteNote = (id) => setNotes((prev) => prev.filter((n) => n.id !== id));

  const isEmpty = !input.trim();

  return (
    <div className="h-[100dvh] bg-gray-50 dark:bg-neutral-900 text-gray-800 dark:text-gray-100 flex flex-col">
      {/* Header */}
      <header className="px-4 sm:px-6 pt-6 pb-3">
        <h2 className="text-2xl sm:text-3xl font-semibold">cheif Personal Notes</h2>
      </header>

      {/* Scrollable notes list */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 pb-24 sm:pb-6">
        {notes.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-8 text-lg">
            No personal notes yet.
          </p>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <span className="text-md break-words whitespace-pre-wrap">
                  {note.text}
                </span>

                <button
                  onClick={() => deleteNote(note.id)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded w-full sm:w-auto inline-flex items-center justify-center gap-2 transition"
                  aria-label="Delete note"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Sticky composer (bottom) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addNote();
        }}
        className="sticky bottom-0 inset-x-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-t border-black/5 dark:border-white/10 px-4 sm:px-6 py-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      >
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <input
            type="text"
            placeholder="Write a quick note..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            disabled={isEmpty}
            className={`px-5 py-3 rounded-lg flex items-center justify-center gap-2 transition text-white ${
              isEmpty
                ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 active:bg-green-800"
            }`}
            aria-label="Add note"
          >
            <FaPlus /> Add
          </button>
        </div>
      </form>
    </div>
  );
};

export default cheifPersonalNotes;
