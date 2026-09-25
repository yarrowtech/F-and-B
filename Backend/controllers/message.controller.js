import mongoose from "mongoose";
import Admin from "../models/Admin.model.js";
import Employee from "../models/Employee.model.js";
import Vendor from "../models/Vendor.model.js";
import SuperAdmin from "../models/superAdmin.js";
import Restaurant from "../models/Restaurant.model.js";
import Message from "../models/Message.model.js";
import { getIO } from "../socket.js";

const toId = (v) => String(v?._id || v);

/* Restaurants the current user belongs to */
const getMyRestaurantIds = async (user) => {
  if (user.role === "admin") {
    const list = await Restaurant.find({ admin: user.id }).select("_id").lean();
    return list.map((r) => toId(r));
  }
  if (user.role === "vendor") {
    const ids = [user.restaurant, ...(user.accessibleRestaurants || [])]
      .filter(Boolean)
      .map(toId);
    return [...new Set(ids)];
  }
  return user.restaurant ? [toId(user.restaurant)] : [];
};

/* Everyone the current user is allowed to message */
const buildContacts = async (user, restaurantId = null) => {
  const contacts = [];

  if (user.role === "super_admin") {
    const admins = await Admin.find().select("businessName email").lean();
    return admins.map((a) => ({
      id: toId(a),
      role: "admin",
      name: a.businessName || a.email || "Admin",
    }));
  }

  let restaurantIds = await getMyRestaurantIds(user);
  if (restaurantId && restaurantIds.includes(String(restaurantId))) {
    restaurantIds = [String(restaurantId)];
  }
  const restaurants = await Restaurant.find({ _id: { $in: restaurantIds } })
    .select("admin")
    .lean();
  const adminIds = restaurants.map((r) => toId(r.admin)).filter(Boolean);

  if (user.role !== "admin") {
    const admins = await Admin.find({ _id: { $in: adminIds } })
      .select("businessName email")
      .lean();
    admins.forEach((a) =>
      contacts.push({ id: toId(a), role: "admin", name: a.businessName || a.email || "Admin" })
    );
  }

  if (user.role !== "vendor") {
    const employees = await Employee.find({
      restaurant: { $in: restaurantIds },
      isActive: { $ne: false },
      _id: { $ne: user.id },
    })
      .select("name email role")
      .lean();
    employees.forEach((e) =>
      contacts.push({
        id: toId(e),
        role: String(e.role).toLowerCase(),
        name: e.name || e.email || "Employee",
      })
    );
  }

  if (user.role === "admin") {
    const vendors = await Vendor.find({
      isActive: { $ne: false },
      $or: [
        { primaryRestaurant: { $in: restaurantIds } },
        { accessibleRestaurants: { $in: restaurantIds } },
      ],
    })
      .select("name email")
      .lean();
    vendors.forEach((v) =>
      contacts.push({ id: toId(v), role: "vendor", name: v.name || v.email || "Vendor" })
    );

    const supers = await SuperAdmin.find().select("email").lean();
    supers.forEach((s) =>
      contacts.push({ id: toId(s), role: "super_admin", name: "Super Admin" })
    );
  }

  return contacts;
};

const findContact = async (user, contactId) => {
  const contacts = await buildContacts(user);
  return contacts.find((c) => c.id === String(contactId)) || null;
};

/* only admins may flag a message as urgent */
const resolvePriority = (user, body) =>
  user.role === "admin" && body?.priority === "urgent" ? "urgent" : "normal";

const emitNew = (message) => {
  try {
    getIO().emit("message:new", {
      recipientId: String(message.recipient.id),
      senderId: String(message.sender.id),
      priority: message.priority || "normal",
    });
  } catch {
    // socket not initialized - ignore
  }
};

const GROUP_PREFIX = "group:";
const isGroupId = (id) => String(id).startsWith(GROUP_PREFIX);

/* Department (role) groups an admin can broadcast to */
const buildGroups = (contacts) => {
  const counts = new Map();
  contacts
    .filter((c) => c.role !== "admin" && c.role !== "super_admin")
    .forEach((c) => counts.set(c.role, (counts.get(c.role) || 0) + 1));

  return [...counts.entries()].map(([role, count]) => ({
    id: `${GROUP_PREFIX}${role}`,
    role: "department",
    groupRole: role,
    isGroup: true,
    memberCount: count,
    name: `All ${role.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}s`,
  }));
};

/* One entry per broadcast (a broadcast is stored once per recipient) */
const dedupeBroadcasts = (messages) => {
  const seen = new Set();
  return messages.filter((m) => {
    const key = String(m.broadcastId);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/* GET /api/messages/contacts */
const getContacts = async (req, res) => {
  try {
    const me = new mongoose.Types.ObjectId(req.user.id);
    const restaurantId = req.query.restaurantId || null;
    const contacts = await buildContacts(req.user, restaurantId);
    const groups = req.user.role === "admin" ? buildGroups(contacts) : [];
    const groupLast = new Map();
    if (groups.length) {
      const sent = await Message.find({
        "sender.id": me,
        broadcastId: { $ne: null },
        ...(restaurantId ? { restaurant: restaurantId } : {}),
      })
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();
      sent.forEach((m) => {
        if (!groupLast.has(m.groupRole)) groupLast.set(m.groupRole, m);
      });
    }

    const [unread, recent] = await Promise.all([
      Message.aggregate([
        { $match: { "recipient.id": me, readAt: null } },
        {
          $group: {
            _id: "$sender.id",
            count: { $sum: 1 },
            urgent: { $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] } },
          },
        },
      ]),
      Message.find({ $or: [{ "sender.id": me }, { "recipient.id": me }] })
        .sort({ createdAt: -1 })
        .limit(500)
        .lean(),
    ]);

    const unreadMap = new Map(unread.map((u) => [String(u._id), u.count]));
    const urgentMap = new Map(unread.map((u) => [String(u._id), u.urgent]));
    const lastMap = new Map();
    recent.forEach((m) => {
      const other = String(m.sender.id) === req.user.id ? m.recipient.id : m.sender.id;
      if (!lastMap.has(String(other))) lastMap.set(String(other), m);
    });

    const data = contacts
      .map((c) => ({
        ...c,
        unread: unreadMap.get(c.id) || 0,
        urgentUnread: urgentMap.get(c.id) || 0,
        lastMessage: lastMap.get(c.id)?.text || "",
        lastAt: lastMap.get(c.id)?.createdAt || null,
      }))
      .sort(
        (a, b) =>
          Math.sign(b.urgentUnread) - Math.sign(a.urgentUnread) ||
          new Date(b.lastAt || 0) - new Date(a.lastAt || 0)
      );

    const groupData = groups.map((g) => ({
      ...g,
      unread: 0,
      lastMessage: groupLast.get(g.groupRole)?.text || "",
      lastAt: groupLast.get(g.groupRole)?.createdAt || null,
    }));

    res.json({ success: true, data: [...groupData, ...data] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/messages/restaurants - restaurants the user can filter by */
const getRestaurants = async (req, res) => {
  try {
    const ids = await getMyRestaurantIds(req.user);
    const list = await Restaurant.find({ _id: { $in: ids } }).select("name").lean();
    res.json({
      success: true,
      data: list.map((r) => ({ id: toId(r), name: r.name || "Restaurant" })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/messages/unread-count */
const getUnreadCount = async (req, res) => {
  try {
    const filter = { "recipient.id": req.user.id, readAt: null };
    const [count, urgent] = await Promise.all([
      Message.countDocuments(filter),
      Message.countDocuments({ ...filter, priority: "urgent" }),
    ]);
    res.json({ success: true, data: { count, urgent } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/messages/:contactId - full thread, marks incoming as read */
const getThread = async (req, res) => {
  try {
    const { contactId } = req.params;

    if (isGroupId(contactId)) {
      if (req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Admins only" });
      }
      const sent = await Message.find({
        "sender.id": req.user.id,
        groupRole: contactId.slice(GROUP_PREFIX.length),
        broadcastId: { $ne: null },
        ...(req.query.restaurantId ? { restaurant: req.query.restaurantId } : {}),
      })
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();
      return res.json({ success: true, data: dedupeBroadcasts(sent).reverse() });
    }

    if (!mongoose.Types.ObjectId.isValid(contactId)) {
      return res.status(400).json({ success: false, message: "Invalid contact" });
    }
    if (!(await findContact(req.user, contactId))) {
      return res.status(403).json({ success: false, message: "Contact not allowed" });
    }

    await Message.updateMany(
      { "sender.id": contactId, "recipient.id": req.user.id, readAt: null },
      { readAt: new Date() }
    );

    const messages = await Message.find({
      $or: [
        { "sender.id": req.user.id, "recipient.id": contactId },
        { "sender.id": contactId, "recipient.id": req.user.id },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(500)
      .lean();

    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* POST /api/messages/:contactId  { text } */
const sendMessage = async (req, res) => {
  try {
    const { contactId } = req.params;
    const text = String(req.body?.text || "").trim();

    if (isGroupId(contactId)) {
      if (req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Admins only" });
      }
      if (!text) {
        return res.status(400).json({ success: false, message: "Message cannot be empty" });
      }
      const groupRole = contactId.slice(GROUP_PREFIX.length);
      const restaurantId = req.body?.restaurantId || null;
      const members = (await buildContacts(req.user, restaurantId)).filter((c) => c.role === groupRole);
      if (members.length === 0) {
        return res.status(404).json({ success: false, message: "No members in this department" });
      }

      const broadcastId = new mongoose.Types.ObjectId().toString();
      const sender = {
        id: req.user.id,
        role: req.user.role,
        name: req.user.name || "",
      };
      const docs = await Message.insertMany(
        members.map((m) => ({
          sender,
          recipient: { id: m.id, role: m.role, name: m.name },
          text: text.slice(0, 2000),
          broadcastId,
          groupRole,
          restaurant: restaurantId,
          priority: resolvePriority(req.user, req.body),
        }))
      );
      docs.forEach(emitNew);
      return res.status(201).json({ success: true, data: docs[0] });
    }

    if (!mongoose.Types.ObjectId.isValid(contactId)) {
      return res.status(400).json({ success: false, message: "Invalid contact" });
    }
    if (!text) {
      return res.status(400).json({ success: false, message: "Message cannot be empty" });
    }

    const contact = await findContact(req.user, contactId);
    if (!contact) {
      return res.status(403).json({ success: false, message: "Contact not allowed" });
    }

    const message = await Message.create({
      sender: {
        id: req.user.id,
        role: req.user.role,
        name: req.user.name || req.user.email || "",
      },
      recipient: { id: contact.id, role: contact.role, name: contact.name },
      text: text.slice(0, 2000),
      priority: resolvePriority(req.user, req.body),
    });

    emitNew(message);
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export default { getRestaurants, getContacts, getUnreadCount, getThread, sendMessage };
