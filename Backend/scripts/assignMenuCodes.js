import "dotenv/config";
import connectDB from "../config/db.js";
import Menu from "../models/Menu.model.js";

const normalizeMenuCode = (value) => String(value || "").trim();
const isValidMenuCode = (value) => /^\d+$/.test(normalizeMenuCode(value));

const getNextAvailableCode = (usedCodes) => {
  for (let code = 1; code <= 999999; code += 1) {
    const nextCode = String(code);
    if (!usedCodes.has(nextCode)) return nextCode;
  }
  throw new Error("No menu codes available");
};

const run = async () => {
  await connectDB();

  const menus = await Menu.find({})
    .select("_id restaurant menuCode createdAt")
    .sort({ restaurant: 1, createdAt: 1, _id: 1 });

  const usedByRestaurant = new Map();
  let updatedCount = 0;

  for (const menu of menus) {
    const restaurantId = String(menu.restaurant);
    const usedCodes =
      usedByRestaurant.get(restaurantId) || new Set();

    if (isValidMenuCode(menu.menuCode) && !usedCodes.has(menu.menuCode)) {
      usedCodes.add(menu.menuCode);
      usedByRestaurant.set(restaurantId, usedCodes);
      continue;
    }

    const nextCode = getNextAvailableCode(usedCodes);
    menu.menuCode = nextCode;
    await menu.save();
    usedCodes.add(nextCode);
    usedByRestaurant.set(restaurantId, usedCodes);
    updatedCount += 1;

    console.log(`Assigned code ${nextCode} -> menu ${menu._id}`);
  }

  console.log(`Done. Updated ${updatedCount} menu item(s).`);
  process.exit(0);
};

run().catch((error) => {
  console.error("Failed to assign menu codes:", error.message);
  process.exit(1);
});
