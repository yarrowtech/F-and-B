import KotDailyCounter from "../models/KotDailyCounter.model.js";

const KOT_TIMEZONE = "Asia/Kolkata";

export const getKotDateKey = (value = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: KOT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));

export const allocateDailyKotNumber = async ({
  restaurantId,
  printedAt = new Date(),
  session = null,
}) => {
  const dateKey = getKotDateKey(printedAt);
  const query = { restaurant: restaurantId, dateKey };
  const update = {
    $setOnInsert: { restaurant: restaurantId, dateKey },
    $inc: { lastSerial: 1 },
  };
  const options = { new: true, upsert: true };

  const counter = session
    ? await KotDailyCounter.findOneAndUpdate(query, update, { ...options, session })
    : await KotDailyCounter.findOneAndUpdate(query, update, options);

  return {
    dateKey,
    dailySerial: Number(counter?.lastSerial || 1),
  };
};
