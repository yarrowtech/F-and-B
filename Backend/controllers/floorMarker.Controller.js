import FloorMarker from "../models/FloorMarker.model.js";
import Restaurant from "../models/Restaurant.model.js";
import { getIO } from "../socket.js";

const emitMarkersChanged = (restaurantId) => {
  try {
    getIO().emit("floorMarkers:changed", { restaurantId: String(restaurantId) });
  } catch {
    // socket not initialized - ignore
  }
};

const checkRestaurant = async (restaurantId, res) => {
  const restaurant = await Restaurant.findById(restaurantId).select("restaurantType");
  if (!restaurant) {
    res.status(404).json({ success: false, message: "Restaurant not found" });
    return null;
  }
  if (restaurant.restaurantType === "MANUAL_ONLY") {
    res.status(409).json({
      success: false,
      message: "Table management is disabled for manual-only restaurants",
    });
    return null;
  }
  return restaurant;
};

/* ===============================
   GET MARKERS
=============================== */
const getMarkers = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const markers = await FloorMarker.find({ restaurant: restaurantId }).lean();
    res.json({ success: true, data: markers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   CREATE MARKER
=============================== */
const createMarker = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { type, label, zone, layout } = req.body;

    if (!(await checkRestaurant(restaurantId, res))) return;

    const marker = await FloorMarker.create({
      restaurant: restaurantId,
      type: type || "other",
      label: label || "",
      zone: zone || "Main Hall",
      layout: {
        x: Number(layout?.x ?? 5),
        y: Number(layout?.y ?? 5),
        width: Number(layout?.width ?? 10),
        height: Number(layout?.height ?? 6),
        rotation: Number(layout?.rotation ?? 0),
      },
      createdBy: req.user.id,
      createdByModel: req.user.userType === "ADMIN" ? "Admin" : "Employee",
    });

    emitMarkersChanged(restaurantId);

    res.status(201).json({ success: true, data: marker });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* ===============================
   UPDATE MARKER (move / rename)
=============================== */
const updateMarker = async (req, res) => {
  try {
    const { restaurantId, id } = req.params;
    const { type, label, zone, layout } = req.body;

    if (!(await checkRestaurant(restaurantId, res))) return;

    const updates = {};
    if (type !== undefined) updates.type = type;
    if (label !== undefined) updates.label = label;
    if (zone !== undefined) updates.zone = zone;
    if (layout !== undefined) {
      updates.layout = {
        x: Number(layout.x ?? 5),
        y: Number(layout.y ?? 5),
        width: Number(layout.width ?? 10),
        height: Number(layout.height ?? 6),
        rotation: Number(layout.rotation ?? 0),
      };
    }

    const marker = await FloorMarker.findOneAndUpdate(
      { _id: id, restaurant: restaurantId },
      updates,
      { new: true }
    );

    if (!marker) {
      return res.status(404).json({ success: false, message: "Marker not found" });
    }

    emitMarkersChanged(restaurantId);

    res.json({ success: true, data: marker });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* ===============================
   DELETE MARKER
=============================== */
const deleteMarker = async (req, res) => {
  try {
    const { restaurantId, id } = req.params;

    const marker = await FloorMarker.findOneAndDelete({ _id: id, restaurant: restaurantId });
    if (!marker) {
      return res.status(404).json({ success: false, message: "Marker not found" });
    }

    emitMarkersChanged(restaurantId);

    res.json({ success: true, message: "Marker deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export default {
  getMarkers,
  createMarker,
  updateMarker,
  deleteMarker,
};
