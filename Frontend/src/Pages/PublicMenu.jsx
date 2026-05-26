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
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [cuisineFilter, setCuisineFilter] = useState("all");
  const [sortBy, setSortBy] = useState("course");

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

  const courses = useMemo(
    () => [...new Set(data.items.map((item) => item.courseType).filter(Boolean))],
    [data.items]
  );

  const cuisines = useMemo(
    () => [...new Set(data.items.map((item) => item.cuisine).filter(Boolean))],
    [data.items]
  );

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = data.items.filter((item) => {
      const matchesSearch = `${item.name} ${item.cuisine} ${item.courseType}`
        .toLowerCase()
        .includes(term);
      const matchesCourse =
        courseFilter === "all" || item.courseType === courseFilter;
      const matchesCuisine =
        cuisineFilter === "all" || item.cuisine === cuisineFilter;

      return matchesSearch && matchesCourse && matchesCuisine;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "priceLow") return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === "priceHigh") return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === "name") return String(a.name || "").localeCompare(String(b.name || ""));

      return (
        String(a.courseType || "").localeCompare(String(b.courseType || "")) ||
        String(a.cuisine || "").localeCompare(String(b.cuisine || "")) ||
        String(a.name || "").localeCompare(String(b.name || ""))
      );
    });
  }, [courseFilter, cuisineFilter, data.items, search, sortBy]);

  const groupedItems = useMemo(() => {
    return visibleItems.reduce((groups, item) => {
      const course = item.courseType || "Menu";
      groups[course] = groups[course] || [];
      groups[course].push(item);
      return groups;
    }, {});
  }, [visibleItems]);

  return (
    <main className="min-h-screen bg-[#f6f7f4] px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-sm">
          <div className="p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
              Digital Menu
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              {data.restaurant?.name || "Restaurant Menu"}
            </h1>
            {data.restaurant?.phone && (
              <p className="mt-2 text-sm font-medium text-slate-300">
                {data.restaurant.phone}
              </p>
            )}
          </div>
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
            <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search dish, cuisine, or course..."
                  className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white"
                />
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="all">All Courses</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
                <select
                  value={cuisineFilter}
                  onChange={(e) => setCuisineFilter(e.target.value)}
                  className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="all">All Cuisines</option>
                  {cuisines.map((cuisine) => (
                    <option key={cuisine} value={cuisine}>
                      {cuisine}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="course">Sort by Course</option>
                  <option value="name">Sort by Name</option>
                  <option value="priceLow">Price Low to High</option>
                  <option value="priceHigh">Price High to Low</option>
                </select>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setCourseFilter("all")}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${
                    courseFilter === "all"
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  All ({data.items.length})
                </button>
                {courses.map((course) => (
                  <button
                    key={course}
                    type="button"
                    onClick={() => setCourseFilter(course)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${
                      courseFilter === course
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {course}
                  </button>
                ))}
              </div>
            </section>

            {visibleItems.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
                No menu items match your filters.
              </div>
            ) : null}

            {Object.entries(groupedItems).map(([course, items]) => (
              <section key={course} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-3 bg-slate-100 px-4 py-3">
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-600">
                    {course}
                  </h2>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">
                    {items.length}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <article key={item._id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-4 py-4 transition hover:bg-slate-50">
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
