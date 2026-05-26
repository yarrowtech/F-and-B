import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicMenu } from "../services/publicMenu.service";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function PublicMenu() {
  const { restaurantId } = useParams();
  const [data, setData] = useState({ restaurant: null, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMenu = async () => {
      try {
        setLoading(true);
        setError("");
        const result = await getPublicMenu(restaurantId);
        setData({
          restaurant: result.restaurant || null,
          items: Array.isArray(result.items) ? result.items : [],
        });
      } catch (err) {
        setError(err.message || "Failed to load menu");
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, [restaurantId]);

  const groupedItems = useMemo(() => {
    return data.items.reduce((groups, item) => {
      const course = item.courseType || "Menu";
      groups[course] = groups[course] || [];
      groups[course].push(item);
      return groups;
    }, {});
  }, [data.items]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Menu
          </p>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">
            {data.restaurant?.name || "Restaurant Menu"}
          </h1>
          {data.restaurant?.phone && (
            <p className="mt-2 text-sm font-medium text-slate-500">
              {data.restaurant.phone}
            </p>
          )}
        </header>

        {loading ? (
          <div className="mt-5 rounded-2xl bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
            Loading menu...
          </div>
        ) : error ? (
          <div className="mt-5 rounded-2xl bg-white p-8 text-center text-sm font-semibold text-rose-600 shadow-sm ring-1 ring-slate-200">
            {error}
          </div>
        ) : data.items.length === 0 ? (
          <div className="mt-5 rounded-2xl bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
            No menu items available right now.
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {Object.entries(groupedItems).map(([course, items]) => (
              <section key={course} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                  {course}
                </h2>
                <div className="mt-3 divide-y divide-slate-100">
                  {items.map((item) => (
                    <article key={item._id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-4">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-slate-900">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                          {item.cuisine || "-"} | {item.courseType || "-"}
                        </p>
                      </div>
                      <p className="text-base font-black text-emerald-700">
                        {formatCurrency(item.price)}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
