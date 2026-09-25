import FloorZoneSettings from "../models/FloorZoneSettings.model.js";
import Restaurant from "../models/Restaurant.model.js";
import { configureCloudinary } from "../config/cloudinary.js";
import { getIO } from "../socket.js";

const emitChanged = (restaurantId) => {
  try {
    getIO().emit("floorZoneSettings:changed", { restaurantId: String(restaurantId) });
  } catch {
    // socket not initialized - ignore
  }
};

const hasCloudinaryConfig = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

const isSupportedImageDataUrl = (value) =>
  /^data:image\/(png|jpe?g|webp);base64,/i.test(String(value || "").trim());

const uploadFloorBackground = async ({ imageDataUrl, restaurantId }) => {
  if (!isSupportedImageDataUrl(imageDataUrl)) {
    throw new Error("Floor background image must be PNG, JPG, JPEG, or WEBP");
  }

  const normalized = String(imageDataUrl).trim();

  if (!hasCloudinaryConfig()) {
    return { url: normalized, publicId: "" };
  }

  const cloudinary = configureCloudinary();

  try {
    const uploaded = await cloudinary.uploader.upload(normalized, {
      folder: `efnbmms/floor-plans/${restaurantId}`,
      resource_type: "image",
    });
    return { url: uploaded.secure_url || "", publicId: uploaded.public_id || "" };
  } catch (error) {
    console.error("Cloudinary floor background upload failed, saving inline image instead.", {
      restaurantId,
      message: error?.message,
    });
    return { url: normalized, publicId: "" };
  }
};

const removeFloorBackground = async (publicId) => {
  if (!publicId || !hasCloudinaryConfig()) return;
  const cloudinary = configureCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};

/* ===============================
   GET ALL ZONE SETTINGS FOR A RESTAURANT
=============================== */
const getZoneSettings = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const settings = await FloorZoneSettings.find({ restaurant: restaurantId }).lean();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   UPSERT ONE ZONE'S SIZE / BACKGROUND
=============================== */
const saveZoneSettings = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { zone, widthFt, heightFt, backgroundOpacity, imageDataUrl, removeBackground } = req.body;

    if (!zone) {
      return res.status(400).json({ success: false, message: "Zone name is required" });
    }

    const restaurant = await Restaurant.findById(restaurantId).select("restaurantType");
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    const updates = {
      widthFt: Number(widthFt) || 40,
      heightFt: Number(heightFt) || 25,
    };

    if (backgroundOpacity !== undefined) {
      const op = Number(backgroundOpacity);
      updates.backgroundOpacity = Number.isFinite(op) ? Math.min(1, Math.max(0.1, op)) : 0.6;
    }

    const existing = await FloorZoneSettings.findOne({ restaurant: restaurantId, zone });

    if (removeBackground) {
      if (existing?.backgroundImagePublicId) {
        await removeFloorBackground(existing.backgroundImagePublicId);
      }
      updates.backgroundImageUrl = "";
      updates.backgroundImagePublicId = "";
    } else if (imageDataUrl) {
      if (existing?.backgroundImagePublicId) {
        await removeFloorBackground(existing.backgroundImagePublicId);
      }
      const uploaded = await uploadFloorBackground({ imageDataUrl, restaurantId });
      updates.backgroundImageUrl = uploaded.url;
      updates.backgroundImagePublicId = uploaded.publicId;
    }

    const settings = await FloorZoneSettings.findOneAndUpdate(
      { restaurant: restaurantId, zone },
      updates,
      { new: true, upsert: true }
    );

    emitChanged(restaurantId);

    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export default {
  getZoneSettings,
  saveZoneSettings,
};
