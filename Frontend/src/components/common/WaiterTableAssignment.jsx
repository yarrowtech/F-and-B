import { useCallback, useEffect, useMemo, useState } from "react";
import { getWaiterAssignments, setWaiterAssignments } from "../../services/waiterTable.service";

const REASON_PRESETS = ["Waiter absent", "Crowded", "Event / party", "Break cover"];

const idOf = (value) => String(value?._id || value || "");

/* Admin / manager: decide which waiter looks after which tables.
   Tables and waiters are many-to-many. A waiter with no tables simply works as before. */
export default function WaiterTableAssignment({ restaurantId, tables = [] }) {
  const [waiters, setWaiters] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [editing, setEditing] = useState(null); // waiter being edited
  const [draft, setDraft] = useState({}); // tableId -> { type, reason }
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    try {
      setLoading(true);
      setError("");
      const data = await getWaiterAssignments(restaurantId);
      setWaiters(data.waiters);
      setAssignments(data.assignments);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load waiter tables");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const tableNumberById = useMemo(
    () => new Map(tables.map((table) => [table._id, table.tableNumber])),
    [tables]
  );

  const byWaiter = useMemo(() => {
    const map = new Map();
    assignments.forEach((item) => {
      const key = idOf(item.waiter);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return map;
  }, [assignments]);

  const byTable = useMemo(() => {
    const map = new Map();
    assignments.forEach((item) => {
      const key = idOf(item.table);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return map;
  }, [assignments]);

  const assignedWaiters = waiters.filter((waiter) => (byWaiter.get(waiter._id) || []).length > 0);

  const waiterName = (id) => waiters.find((waiter) => waiter._id === id)?.name || "Waiter";

  const openEditor = (waiter) => {
    const next = {};
    (byWaiter.get(waiter._id) || []).forEach((item) => {
      next[idOf(item.table)] = { type: item.type, reason: item.reason || "" };
    });
    setDraft(next);
    setEditing(waiter);
  };

  // none -> regular -> extra -> none
  const cycleTable = (tableId) => {
    setDraft((prev) => {
      const next = { ...prev };
      const current = next[tableId]?.type;
      if (!current) next[tableId] = { type: "REGULAR", reason: "" };
      else if (current === "REGULAR") next[tableId] = { type: "EXTRA", reason: next[tableId].reason || "" };
      else delete next[tableId];
      return next;
    });
  };

  const setReason = (tableId, reason) =>
    setDraft((prev) => ({ ...prev, [tableId]: { ...prev[tableId], reason } }));

  const handleSave = async () => {
    try {
      setSaving(true);
      await setWaiterAssignments(
        restaurantId,
        editing._id,
        Object.entries(draft).map(([table, value]) => ({ table, type: value.type, reason: value.reason }))
      );
      await load();
      setNotice(`Tables updated for ${editing.name}`);
      setEditing(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save tables");
    } finally {
      setSaving(false);
    }
  };

  const extraDraftIds = Object.keys(draft).filter((id) => draft[id].type === "EXTRA");

  if (!restaurantId) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-3 text-sm text-gray-600 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700">
        Waiters take orders on the tables assigned to them. They can still open other tables, but those
        orders are marked <b>Other table</b>. A waiter with no assigned tables works on every table as before.
      </div>

      {notice && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-300">
          {notice}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Waiter table assignment</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {assignedWaiters.length} of {waiters.length} waiters have assigned tables
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="h-9 rounded-lg bg-green-600 px-4 text-sm font-bold text-white hover:bg-green-700"
        >
          Assign table
        </button>
      </div>

      {/* CURRENT ASSIGNMENTS */}
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
        {loading && waiters.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">Loading...</p>
        ) : assignedWaiters.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No tables assigned yet. Every waiter can take orders on every table.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900/50 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Waiter</th>
                <th className="px-4 py-2 text-left font-semibold">Tables</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {assignedWaiters.map((waiter) => (
                <tr key={waiter._id}>
                  <td className="px-4 py-2">
                    <p className="font-semibold text-gray-900 dark:text-white">{waiter.name}</p>
                    <p className="text-xs text-gray-400">{waiter.employeeId}</p>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      {(byWaiter.get(waiter._id) || [])
                        .slice()
                        .sort((x, y) => Number(x.table?.tableNumber) - Number(y.table?.tableNumber))
                        .map((item) => (
                          <span
                            key={idOf(item.table)}
                            title={item.type === "EXTRA" ? item.reason || "Extra table" : "Regular table"}
                            className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                              item.type === "EXTRA"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            }`}
                          >
                            T{item.table?.tableNumber}
                            {item.type === "EXTRA" ? ` · ${item.reason || "extra"}` : ""}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => openEditor(waiter)}
                      className="text-xs font-bold text-green-700 hover:underline dark:text-green-400"
                    >
                      Change
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* WAITER LIST POP-UP */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPicker(false)} />
          <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-gray-800 sm:max-w-md sm:rounded-2xl">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select waiter</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Choose who to assign tables to.</p>
              </div>
              <button type="button" onClick={() => setShowPicker(false)} className="text-2xl leading-none text-gray-400 hover:text-gray-600" aria-label="Close">&times;</button>
            </div>
            {waiters.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">No waiters in this restaurant yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {waiters.map((waiter) => {
                  const count = (byWaiter.get(waiter._id) || []).length;
                  return (
                    <li key={waiter._id}>
                      <button
                        type="button"
                        onClick={() => { setShowPicker(false); openEditor(waiter); }}
                        className="flex w-full items-center justify-between gap-3 px-2 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">{waiter.name}</span>
                          <span className="block text-xs text-gray-400">{waiter.employeeId}</span>
                        </span>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${count > 0 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300"}`}>
                          {count > 0 ? `${count} table${count === 1 ? "" : "s"}` : "None"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* TABLE OVERVIEW */}
      {tables.length > 0 && (
        <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
          <p className="mb-2 text-sm font-bold text-gray-800 dark:text-gray-100">Who looks after each table</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tables.map((table) => {
              const owners = byTable.get(table._id) || [];
              return (
                <div
                  key={table._id}
                  className="rounded-lg bg-gray-50 px-3 py-2 text-xs dark:bg-gray-900/40"
                >
                  <p className="font-bold text-gray-800 dark:text-gray-100">T{table.tableNumber}</p>
                  {owners.length === 0 ? (
                    <p className="text-gray-400">Any waiter</p>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300">
                      {owners
                        .map(
                          (item) =>
                            `${waiterName(idOf(item.waiter))}${item.type === "EXTRA" ? " (extra)" : ""}`
                        )
                        .join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EDITOR */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && setEditing(null)} />
          <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-gray-800 sm:max-w-lg sm:rounded-2xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tables for {editing.name}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tap a table to cycle: none &rarr; regular &rarr; extra &rarr; none.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={saving}
                className="text-2xl leading-none text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="mb-3 flex flex-wrap gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-green-600" /> Regular</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-500" /> Extra (cover)</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-gray-200" /> Not assigned</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {tables.map((table) => {
                const type = draft[table._id]?.type;
                const others = (byTable.get(table._id) || []).filter(
                  (item) => idOf(item.waiter) !== editing._id
                ).length;
                return (
                  <button
                    key={table._id}
                    type="button"
                    onClick={() => cycleTable(table._id)}
                    title={others > 0 ? `${others} other waiter${others === 1 ? "" : "s"} also on this table` : ""}
                    className={`h-9 rounded-lg px-3 text-sm font-bold transition ${
                      type === "REGULAR"
                        ? "bg-green-600 text-white"
                        : type === "EXTRA"
                          ? "bg-amber-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                    }`}
                  >
                    T{table.tableNumber}
                    {others > 0 && <span className="ml-1 text-[10px] font-semibold opacity-80">+{others}</span>}
                  </button>
                );
              })}
            </div>

            {extraDraftIds.length > 0 && (
              <div className="mt-4 space-y-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/10">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                  Why are these extra tables given?
                </p>
                {extraDraftIds.map((tableId) => (
                  <div key={tableId} className="flex items-center gap-2">
                    <span className="w-10 shrink-0 text-sm font-bold text-gray-800 dark:text-gray-100">
                      T{tableNumberById.get(tableId)}
                    </span>
                    <input
                      list="waiter-extra-reasons"
                      value={draft[tableId].reason}
                      maxLength={120}
                      onChange={(e) => setReason(tableId, e.target.value)}
                      placeholder="e.g. Waiter absent"
                      className="h-9 min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-3 text-sm dark:border-amber-900/40 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                ))}
                <datalist id="waiter-extra-reasons">
                  {REASON_PRESETS.map((reason) => (
                    <option key={reason} value={reason} />
                  ))}
                </datalist>
              </div>
            )}

            <div className="mt-5 grid grid-cols-[auto_1fr_1fr] gap-2">
              <button
                type="button"
                onClick={() => setDraft({})}
                disabled={saving || Object.keys(draft).length === 0}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-900/20"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={saving}
                className="rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save tables"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
