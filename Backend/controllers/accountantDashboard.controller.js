import Bill from "../models/Bill.model.js";

const getStartOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const getEndOfDay = (date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const buildDateRange = ({ filter = "today", from, to }) => {
  const now = new Date();
  const todayStart = getStartOfDay(now);

  if (filter === "custom" && from && to) {
    return {
      startDate: getStartOfDay(from),
      endDate: getEndOfDay(to),
    };
  }

  if (filter === "last7days") {
    const startDate = new Date(todayStart);
    startDate.setDate(startDate.getDate() - 6);
    return { startDate, endDate: getEndOfDay(now) };
  }

  if (filter === "lastmonth") {
    const startDate = new Date(todayStart);
    startDate.setDate(startDate.getDate() - 29);
    return { startDate, endDate: getEndOfDay(now) };
  }

  return {
    startDate: todayStart,
    endDate: getEndOfDay(now),
  };
};

export const getAccountantDashboard = async (req, res) => {
  try {
    const { restaurant, id } = req.user;
    const { filter = "today", from, to } = req.query;
    const { startDate, endDate } = buildDateRange({ filter, from, to });

    const paidMatch = {
      restaurant,
      accountant: id,
      paymentStatus: "PAID",
      paidAt: { $gte: startDate, $lte: endDate },
    };

    const [ownedBills, paidBills] = await Promise.all([
      Bill.find({
        restaurant,
        $or: [{ generatedBy: id }, { accountant: id }],
      })
        .populate({
          path: "order",
          populate: { path: "table", select: "tableNumber" },
        })
        .sort({ updatedAt: -1, createdAt: -1 }),
      Bill.find(paidMatch)
        .populate({
          path: "order",
          populate: { path: "table", select: "tableNumber" },
        })
        .sort({ paidAt: -1, updatedAt: -1 }),
    ]);

    const generatedBills = ownedBills.filter((bill) => {
      const generatedDate = bill.generatedAt || bill.createdAt || bill.updatedAt;
      if (!generatedDate) return false;
      return generatedDate >= startDate && generatedDate <= endDate;
    });

    const uniqueGeneratedBills = Array.from(
      new Map(generatedBills.map((bill) => [String(bill._id), bill])).values()
    );

    const totalRevenue = paidBills.reduce(
      (sum, bill) => sum + Number(bill.totalAmount || 0),
      0
    );

    const paymentSummary = paidBills.reduce(
      (acc, bill) => {
        const method = String(bill.paymentMethod || "").toUpperCase();
        const amount = Number(bill.totalAmount || 0);

        if (method === "CARD") {
          acc.cardCount += 1;
          acc.cardAmount += amount;
        } else if (method === "CASH") {
          acc.cashCount += 1;
          acc.cashAmount += amount;
        } else if (method === "UPI") {
          acc.upiCount += 1;
          acc.upiAmount += amount;
        }
        return acc;
      },
      {
        cashCount: 0,
        cashAmount: 0,
        cardCount: 0,
        cardAmount: 0,
        upiCount: 0,
        upiAmount: 0,
      }
    );

    res.json({
      success: true,
      filter,
      range: {
        startDate,
        endDate,
      },
      summary: {
        totalBillsGenerated: uniqueGeneratedBills.length,
        totalRevenue,
        cashCount: paymentSummary.cashCount,
        cashAmount: paymentSummary.cashAmount,
        cardCount: paymentSummary.cardCount,
        cardAmount: paymentSummary.cardAmount,
        upiCount: paymentSummary.upiCount,
        upiAmount: paymentSummary.upiAmount,
      },
      generatedBills: uniqueGeneratedBills,
      paidBills,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
