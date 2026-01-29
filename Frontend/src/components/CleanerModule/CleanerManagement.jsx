import React, { useMemo, useState } from "react";
import { FaTable, FaWarehouse } from "react-icons/fa";

const CleanerManagement = () => {
  // --- Data ---
  const [tasks, setTasks] = useState([
    { id: 101, type: "Table", table: 1, status: "Pending" },
    { id: 102, type: "Table", table: 3, status: "Pending" },
    { id: 103, type: "Table", table: 5, status: "Cleaning" },
    { id: 201, type: "Floor", section: "Main Hall", status: "Pending" },
    { id: 202, type: "Floor", section: "Kitchen", status: "Cleaning" },
  ]);

  // --- Status Transitions ---
  const nextStatuses = {
    Pending: ["Cleaning"],
    Cleaning: ["Cleaned"],
    Cleaned: [],
  };

  const statusChip = (status) => {
    const base = "px-3 py-1 rounded-full text-xs font-semibold";
    switch (status) {
      case "Pending":
        return `${base} bg-red-100 text-red-700 dark:bg-red-700 dark:text-white`;
      case "Cleaning":
        return `${base} bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-white`;
      case "Cleaned":
        return `${base} bg-green-100 text-green-800 dark:bg-green-700 dark:text-white`;
      default:
        return `${base} bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-white`;
    }
  };

  const actionBtn = (status) => {
    const base = "px-3 py-1 rounded-full text-white text-sm transition shadow-sm";
    switch (status) {
      case "Cleaning":
        return `${base} bg-yellow-500 hover:bg-yellow-400`;
      case "Cleaned":
        return `${base} bg-green-600 hover:bg-green-500`;
      default:
        return `${base} bg-gray-500 hover:bg-gray-400`;
    }
  };

  // --- Derived ---
  const tableTasks = useMemo(() => tasks.filter((t) => t.type === "Table"), [tasks]);
  const floorTasks = useMemo(() => tasks.filter((t) => t.type === "Floor"), [tasks]);
  const activeTasks = useMemo(() => tasks.filter((t) => t.status !== "Cleaned"), [tasks]);

  const updateTaskStatus = (taskId, nextStatus) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task))
    );
  };

  const renderTask = (task) => (
    <article
      key={task.id}
      className="p-5 rounded-2xl border shadow-sm transition transform hover:scale-[1.01] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Task #{task.id}</div>
        <span className={statusChip(task.status)}>{task.status}</span>
      </div>
      {task.type === "Table" ? (
        <p>
          <span className="font-medium">Table:</span> {task.table}
        </p>
      ) : (
        <p>
          <span className="font-medium">Section:</span> {task.section}
        </p>
      )}

      {/* Show action buttons only for non-cleaned tasks */}
      {task.status !== "Cleaned" && nextStatuses[task.status]?.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mt-2">
          {nextStatuses[task.status].map((next) => (
            <button
              key={next}
              onClick={() => updateTaskStatus(task.id, next)}
              className={actionBtn(next)}
            >
              {next}
            </button>
          ))}
        </div>
      )}
    </article>
  );

  return (
    <div className="p-6 min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Cleaner Management</h1>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-gray-800 shadow">
          <span className="text-sm opacity-70">Total Active Tasks:</span>
          <span className="font-semibold">{activeTasks.length}</span>
        </div>
      </div>

      {/* Table Tasks */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
          <FaTable /> Table Cleaning Tasks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tableTasks.length === 0 ? (
            <p className="text-gray-500 italic dark:text-gray-400">No table cleaning tasks.</p>
          ) : (
            tableTasks.filter((t) => t.status !== "Cleaned").map(renderTask)
          )}
        </div>
      </section>

      {/* Floor Tasks */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
          <FaWarehouse /> Floor Cleaning Tasks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {floorTasks.length === 0 ? (
            <p className="text-gray-500 italic dark:text-gray-400">No floor cleaning tasks.</p>
          ) : (
            floorTasks.filter((t) => t.status !== "Cleaned").map(renderTask)
          )}
        </div>
      </section>
    </div>
  );
};

export default CleanerManagement;
