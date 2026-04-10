import Attendance from "../models/Attendance.model.js";
import Employee from "../models/Employee.model.js";
import ExcelJS from "exceljs";
import mongoose from "mongoose";

/* =====================================================
   HELPER: Restaurant-Level Filter
===================================================== */
const getRestaurantFilter = (req) => {
  if (req.user.role === "admin") return {};

  if (req.user.role === "MANAGER") {
    return {
      restaurant: new mongoose.Types.ObjectId(req.user.restaurant),
    };
  }

  return {
    employee: new mongoose.Types.ObjectId(req.user.id),
    restaurant: new mongoose.Types.ObjectId(req.user.restaurant),
  };
};

/* =====================================================
   HELPER: Own Filter
===================================================== */
const getOwnFilter = (req) => ({
  employee: new mongoose.Types.ObjectId(req.user.id),
  restaurant: new mongoose.Types.ObjectId(req.user.restaurant),
});

/* =====================================================
   HELPER: Day Range
===================================================== */
const getDayRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/* =====================================================
   CHECK IN
===================================================== */
export const checkIn = async (req, res) => {
  try {
    const now = new Date();
    const { start, end } = getDayRange(new Date());

    const existing = await Attendance.findOne({
      ...getOwnFilter(req),
      date: { $gte: start, $lte: end },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Already checked in today",
      });
    }

    const lateThreshold = new Date();
    lateThreshold.setHours(10, 0, 0, 0);

    const attendance = await Attendance.create({
      ...getOwnFilter(req),
      date: start,
      checkIn: now,
      status: "PRESENT",
      isLate: now > lateThreshold,
      location: {
        lat: req.body.lat,
        lng: req.body.lng,
      },
    });

    res.json({ success: true, data: attendance });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   CHECK OUT
===================================================== */
export const checkOut = async (req, res) => {
  try {
    const { start, end } = getDayRange(new Date());

    const attendance = await Attendance.findOne({
      ...getOwnFilter(req),
      date: { $gte: start, $lte: end },
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: "Check in first",
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: "Already checked out",
      });
    }

    attendance.checkOut = new Date();

    const diff = attendance.checkOut - attendance.checkIn;
    attendance.workHours =
      parseFloat((diff / (1000 * 60 * 60)).toFixed(2));

    await attendance.save();

    res.json({ success: true, data: attendance });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   TODAY ATTENDANCE
===================================================== */
export const getTodayAttendance = async (req, res) => {
  try {
    const { start, end } = getDayRange(new Date());

    const filter =
      req.query.type === "own"
        ? getOwnFilter(req)
        : getRestaurantFilter(req);

    const data = await Attendance.find({
      date: { $gte: start, $lte: end },
      ...filter,
    })
      .populate("employee", "name role department employeeId")
      .sort({ createdAt: -1 });

    res.json({ success: true, data });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   MONTHLY STATS (SUNDAY WORKING)
===================================================== */
export const getMonthlyAttendanceStats = async (req, res) => {
  try {
    const { month, type } = req.query;

    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Month is required (YYYY-MM)",
      });
    }

    const startDate = new Date(`${month}-01T00:00:00`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const totalMonthDays = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      0
    ).getDate();

    /* OWN: return stats for the logged-in user only */
    if (type === "own") {
      const ownRecords = await Attendance.find({
        employee: new mongoose.Types.ObjectId(req.user.id),
        restaurant: new mongoose.Types.ObjectId(req.user.restaurant),
        date: { $gte: startDate, $lt: endDate },
      });

      const totalPresent = ownRecords.filter((r) => r.status === "PRESENT").length;
      const attendancePercent =
        totalMonthDays === 0
          ? 0
          : ((totalPresent / totalMonthDays) * 100).toFixed(2);

      return res.json({
        success: true,
        totalDays: totalMonthDays,
        totalPresent,
        attendancePercent,
      });
    }

    /* TEAM: all employees in restaurant */
    const employees = await Employee.find({
      restaurant: req.user.restaurant,
    });

    const records = await Attendance.find({
      restaurant: req.user.restaurant,
      date: { $gte: startDate, $lt: endDate },
    });

    const totalEmployees = employees.length;
    const totalPossibleAttendance = totalEmployees * totalMonthDays;

    const totalPresent = records.filter(
      (r) => r.status === "PRESENT"
    ).length;

    const attendancePercent =
      totalPossibleAttendance === 0
        ? 0
        : ((totalPresent / totalPossibleAttendance) * 100).toFixed(2);

    res.json({
      success: true,
      totalEmployees,
      totalDays: totalMonthDays,
      totalPresent,
      attendancePercent,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   MONTHLY CHART
===================================================== */
export const getMonthlyChart = async (req, res) => {
  try {
    const { month, type } = req.query;

    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Month is required (YYYY-MM)",
      });
    }

    const startDate = new Date(`${month}-01T00:00:00`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    /* OWN: return flat list for the logged-in user */
    if (type === "own") {
      const ownRecords = await Attendance.find({
        employee: new mongoose.Types.ObjectId(req.user.id),
        restaurant: new mongoose.Types.ObjectId(req.user.restaurant),
        date: { $gte: startDate, $lt: endDate },
      }).sort({ date: 1 });

      const data = ownRecords.map((a) => ({
        date: a.date.toISOString().split("T")[0],
        status: a.status,
        checkIn: a.checkIn,
        checkOut: a.checkOut,
      }));

      return res.json({ success: true, data });
    }

    /* TEAM: employee grid for managers */
    const employees = await Employee.find({
      restaurant: req.user.restaurant,
    }).select("name role employeeId");

    const attendanceRecords = await Attendance.find({
      restaurant: req.user.restaurant,
      date: { $gte: startDate, $lt: endDate },
    });

    const daysInMonth = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      0
    ).getDate();

    const data = employees.map((emp) => {
      const days = {};

      for (let d = 1; d <= daysInMonth; d++) {
        days[d] = null;
      }

      attendanceRecords
        .filter((a) => a.employee.toString() === emp._id.toString())
        .forEach((a) => {
          const day = new Date(a.date).getDate();

          days[day] = {
            status: a.status,
            checkIn: a.checkIn,
            checkOut: a.checkOut,
          };
        });

      return {
        employeeId: emp.employeeId,
        name: emp.name,
        role: emp.role,
        days,
      };
    });

    res.json({ success: true, data });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   EXPORT DETAILED EXCEL
===================================================== */
export const exportAttendanceExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let filter = getRestaurantFilter(req);

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const records = await Attendance.find(filter)
      .populate("employee", "name role department employeeId")
      .sort({ date: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Attendance Details");

    sheet.columns = [
      { header: "Employee ID", key: "employeeId", width: 15 },
      { header: "Employee Name", key: "name", width: 20 },
      { header: "Department", key: "department", width: 15 },
      { header: "Role", key: "role", width: 15 },
      { header: "Date", key: "date", width: 15 },
      { header: "Check In", key: "checkIn", width: 15 },
      { header: "Check Out", key: "checkOut", width: 15 },
      { header: "Work Hours", key: "hours", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    records.forEach((r) => {
      sheet.addRow({
        employeeId: r.employee?.employeeId || "N/A",
        name: r.employee?.name,
        department: r.employee?.department,
        role: r.employee?.role,
        date: r.date.toISOString().split("T")[0],
        checkIn: r.checkIn
          ? new Date(r.checkIn).toLocaleTimeString()
          : "-",
        checkOut: r.checkOut
          ? new Date(r.checkOut).toLocaleTimeString()
          : "-",
        hours: r.workHours || 0,
        status: r.status,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=attendance-details.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};