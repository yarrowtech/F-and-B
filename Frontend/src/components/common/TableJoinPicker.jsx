/* Pick extra free tables to push together for one large group. */
export default function TableJoinPicker({
  tables = [],
  mainTableId = "",
  value = [],
  onChange,
  partySize = 0,
}) {
  const options = tables.filter(
    (table) => table.status === "available" && table._id !== mainTableId
  );

  if (!mainTableId || options.length === 0) return null;

  const mainTable = tables.find((table) => table._id === mainTableId);
  const totalSeats = [mainTable, ...value.map((id) => tables.find((table) => table._id === id))]
    .filter(Boolean)
    .reduce((sum, table) => sum + Number(table.capacity || 0), 0);
  const party = Number(partySize) || 0;
  const tooSmall = party > 0 && totalSeats < party;

  const toggle = (id) =>
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/60">
      <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
        Join tables <span className="font-normal text-slate-400">(large group, optional)</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((table) => {
          const on = value.includes(table._id);
          return (
            <button
              key={table._id}
              type="button"
              onClick={() => toggle(table._id)}
              className={`h-8 rounded-lg px-3 text-xs font-bold transition ${
                on
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-neutral-700"
              }`}
            >
              T{table.tableNumber}
              <span className="ml-1 font-medium opacity-70">({table.capacity})</span>
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <p
          className={`mt-2 text-xs font-semibold ${
            tooSmall ? "text-amber-600 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-300"
          }`}
        >
          {totalSeats} seats in total
          {party > 0 ? (tooSmall ? ` - still short for ${party} guests` : ` for ${party} guests`) : ""}
        </p>
      )}
    </div>
  );
}
