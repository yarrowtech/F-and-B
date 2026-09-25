import React, { useCallback, useEffect, useState } from "react";
import { FaBolt, FaEdit, FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import {
  createMessageTemplate,
  deleteMessageTemplate,
  getMessageTemplates,
  updateMessageTemplate,
} from "../../services/message.service";

const emptyForm = { title: "", text: "", priority: "normal" };

/* Admin quick-message templates: chips to insert + a manager modal. */
const QuickMessages = ({ onPick }) => {
  const [templates, setTemplates] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setTemplates(await getMessageTemplates());
    } catch {
      // chips just stay empty
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const save = async () => {
    if (!form.title.trim() || !form.text.trim()) {
      setError("Title and message are required");
      return;
    }
    try {
      if (editingId) await updateMessageTemplate(editingId, form);
      else await createMessageTemplate(form);
      reset();
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save template");
    }
  };

  const remove = async (id) => {
    try {
      await deleteMessageTemplate(id);
      if (editingId === id) reset();
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete template");
    }
  };

  const inputCls =
    "w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500";

  return (
    <>
      <div className="mb-2 flex items-center gap-2 overflow-x-auto pb-1">
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-500">
          <FaBolt className="text-amber-500" /> Quick
        </span>
        {templates.map((t) => (
          <button
            key={t._id}
            type="button"
            onClick={() => onPick(t)}
            title={t.text}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
              t.priority === "urgent"
                ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            {t.title}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs font-medium text-slate-500 hover:border-emerald-500 hover:text-emerald-600"
        >
          <FaPlus /> {templates.length ? "Manage" : "Add quick message"}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-5 py-4">
              <h3 className="text-base font-semibold">Quick messages</h3>
              <button
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto px-5 py-4">
              {templates.length === 0 && (
                <p className="text-sm text-slate-400">No quick messages yet. Add your first below.</p>
              )}
              {templates.map((t) => (
                <div
                  key={t._id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {t.title}
                      {t.priority === "urgent" && (
                        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                          Urgent
                        </span>
                      )}
                    </p>
                    <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{t.text}</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingId(t._id);
                      setForm({ title: t.title, text: t.text, priority: t.priority });
                      setError("");
                    }}
                    aria-label="Edit"
                    className="text-slate-400 hover:text-emerald-600"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => remove(t._id)}
                    aria-label="Delete"
                    className="text-slate-400 hover:text-red-600"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {editingId ? "Edit quick message" : "New quick message"}
              </p>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={60}
                placeholder="Title (e.g. Shift reminder)"
                className={inputCls}
              />
              <textarea
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                maxLength={2000}
                rows={3}
                placeholder="Message text. Use {name} to insert each person's name."
                className={inputCls}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.priority === "urgent"}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.checked ? "urgent" : "normal" })
                  }
                />
                Mark as urgent by default
              </label>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex justify-end gap-2">
                {editingId && (
                  <button
                    onClick={reset}
                    className="rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={save}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  {editingId ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickMessages;
