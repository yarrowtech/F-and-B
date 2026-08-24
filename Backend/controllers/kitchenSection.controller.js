import KitchenSection from "../models/KitchenSection.model.js";
import Menu from "../models/Menu.model.js";
import Employee from "../models/Employee.model.js";

/* ================= HELPER ================= */

const sendSuccess = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, message });

const getRestaurantId = (req) =>
  String(req.user.role || "").toLowerCase() === "admin"
    ? req.params.restaurantId
    : req.user.restaurant;

/* ================= LIST ================= */
/* GET /api/kitchen-sections/:restaurantId */

export const getKitchenSections = async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    if (!restaurantId) return sendError(res, "restaurantId is required");

    const sections = await KitchenSection.find({ restaurant: restaurantId }).sort({
      name: 1,
    });

    return sendSuccess(res, sections);
  } catch (err) {
    return sendError(res, err.message);
  }
};

/* ================= CREATE ================= */
/* POST /api/kitchen-sections/:restaurantId */

export const createKitchenSection = async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    if (!restaurantId) return sendError(res, "restaurantId is required");

    const { name, printerQueueName } = req.body;
    if (!name || !name.trim())
      return sendError(res, "Section name is required");

    const section = await KitchenSection.create({
      restaurant: restaurantId,
      name: name.trim(),
      printerQueueName: String(printerQueueName || "").trim(),
    });

    return sendSuccess(res, section, 201);
  } catch (err) {
    if (err.code === 11000)
      return sendError(res, "A kitchen section with this name already exists");
    return sendError(res, err.message);
  }
};

/* ================= UPDATE ================= */
/* PUT /api/kitchen-sections/:restaurantId/:id */

export const updateKitchenSection = async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    if (!restaurantId) return sendError(res, "restaurantId is required");

    const section = await KitchenSection.findOne({
      _id: req.params.id,
      restaurant: restaurantId,
    });
    if (!section) return sendError(res, "Kitchen section not found", 404);

    const { name, printerQueueName } = req.body;
    if (name !== undefined) {
      if (!name.trim()) return sendError(res, "Section name is required");
      section.name = name.trim();
    }
    if (printerQueueName !== undefined) {
      section.printerQueueName = String(printerQueueName || "").trim();
    }

    await section.save();
    return sendSuccess(res, section);
  } catch (err) {
    if (err.code === 11000)
      return sendError(res, "A kitchen section with this name already exists");
    return sendError(res, err.message);
  }
};

/* ================= DELETE ================= */
/* DELETE /api/kitchen-sections/:restaurantId/:id */

export const deleteKitchenSection = async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    if (!restaurantId) return sendError(res, "restaurantId is required");

    const section = await KitchenSection.findOne({
      _id: req.params.id,
      restaurant: restaurantId,
    });
    if (!section) return sendError(res, "Kitchen section not found", 404);

    const [menuUsage, chefUsage] = await Promise.all([
      Menu.exists({ restaurant: restaurantId, cuisine: section._id }),
      Employee.exists({ restaurant: restaurantId, cuisineTypes: section._id }),
    ]);

    if (menuUsage || chefUsage) {
      return sendError(
        res,
        "This section is still in use by menu items or staff. Reassign them before deleting.",
        409
      );
    }

    await section.deleteOne();
    return sendSuccess(res, { id: req.params.id });
  } catch (err) {
    return sendError(res, err.message);
  }
};
