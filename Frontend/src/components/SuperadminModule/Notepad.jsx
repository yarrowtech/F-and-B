import { useState, useEffect } from "react";
import {
  FaPlus,
  FaTrash,
  FaThumbtack,
  FaSearch,
  FaEdit,
  FaSave,
  FaTimes,
  FaStickyNote,
} from "react-icons/fa";
import {
  getNotes,
  createNote,
  deleteNote,
  togglePinNote,
  searchNotes,
  getNotesByDate,
  updateNote,
} from "../../services/note.service";

const Notepad = () => {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadNotes = async () => {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleAdd = async () => {
    if (!input.trim()) return;
    if (editingId) {
      await updateNote(editingId, input.trim());
      setEditingId(null);
    } else {
      await createNote(input.trim());
    }
    setInput("");
    loadNotes();
  };

  const handleDelete = async (id) => {
    await deleteNote(id);
    setNotes((prev) => prev.filter((n) => n._id !== id));
  };

  const handlePin = async (id) => {
    await togglePinNote(id);
    loadNotes();
  };

  const handleEdit = (note) => {
    setInput(note.note);
    setEditingId(note._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setInput("");
    setEditingId(null);
  };

  const handleSearch = async () => {
    if (!search.trim()) return loadNotes();
    if (!isNaN(Date.parse(search))) {
      const data = await getNotesByDate(search);
      setNotes(data);
    } else {
      const data = await searchNotes(search);
      setNotes(data);
    }
  };

  const clearSearch = () => {
    setSearch("");
    loadNotes();
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const pinned = notes.filter((n) => n.isPinned);
  const unpinned = notes.filter((n) => !n.isPinned);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white shadow">
            <FaStickyNote size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Notes</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {notes.length} note{notes.length !== 1 ? "s" : ""}
              {pinned.length > 0 && ` · ${pinned.length} pinned`}
            </p>
          </div>
        </div>

        {/* ── Compose card ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {editingId ? "Editing note" : "New note"}
          </p>
          <textarea
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); }
              if (e.key === "Escape") cancelEdit();
            }}
            placeholder="Write your note here… (Enter to save, Shift+Enter for new line)"
            className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
          />
          <div className="mt-3 flex justify-end gap-2">
            {editingId && (
              <button
                onClick={cancelEdit}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-300"
              >
                <FaTimes size={12} /> Cancel
              </button>
            )}
            <button
              onClick={handleAdd}
              disabled={!input.trim()}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-green-700 disabled:opacity-40"
            >
              {editingId ? <><FaSave size={12} /> Save changes</> : <><FaPlus size={12} /> Add note</>}
            </button>
          </div>
        </div>

        {/* ── Search bar ── */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search notes or date (yyyy-mm-dd)…"
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-400"
            />
          </div>
          <button
            onClick={handleSearch}
            className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Search
          </button>
          {search && (
            <button
              onClick={clearSearch}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-500 transition hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-300"
            >
              <FaTimes size={12} />
            </button>
          )}
        </div>

        {/* ── Notes ── */}
        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400 dark:border-neutral-700 dark:bg-neutral-800">
            Loading notes…
          </div>
        ) : notes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center dark:border-neutral-700 dark:bg-neutral-800">
            <FaStickyNote className="mx-auto mb-3 text-gray-300 dark:text-neutral-600" size={36} />
            <p className="text-sm font-medium text-gray-400">No notes yet</p>
            <p className="mt-1 text-xs text-gray-300 dark:text-neutral-500">Add your first note above</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Pinned */}
            {pinned.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-yellow-500">
                  Pinned
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {pinned.map((note) => (
                    <NoteCard
                      key={note._id}
                      note={note}
                      isEditing={editingId === note._id}
                      onPin={handlePin}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Others */}
            {unpinned.length > 0 && (
              <div>
                {pinned.length > 0 && (
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    Others
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  {unpinned.map((note) => (
                    <NoteCard
                      key={note._id}
                      note={note}
                      isEditing={editingId === note._id}
                      onPin={handlePin}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Note Card ── */
const NoteCard = ({ note, isEditing, onPin, onEdit, onDelete, formatDate }) => (
  <div
    className={`group relative flex flex-col justify-between rounded-xl border p-4 shadow-sm transition
      ${note.isPinned
        ? "border-yellow-300 bg-yellow-50 dark:border-yellow-600/40 dark:bg-yellow-900/10"
        : "border-gray-200 bg-white hover:border-green-300 dark:border-neutral-700 dark:bg-neutral-800"
      }
      ${isEditing ? "ring-2 ring-green-500" : ""}
    `}
  >
    {note.isPinned && (
      <span className="absolute right-3 top-3 text-yellow-400">
        <FaThumbtack size={11} />
      </span>
    )}

    <p className="pr-5 text-sm leading-relaxed text-gray-800 dark:text-gray-100 break-words whitespace-pre-wrap">
      {note.note}
    </p>

    <div className="mt-4 flex items-center justify-between">
      <span className="text-xs text-gray-400 dark:text-gray-500">
        {formatDate(note.date || note.createdAt)}
      </span>

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={() => onPin(note._id)}
          title={note.isPinned ? "Unpin" : "Pin"}
          className={`rounded-md p-1.5 text-xs transition
            ${note.isPinned
              ? "text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
              : "text-gray-400 hover:bg-gray-100 hover:text-yellow-500 dark:hover:bg-neutral-700"
            }`}
        >
          <FaThumbtack />
        </button>
        <button
          onClick={() => onEdit(note)}
          title="Edit"
          className="rounded-md p-1.5 text-xs text-gray-400 transition hover:bg-gray-100 hover:text-green-600 dark:hover:bg-neutral-700"
        >
          <FaEdit />
        </button>
        <button
          onClick={() => onDelete(note._id)}
          title="Delete"
          className="rounded-md p-1.5 text-xs text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  </div>
);

export default Notepad;
