import MessageTemplate from "../models/MessageTemplate.model.js";

const pickFields = (body = {}) => ({
  title: String(body.title || "").trim().slice(0, 60),
  text: String(body.text || "").trim().slice(0, 2000),
  priority: body.priority === "urgent" ? "urgent" : "normal",
});

const adminOnly = (req, res) => {
  if (req.user.role !== "admin") {
    res.status(403).json({ success: false, message: "Admins only" });
    return false;
  }
  return true;
};

/* GET /api/messages/templates */
const list = async (req, res) => {
  try {
    if (!adminOnly(req, res)) return;
    const data = await MessageTemplate.find({ admin: req.user.id }).sort({ createdAt: 1 }).lean();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* POST /api/messages/templates */
const create = async (req, res) => {
  try {
    if (!adminOnly(req, res)) return;
    const fields = pickFields(req.body);
    if (!fields.title || !fields.text) {
      return res.status(400).json({ success: false, message: "Title and message are required" });
    }
    const data = await MessageTemplate.create({ ...fields, admin: req.user.id });
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* PUT /api/messages/templates/:id */
const update = async (req, res) => {
  try {
    if (!adminOnly(req, res)) return;
    const fields = pickFields(req.body);
    if (!fields.title || !fields.text) {
      return res.status(400).json({ success: false, message: "Title and message are required" });
    }
    const data = await MessageTemplate.findOneAndUpdate(
      { _id: req.params.id, admin: req.user.id },
      fields,
      { new: true }
    );
    if (!data) return res.status(404).json({ success: false, message: "Template not found" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* DELETE /api/messages/templates/:id */
const remove = async (req, res) => {
  try {
    if (!adminOnly(req, res)) return;
    const data = await MessageTemplate.findOneAndDelete({ _id: req.params.id, admin: req.user.id });
    if (!data) return res.status(404).json({ success: false, message: "Template not found" });
    res.json({ success: true, message: "Template deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export default { list, create, update, remove };
