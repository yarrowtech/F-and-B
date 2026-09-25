import { useEffect, useMemo, useRef, useState } from "react";
import socket from "../../socket/socket";
import {
  saveTableLayout,
  mergeTables as apiMergeTables,
  unmergeTables as apiUnmergeTables,
} from "../../services/table.service";
import {
  getFloorMarkers,
  createFloorMarker,
  updateFloorMarker,
  deleteFloorMarker,
} from "../../services/floorMarker.service";
import {
  getFloorZoneSettings,
  saveFloorZoneSettings,
} from "../../services/floorZoneSettings.service";

const STATUS_STYLES = {
  available: "bg-green-500 border-green-600",
  occupied: "bg-red-500 border-red-600",
  reserved: "bg-amber-500 border-amber-600",
};

const STATUS_LABEL = {
  available: "Free",
  occupied: "Occupied",
  reserved: "Reserved",
};

const MARKER_TYPES = {
  entrance: { icon: "🚪", label: "Entrance", color: "bg-slate-700" },
  kitchen: { icon: "🍳", label: "Kitchen", color: "bg-orange-700" },
  bar: { icon: "🍸", label: "Bar", color: "bg-purple-700" },
  washroom: { icon: "🚻", label: "Washroom", color: "bg-sky-700" },
  wall: { icon: "🧱", label: "Wall", color: "bg-gray-600" },
  other: { icon: "📍", label: "Marker", color: "bg-slate-500" },
};

// Table box scales with capacity so a 6-seater visually stands out from a 2-seater
const sizeForCapacity = (capacity) => {
  const cap = Number(capacity) || 2;
  if (cap <= 2) return "h-14 w-14 sm:h-16 sm:w-16 text-[10px]";
  if (cap <= 4) return "h-16 w-16 sm:h-20 sm:w-20 text-[11px]";
  if (cap <= 6) return "h-20 w-20 sm:h-24 sm:w-24 text-xs";
  return "h-24 w-24 sm:h-28 sm:w-28 text-sm";
};

const snap = (v) => Math.round(v / 2) * 2;

const formatDuration = (from) => {
  if (!from) return "";
  const mins = Math.max(0, Math.floor((Date.now() - new Date(from).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

/**
 * Interactive Floor Plan
 *
 * Props:
 * - restaurantId
 * - tables: array of table docs (with activeOrder attached, as returned by getTables)
 * - editable: true = admin/manager drag-and-drop layout editing mode
 * - onRefresh: called after any change so parent can reload table data
 * - onTableClick: (table) => void, called when a table is tapped in view mode
 */
export default function FloorPlan({
  restaurantId,
  tables = [],
  editable = false,
  onRefresh,
  onTableClick,
}) {
  const floorRef = useRef(null);
  const [items, setItems] = useState(tables);
  const [dragId, setDragId] = useState(null);
  const [dragKind, setDragKind] = useState(null); // "table" | "marker"
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeZone, setActiveZone] = useState("All");
  const [selectedForMerge, setSelectedForMerge] = useState([]);
  const [, forceTick] = useState(0);

  const [markers, setMarkers] = useState([]);
  const [markersDirty, setMarkersDirty] = useState(false);
  const [showAddMarker, setShowAddMarker] = useState(false);

  const [editingTableId, setEditingTableId] = useState(null); // shape/rotation popover
  const [zoneSettings, setZoneSettings] = useState({}); // { zoneName: { widthFt, heightFt, backgroundImageUrl, backgroundOpacity } }
  const [showFloorSettings, setShowFloorSettings] = useState(false);
  const [floorSettingsForm, setFloorSettingsForm] = useState({
    widthFt: 40,
    heightFt: 25,
    backgroundImageUrl: "",
    backgroundOpacity: 0.6,
  });
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [bgError, setBgError] = useState("");

  useEffect(() => {
    // Only re-sync from the parent's table list when we don't have unsaved
    // local drag changes - otherwise releasing the mouse (which clears
    // dragId) would immediately snap the table back to its old position.
    if (!dirty) setItems(tables);
  }, [tables, dirty]);

  const loadMarkers = async () => {
    if (!restaurantId) return;
    try {
      const data = await getFloorMarkers(restaurantId);
      if (!markersDirty) setMarkers(data || []);
    } catch {
      // non-critical
    }
  };

  const loadZoneSettings = async () => {
    if (!restaurantId) return;
    try {
      const data = await getFloorZoneSettings(restaurantId);
      const map = {};
      (data || []).forEach((s) => {
        map[s.zone] = {
          widthFt: s.widthFt,
          heightFt: s.heightFt,
          backgroundImageUrl: s.backgroundImageUrl || "",
          backgroundOpacity: s.backgroundOpacity ?? 0.6,
        };
      });
      setZoneSettings(map);
    } catch {
      // non-critical, falls back to default 40x25 canvas
    }
  };

  useEffect(() => {
    loadMarkers();
    loadZoneSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // Live tick every 30s so seated-duration labels stay fresh
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  // Live updates from other open screens
  useEffect(() => {
    if (!restaurantId) return undefined;
    const handleChange = (payload) => {
      if (payload?.restaurantId === String(restaurantId)) onRefresh?.();
    };
    const handleMarkersChange = (payload) => {
      if (payload?.restaurantId === String(restaurantId)) loadMarkers();
    };
    const handleZoneSettingsChange = (payload) => {
      if (payload?.restaurantId === String(restaurantId)) loadZoneSettings();
    };
    socket.on("tables:statusUpdated", handleChange);
    socket.on("tables:layoutUpdated", handleChange);
    socket.on("tables:changed", handleChange);
    socket.on("floorMarkers:changed", handleMarkersChange);
    socket.on("floorZoneSettings:changed", handleZoneSettingsChange);
    return () => {
      socket.off("tables:statusUpdated", handleChange);
      socket.off("tables:layoutUpdated", handleChange);
      socket.off("tables:changed", handleChange);
      socket.off("floorMarkers:changed", handleMarkersChange);
      socket.off("floorZoneSettings:changed", handleZoneSettingsChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, onRefresh]);

  const zones = useMemo(() => {
    const set = new Set(items.map((t) => t.zone || "Main Hall"));
    return ["All", ...Array.from(set)];
  }, [items]);

  const visibleItems = useMemo(
    () => (activeZone === "All" ? items : items.filter((t) => (t.zone || "Main Hall") === activeZone)),
    [items, activeZone]
  );

  const visibleMarkers = useMemo(
    () => (activeZone === "All" ? markers : markers.filter((m) => (m.zone || "Main Hall") === activeZone)),
    [markers, activeZone]
  );

  // The physical dimensions of the zone currently shown, used to size the
  // canvas so it matches the real room proportions instead of one fixed shape.
  const currentDims = useMemo(() => {
    const key = activeZone === "All" ? "Main Hall" : activeZone;
    return zoneSettings[key] || { widthFt: 40, heightFt: 25, backgroundImageUrl: "", backgroundOpacity: 0.6 };
  }, [zoneSettings, activeZone]);

  const openFloorSettings = () => {
    setBgError("");
    setFloorSettingsForm(currentDims);
    setShowFloorSettings(true);
  };

  const applyZoneSettings = (saved) => {
    const zone = activeZone === "All" ? "Main Hall" : activeZone;
    setZoneSettings((prev) => ({
      ...prev,
      [zone]: {
        widthFt: saved.widthFt,
        heightFt: saved.heightFt,
        backgroundImageUrl: saved.backgroundImageUrl || "",
        backgroundOpacity: saved.backgroundOpacity ?? 0.6,
      },
    }));
  };

  const handleSaveFloorSettings = async () => {
    const zone = activeZone === "All" ? "Main Hall" : activeZone;
    const saved = await saveFloorZoneSettings(restaurantId, {
      zone,
      widthFt: Number(floorSettingsForm.widthFt) || 40,
      heightFt: Number(floorSettingsForm.heightFt) || 25,
      backgroundOpacity: Number(floorSettingsForm.backgroundOpacity) || 0.6,
    });
    applyZoneSettings(saved);
    setShowFloorSettings(false);
  };

  const MAX_BG_BYTES = 700 * 1024; // matches other image-upload limits in this app

  const handleBackgroundFile = async (file) => {
    setBgError("");
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      setBgError("Please choose a PNG, JPG, or WEBP image");
      return;
    }
    if (file.size > MAX_BG_BYTES) {
      setBgError("Image is too large (max 700 KB). Try a smaller photo or screenshot.");
      return;
    }
    try {
      setUploadingBackground(true);
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Could not read this image file"));
        reader.readAsDataURL(file);
      });
      const zone = activeZone === "All" ? "Main Hall" : activeZone;
      const saved = await saveFloorZoneSettings(restaurantId, {
        zone,
        widthFt: Number(floorSettingsForm.widthFt) || 40,
        heightFt: Number(floorSettingsForm.heightFt) || 25,
        backgroundOpacity: Number(floorSettingsForm.backgroundOpacity) || 0.6,
        imageDataUrl: dataUrl,
      });
      applyZoneSettings(saved);
      setFloorSettingsForm((f) => ({ ...f, backgroundImageUrl: saved.backgroundImageUrl }));
    } catch (err) {
      setBgError(err?.response?.data?.message || err.message || "Upload failed");
    } finally {
      setUploadingBackground(false);
    }
  };

  const handleRemoveBackground = async () => {
    const zone = activeZone === "All" ? "Main Hall" : activeZone;
    const saved = await saveFloorZoneSettings(restaurantId, {
      zone,
      widthFt: Number(floorSettingsForm.widthFt) || 40,
      heightFt: Number(floorSettingsForm.heightFt) || 25,
      removeBackground: true,
    });
    applyZoneSettings(saved);
    setFloorSettingsForm((f) => ({ ...f, backgroundImageUrl: "" }));
  };

  const handlePointerMove = (e) => {
    if (!dragId || !floorRef.current) return;
    const rect = floorRef.current.getBoundingClientRect();
    const x = snap(Math.min(94, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)));
    const y = snap(Math.min(88, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)));

    if (dragKind === "marker") {
      setMarkers((prev) =>
        prev.map((m) => (m._id === dragId ? { ...m, layout: { ...(m.layout || {}), x, y } } : m))
      );
      setMarkersDirty(true);
    } else {
      setItems((prev) =>
        prev.map((t) => (t._id === dragId ? { ...t, layout: { ...(t.layout || {}), x, y } } : t))
      );
      setDirty(true);
    }
  };

  const handlePointerUpGlobal = async () => {
    if (dragKind === "marker" && dragId && markersDirty) {
      const m = markers.find((mk) => mk._id === dragId);
      if (m) {
        try {
          await updateFloorMarker(restaurantId, m._id, { layout: m.layout });
        } catch {
          // ignore transient save error, user can still drag again
        }
      }
      setMarkersDirty(false);
    }
    setDragId(null);
    setDragKind(null);
  };

  const handleSaveLayout = async () => {
    try {
      setSaving(true);
      await saveTableLayout(
        restaurantId,
        items.map((t) => ({ _id: t._id, layout: t.layout, zone: t.zone || "Main Hall" }))
      );
      setDirty(false);
      onRefresh?.();
    } finally {
      setSaving(false);
    }
  };

  // Neatly lines up every table in the current zone into even rows/columns,
  // so people who don't want to hand-drag each table get a usable layout
  // in one click. Still editable afterwards like any dragged layout.
  const handleAutoArrange = () => {
    const zoneTables = visibleItems.length > 0 ? visibleItems : items;
    if (zoneTables.length === 0) return;

    const cols = Math.max(1, Math.ceil(Math.sqrt(zoneTables.length * 1.6)));
    const marginX = 8;
    const marginY = 10;
    const usableW = 100 - marginX * 2;
    const usableH = 84 - marginY;
    const rows = Math.ceil(zoneTables.length / cols);
    const stepX = cols > 1 ? usableW / (cols - 1) : 0;
    const stepY = rows > 1 ? usableH / (rows - 1) : 0;

    const positions = new Map();
    zoneTables.forEach((t, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = snap(cols > 1 ? marginX + col * stepX : 50);
      const y = snap(marginY + row * stepY);
      positions.set(t._id, { x, y });
    });

    setItems((prev) =>
      prev.map((t) =>
        positions.has(t._id)
          ? { ...t, layout: { ...(t.layout || {}), ...positions.get(t._id) } }
          : t
      )
    );
    setDirty(true);
  };

  const toggleMergeSelect = (id) => {
    setSelectedForMerge((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleMerge = async () => {
    if (selectedForMerge.length < 2) return;
    await apiMergeTables(restaurantId, selectedForMerge);
    setSelectedForMerge([]);
    onRefresh?.();
  };

  const handleUnmerge = async (mergedGroupId) => {
    await apiUnmergeTables(restaurantId, mergedGroupId);
    onRefresh?.();
  };

  const handleTap = (table) => {
    if (editable) return; // in edit mode, tap starts drag instead
    if (selectedForMerge.length > 0) {
      toggleMergeSelect(table._id);
      return;
    }
    onTableClick?.(table);
  };

  const handleAddMarker = async (type) => {
    const marker = await createFloorMarker(restaurantId, {
      type,
      label: MARKER_TYPES[type]?.label || "Marker",
      zone: activeZone === "All" ? "Main Hall" : activeZone,
      layout: { x: 45, y: 5, width: 10, height: 6, rotation: 0 },
    });
    setMarkers((prev) => [...prev, marker]);
    setShowAddMarker(false);
  };

  const handleDeleteMarker = async (id) => {
    await deleteFloorMarker(restaurantId, id);
    setMarkers((prev) => prev.filter((m) => m._id !== id));
  };

  return (
    <div>
      {/* Zone filter */}
      {zones.length > 2 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {zones.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setActiveZone(z)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                activeZone === z
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {z}
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-green-500" /> Free</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-red-500" /> Occupied</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-amber-500" /> Reserved</span>

        {editable && (
          <button
            type="button"
            onClick={handleAutoArrange}
            className="ml-auto rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300"
            title="Automatically line up all tables into neat rows"
          >
            ✨ Auto-Arrange
          </button>
        )}

        {editable && (
          <button
            type="button"
            onClick={openFloorSettings}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-gray-700 dark:text-gray-200"
          >
            📐 Floor Size ({currentDims.widthFt}×{currentDims.heightFt} ft)
          </button>
        )}

        {editable && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddMarker((v) => !v)}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-gray-700 dark:text-gray-200"
            >
              + Add Marker
            </button>
            {showAddMarker && (
              <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {Object.entries(MARKER_TYPES).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleAddMarker(key)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <span>{val.icon}</span> {val.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!editable && (
          <button
            type="button"
            onClick={() => setSelectedForMerge(selectedForMerge.length ? [] : [])}
            className="ml-auto rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300"
          >
            {selectedForMerge.length > 0 ? `Selected: ${selectedForMerge.length} (tap tables)` : "Tap here, then tables, to merge"}
          </button>
        )}
      </div>

      {selectedForMerge.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleMerge}
            disabled={selectedForMerge.length < 2}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            Merge {selectedForMerge.length} tables
          </button>
          <button
            type="button"
            onClick={() => setSelectedForMerge([])}
            className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-600 dark:border-gray-600 dark:text-gray-300"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Floor - aspect ratio matches the zone's real width x height in feet */}
      <div
        ref={floorRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpGlobal}
        onPointerLeave={handlePointerUpGlobal}
        style={{ aspectRatio: `${currentDims.widthFt} / ${currentDims.heightFt}` }}
        className="relative w-full touch-none overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-[linear-gradient(#e5e7eb_1px,transparent_1px),linear-gradient(90deg,#e5e7eb_1px,transparent_1px)] bg-[size:5%_8%] dark:border-gray-600 dark:bg-gray-900 dark:bg-[linear-gradient(#374151_1px,transparent_1px),linear-gradient(90deg,#374151_1px,transparent_1px)]"
      >
        {/* Real photo/blueprint of the room, traced underneath the tables */}
        {currentDims.backgroundImageUrl && (
          <img
            src={currentDims.backgroundImageUrl}
            alt="Floor background"
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
            style={{ opacity: currentDims.backgroundOpacity ?? 0.6 }}
            draggable={false}
          />
        )}

        {visibleItems.length === 0 && visibleMarkers.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No tables in this zone yet
          </div>
        )}

        {/* Fixed landmarks: entrance, kitchen, bar, wall... */}
        {visibleMarkers.map((m) => {
          const meta = MARKER_TYPES[m.type] || MARKER_TYPES.other;
          return (
            <div
              key={m._id}
              onPointerDown={(e) => {
                if (!editable) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                setDragId(m._id);
                setDragKind("marker");
              }}
              style={{
                left: `${m.layout?.x ?? 5}%`,
                top: `${m.layout?.y ?? 5}%`,
                width: `${m.layout?.width ?? 10}%`,
                minHeight: "2.25rem",
              }}
              className={`group absolute flex items-center justify-center gap-1 rounded-lg border-2 border-dashed border-white/40 px-2 py-1.5 text-[11px] font-semibold text-white shadow-sm ${meta.color} ${editable ? "cursor-move" : ""}`}
            >
              <span>{meta.icon}</span>
              <span className="truncate">{m.label || meta.label}</span>
              {editable && (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => handleDeleteMarker(m._id)}
                  className="ml-1 hidden rounded bg-black/30 px-1 leading-none group-hover:inline-block"
                  title="Remove marker"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}

        {visibleItems.map((t) => {
          const shape = t.layout?.shape || "square";
          const merged = Boolean(t.mergedGroupId);
          const selected = selectedForMerge.includes(t._id);

          return (
            <div
              key={t._id}
              className="absolute"
              style={{ left: `${t.layout?.x ?? 5}%`, top: `${t.layout?.y ?? 5}%` }}
            >
              <button
                type="button"
                onPointerDown={(e) => {
                  if (!editable) return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setDragId(t._id);
                  setDragKind("table");
                }}
                onClick={() => handleTap(t)}
                style={{ transform: `rotate(${t.layout?.rotation ?? 0}deg)` }}
                className={`relative flex flex-col items-center justify-center gap-0.5 border-2 font-bold text-white shadow-md transition
                  ${sizeForCapacity(t.capacity)}
                  ${shape === "round" ? "rounded-full" : shape === "rect" ? "!w-28 rounded-lg" : "rounded-xl"}
                  ${STATUS_STYLES[t.status] || "bg-gray-400 border-gray-500"}
                  ${editable ? "cursor-move" : "cursor-pointer hover:scale-105"}
                  ${selected ? "ring-4 ring-indigo-400" : ""}
                  ${merged ? "outline outline-2 outline-offset-2 outline-purple-400" : ""}
                `}
                title={STATUS_LABEL[t.status]}
              >
                <span>T{t.tableNumber}</span>
                <span className="font-normal opacity-90">{t.capacity} seats</span>
                {t.status === "occupied" && t.occupiedAt && (
                  <span className="rounded bg-black/25 px-1 font-normal">{formatDuration(t.occupiedAt)}</span>
                )}
                {t.status === "reserved" && t.reservation?.reservedFor && (
                  <span className="rounded bg-black/25 px-1 font-normal">
                    {new Date(t.reservation.reservedFor).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                {merged && <span className="rounded bg-purple-700/80 px-1 font-normal">merged</span>}
              </button>

              {editable && (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTableId((cur) => (cur === t._id ? null : t._id));
                  }}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white text-[11px] text-gray-600 shadow hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  title="Edit shape & rotation"
                >
                  ⚙
                </button>
              )}

              {editable && editingTableId === t._id && (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute left-1/2 top-full z-30 mt-2 w-44 -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-xl dark:border-gray-700 dark:bg-gray-800"
                >
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Shape</p>
                  <div className="mb-3 flex gap-1.5">
                    {["square", "round", "rect"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setItems((prev) =>
                            prev.map((it) => (it._id === t._id ? { ...it, layout: { ...(it.layout || {}), shape: s } } : it))
                          );
                          setDirty(true);
                        }}
                        className={`flex-1 rounded-lg border px-2 py-1 text-[11px] font-semibold capitalize ${
                          (t.layout?.shape || "square") === s
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                            : "border-gray-200 text-gray-600 dark:border-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Rotation: {t.layout?.rotation ?? 0}°
                  </p>
                  <input
                    type="range"
                    min="0"
                    max="315"
                    step="45"
                    value={t.layout?.rotation ?? 0}
                    onChange={(e) => {
                      const rotation = Number(e.target.value);
                      setItems((prev) =>
                        prev.map((it) => (it._id === t._id ? { ...it, layout: { ...(it.layout || {}), rotation } } : it))
                      );
                      setDirty(true);
                    }}
                    className="w-full accent-indigo-600"
                  />

                  <button
                    type="button"
                    onClick={() => setEditingTableId(null)}
                    className="mt-3 w-full rounded-lg bg-gray-100 py-1.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Merged groups quick unmerge list */}
      {(() => {
        const groups = {};
        items.forEach((t) => {
          if (t.mergedGroupId) {
            groups[t.mergedGroupId] = groups[t.mergedGroupId] || [];
            groups[t.mergedGroupId].push(t);
          }
        });
        const groupEntries = Object.entries(groups);
        if (groupEntries.length === 0) return null;
        return (
          <div className="mt-3 flex flex-wrap gap-2">
            {groupEntries.map(([groupId, group]) => (
              <div key={groupId} className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                Merged: {group.map((t) => `T${t.tableNumber}`).join(" + ")}
                <button type="button" onClick={() => handleUnmerge(groupId)} className="text-purple-500 hover:text-purple-800">
                  Split
                </button>
              </div>
            ))}
          </div>
        );
      })()}

      {editable && (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveLayout}
            disabled={!dirty || saving}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Layout"}
          </button>
          <span className="text-xs text-gray-400">
            Click ✨ Auto-Arrange for an instant layout, or drag tables yourself. Markers save automatically when dropped.
          </span>
        </div>
      )}

      {showFloorSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFloorSettings(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-gray-800">
            <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-white">Floor Size</h3>
            <p className="mb-4 text-xs text-gray-400">
              Set the real width x height of "{activeZone === "All" ? "Main Hall" : activeZone}" in feet, so the map
              matches your room's actual shape.
            </p>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">Width (ft)</label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={floorSettingsForm.widthFt}
                  onChange={(e) => setFloorSettingsForm((f) => ({ ...f, widthFt: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">Height (ft)</label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={floorSettingsForm.heightFt}
                  onChange={(e) => setFloorSettingsForm((f) => ({ ...f, heightFt: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="mb-4 border-t border-gray-100 pt-4 dark:border-gray-700">
              <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                Background photo / blueprint
              </label>
              <p className="mb-2 text-[11px] text-gray-400">
                Upload a real photo or sketch of this room. Tables are dragged directly on top of it.
              </p>

              {floorSettingsForm.backgroundImageUrl ? (
                <div className="mb-2">
                  <img
                    src={floorSettingsForm.backgroundImageUrl}
                    alt="Floor background preview"
                    className="mb-2 h-28 w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveBackground}
                    className="text-xs font-semibold text-red-600 hover:text-red-800"
                  >
                    Remove background image
                  </button>
                </div>
              ) : (
                <label className="mb-2 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-4 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  {uploadingBackground ? "Uploading…" : "Click to choose a photo (PNG/JPG, max 700 KB)"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={uploadingBackground}
                    onChange={(e) => handleBackgroundFile(e.target.files?.[0])}
                  />
                </label>
              )}

              {bgError && <p className="mb-1 text-xs font-semibold text-red-600">{bgError}</p>}

              {floorSettingsForm.backgroundImageUrl && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Image visibility: {Math.round((floorSettingsForm.backgroundOpacity ?? 0.6) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={floorSettingsForm.backgroundOpacity ?? 0.6}
                    onChange={(e) => setFloorSettingsForm((f) => ({ ...f, backgroundOpacity: Number(e.target.value) }))}
                    className="w-full accent-indigo-600"
                  />
                  <p className="text-[11px] text-gray-400">Lower it so table boxes stay easy to see over the photo.</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowFloorSettings(false)}
                className="rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFloorSettings}
                className="rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
