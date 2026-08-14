import ProjectAnalyticsSession from "../models/ProjectAnalyticsSession.model.js";
import ProjectPageView from "../models/ProjectPageView.model.js";
import ProjectActivityEvent from "../models/ProjectActivityEvent.model.js";
import Admin from "../models/Admin.model.js";
import Vendor from "../models/Vendor.model.js";
import Employee from "../models/Employee.model.js";
import Restaurant from "../models/Restaurant.model.js";

const DEFAULT_DAYS = 7;
const MAX_DAYS = 30;
const EMPLOYEE_ROLES = new Set([
  "manager",
  "inventory_manager",
  "chef",
  "suchef",
  "waiter",
  "cleaner",
  "accountant",
]);

const getRangeStart = (days) => {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return since;
};

const parseDateInput = (value, endOfDay = false) => {
  if (!value) return null;

  const parsed = new Date(`${value}${endOfDay ? "T23:59:59.999" : "T00:00:00.000"}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const resolveRange = ({ days, startDate, endDate }) => {
  const parsedStart = parseDateInput(startDate, false);
  const parsedEnd = parseDateInput(endDate, true);

  if (parsedStart && parsedEnd && parsedStart <= parsedEnd) {
    return {
      days: null,
      since: parsedStart,
      until: parsedEnd,
      isCustom: true,
    };
  }

  const normalizedDays = Math.min(
    MAX_DAYS,
    Math.max(1, Number.parseInt(days, 10) || DEFAULT_DAYS)
  );

  return {
    days: normalizedDays,
    since: getRangeStart(normalizedDays),
    until: new Date(),
    isCustom: false,
  };
};

const normalizePath = (path = "/") => {
  const value = String(path || "/").trim();
  return value.startsWith("/") ? value : `/${value}`;
};

const normalizeRole = (role = "guest") => String(role || "guest").trim().toLowerCase();

const getUserType = (role = "guest") => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "admin") return "admin";
  if (normalizedRole === "vendor") return "vendor";
  if (EMPLOYEE_ROLES.has(normalizedRole)) return "employee";
  if (normalizedRole === "guest") return "guest";
  return "other";
};

const toTitleCase = (value = "") =>
  String(value || "")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const getRoleLabel = (role = "guest") => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "inventory_manager") return "Inventory Manager";
  if (normalizedRole === "suchef") return "Sous Chef";
  return toTitleCase(normalizedRole);
};

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "";
};

const detectDeviceType = (userAgent = "") => {
  const ua = String(userAgent).toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua)) return "tablet";
  if (/mobi|android|iphone|ipod/.test(ua)) return "mobile";
  return "desktop";
};

const detectBrowser = (userAgent = "") => {
  const ua = String(userAgent);
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\//.test(ua) || /Opera/.test(ua)) return "Opera";
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
  if (/Firefox\//.test(ua)) return "Firefox";
  return "Unknown";
};

const detectOs = (userAgent = "") => {
  const ua = String(userAgent);
  if (/Windows/i.test(ua)) return "Windows";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Mac OS X|Macintosh/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown";
};

const resolveIdentity = (req) => {
  const authUser = req.authUser || null;
  return {
    userId: authUser?.id || null,
    role: authUser?.role || "guest",
    isAuthenticated: Boolean(authUser?.id),
  };
};

const buildSessionMeta = (req, body = {}) => {
  const userAgent = req.headers["user-agent"] || "";
  return {
    deviceType: body.deviceType || detectDeviceType(userAgent),
    browser: body.browser || detectBrowser(userAgent),
    os: body.os || detectOs(userAgent),
    screenWidth: Number.isFinite(Number(body.screenWidth)) ? Number(body.screenWidth) : null,
    screenHeight: Number.isFinite(Number(body.screenHeight)) ? Number(body.screenHeight) : null,
    timezone: String(body.timezone || "").trim(),
    referrer: String(body.referrer || "").trim(),
    ipAddress: getClientIp(req),
  };
};

const incrementSessionDuration = (session) => {
  const end = session.endedAt || session.lastSeenAt || new Date();
  return Math.max(0, end.getTime() - new Date(session.startedAt).getTime());
};

const createActivityEvent = async ({
  sessionId,
  path = "/",
  identity,
  eventType,
  featureKey = "",
  featureLabel = "",
  details = {},
}) => {
  await ProjectActivityEvent.create({
    sessionId,
    userId: identity.userId,
    role: identity.role,
    isAuthenticated: identity.isAuthenticated,
    eventType,
    featureKey,
    featureLabel,
    path,
    details,
    occurredAt: new Date(),
  });
};

const escapeSpreadsheetValue = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toCell = (value) => {
  if (value === null || value === undefined) {
    return '<Cell><Data ss:Type="String"></Data></Cell>';
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }

  if (typeof value === "boolean") {
    return `<Cell><Data ss:Type="String">${value ? "Yes" : "No"}</Data></Cell>`;
  }

  return `<Cell><Data ss:Type="String">${escapeSpreadsheetValue(value)}</Data></Cell>`;
};

const buildWorksheet = (name, rows) => {
  const safeName = escapeSpreadsheetValue(name).slice(0, 31);
  const xmlRows = rows
    .map((row) => `<Row>${row.map((cell) => toCell(cell)).join("")}</Row>`)
    .join("");

  return `<Worksheet ss:Name="${safeName}"><Table>${xmlRows}</Table></Worksheet>`;
};

const buildRoleBreakdown = (items) => {
  const roleBreakdownMap = new Map();

  for (const item of items) {
    const role = normalizeRole(item.role);
    roleBreakdownMap.set(role, (roleBreakdownMap.get(role) || 0) + 1);
  }

  return Array.from(roleBreakdownMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
};

const buildUserDirectory = async (records = []) => {
  const adminIds = new Set();
  const vendorIds = new Set();
  const employeeIds = new Set();

  for (const record of records) {
    if (!record?.userId) continue;
    const userType = getUserType(record.role);
    if (userType === "admin") adminIds.add(String(record.userId));
    if (userType === "vendor") vendorIds.add(String(record.userId));
    if (userType === "employee") employeeIds.add(String(record.userId));
  }

  const [admins, vendors, employees] = await Promise.all([
    adminIds.size
      ? Admin.find({ _id: { $in: Array.from(adminIds) } })
          .select("_id adminId businessName email mobile")
          .lean()
      : [],
    vendorIds.size
      ? Vendor.find({ _id: { $in: Array.from(vendorIds) } })
          .select(
            "_id vendorId name email phone createdByAdmin primaryRestaurant accessibleRestaurants"
          )
          .lean()
      : [],
    employeeIds.size
      ? Employee.find({ _id: { $in: Array.from(employeeIds) } })
          .select("_id employeeId name role email phone createdBy restaurant isActive")
          .lean()
      : [],
  ]);

  const adminMap = new Map(
    admins.map((admin) => [String(admin._id), { ...admin, _id: String(admin._id) }])
  );
  const vendorMap = new Map(
    vendors.map((vendor) => [String(vendor._id), { ...vendor, _id: String(vendor._id) }])
  );
  const employeeMap = new Map(
    employees.map((employee) => [
      String(employee._id),
      { ...employee, _id: String(employee._id) },
    ])
  );

  const restaurantIds = new Set();
  const restaurantsFilterAdminIds = new Set(adminIds);

  for (const vendor of vendors) {
    if (vendor.primaryRestaurant) restaurantIds.add(String(vendor.primaryRestaurant));
    for (const restaurantId of vendor.accessibleRestaurants || []) {
      if (restaurantId) restaurantIds.add(String(restaurantId));
    }
    if (vendor.createdByAdmin) restaurantsFilterAdminIds.add(String(vendor.createdByAdmin));
  }

  for (const employee of employees) {
    if (employee.restaurant) restaurantIds.add(String(employee.restaurant));
    if (employee.createdBy) restaurantsFilterAdminIds.add(String(employee.createdBy));
  }

  const restaurants = await Restaurant.find({
    $or: [
      restaurantIds.size ? { _id: { $in: Array.from(restaurantIds) } } : null,
      restaurantsFilterAdminIds.size
        ? { admin: { $in: Array.from(restaurantsFilterAdminIds) } }
        : null,
    ].filter(Boolean),
  })
    .select("_id name restaurantCode admin isActive")
    .lean();

  const restaurantMap = new Map(
    restaurants.map((restaurant) => [
      String(restaurant._id),
      { ...restaurant, _id: String(restaurant._id), admin: String(restaurant.admin) },
    ])
  );

  const restaurantsByAdmin = new Map();
  for (const restaurant of restaurants) {
    const adminId = String(restaurant.admin);
    const current = restaurantsByAdmin.get(adminId) || [];
    current.push({
      ...restaurant,
      _id: String(restaurant._id),
      admin: adminId,
    });
    restaurantsByAdmin.set(adminId, current);
  }

  const adminIdsForEmployees = Array.from(
    new Set([
      ...Array.from(restaurantsByAdmin.keys()),
      ...Array.from(adminIds),
      ...employees
        .map((employee) => employee.createdBy && String(employee.createdBy))
        .filter(Boolean),
    ])
  );

  const employeeRosters = adminIdsForEmployees.length
    ? await Employee.find({ createdBy: { $in: adminIdsForEmployees } })
        .select("_id employeeId name role createdBy restaurant isActive")
        .lean()
    : [];

  const employeesByRestaurant = new Map();
  for (const employee of employeeRosters) {
    const restaurantId = employee.restaurant ? String(employee.restaurant) : "";
    if (!restaurantId) continue;
    const current = employeesByRestaurant.get(restaurantId) || [];
    current.push({
      ...employee,
      _id: String(employee._id),
      createdBy: employee.createdBy ? String(employee.createdBy) : "",
      restaurant: restaurantId,
    });
    employeesByRestaurant.set(restaurantId, current);
  }

  return {
    adminMap,
    vendorMap,
    employeeMap,
    restaurantMap,
    restaurantsByAdmin,
    employeesByRestaurant,
  };
};

const enrichRecordIdentity = (record, directory) => {
  const role = normalizeRole(record.role);
  const userType = getUserType(role);
  const base = {
    ...record,
    role,
    roleLabel: getRoleLabel(role),
    userType,
    displayId: record.userId || "",
    displayName: userType === "guest" ? "Guest" : "Unknown User",
    adminId: "",
    adminName: "",
    restaurantId: "",
    restaurantName: "",
  };

  if (!record.userId) {
    return base;
  }

  if (userType === "admin") {
    const admin = directory.adminMap.get(String(record.userId));
    const restaurants = directory.restaurantsByAdmin.get(String(record.userId)) || [];
    return {
      ...base,
      displayId: admin?.adminId || String(record.userId),
      displayName: admin?.businessName || "Admin",
      adminId: admin?.adminId || String(record.userId),
      adminName: admin?.businessName || "Admin",
      restaurantName: restaurants.map((restaurant) => restaurant.name).join(", "),
    };
  }

  if (userType === "vendor") {
    const vendor = directory.vendorMap.get(String(record.userId));
    const ownerAdmin = vendor?.createdByAdmin
      ? directory.adminMap.get(String(vendor.createdByAdmin))
      : null;
    const primaryRestaurant = vendor?.primaryRestaurant
      ? directory.restaurantMap.get(String(vendor.primaryRestaurant))
      : null;

    return {
      ...base,
      displayId: vendor?.vendorId || String(record.userId),
      displayName: vendor?.name || "Vendor",
      adminId: ownerAdmin?.adminId || "",
      adminName: ownerAdmin?.businessName || "",
      restaurantId: primaryRestaurant?._id || "",
      restaurantName: primaryRestaurant?.name || "",
    };
  }

  if (userType === "employee") {
    const employee = directory.employeeMap.get(String(record.userId));
    const restaurant = employee?.restaurant
      ? directory.restaurantMap.get(String(employee.restaurant))
      : null;
    const ownerAdmin = employee?.createdBy
      ? directory.adminMap.get(String(employee.createdBy))
      : restaurant?.admin
        ? directory.adminMap.get(String(restaurant.admin))
        : null;

    return {
      ...base,
      displayId: employee?.employeeId || String(record.userId),
      displayName: employee?.name || "Employee",
      adminId: ownerAdmin?.adminId || "",
      adminName: ownerAdmin?.businessName || "",
      restaurantId: restaurant?._id || "",
      restaurantName: restaurant?.name || "",
      staffRole: employee?.role || record.role,
    };
  }

  return base;
};

const buildAdminRestaurantEmployees = (users, directory) => {
  const adminKeys = new Set(
    users
      .filter((user) => user.userType === "admin" && user.userId)
      .map((user) => String(user.userId))
  );

  return Array.from(adminKeys)
    .map((adminObjectId) => {
      const admin = directory.adminMap.get(adminObjectId);
      const restaurants = (directory.restaurantsByAdmin.get(adminObjectId) || [])
        .map((restaurant) => {
          const employees = (directory.employeesByRestaurant.get(String(restaurant._id)) || [])
            .map((employee) => ({
              employeeObjectId: employee._id,
              employeeId: employee.employeeId,
              name: employee.name,
              role: normalizeRole(employee.role),
              roleLabel: getRoleLabel(employee.role),
              isActive: Boolean(employee.isActive),
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

          return {
            restaurantObjectId: restaurant._id,
            restaurantId: restaurant.restaurantCode,
            restaurantName: restaurant.name,
            employeeCount: employees.length,
            activeEmployeeCount: employees.filter((employee) => employee.isActive).length,
            employees,
          };
        })
        .sort((a, b) => a.restaurantName.localeCompare(b.restaurantName));

      return {
        adminObjectId,
        adminId: admin?.adminId || adminObjectId,
        adminName: admin?.businessName || "Admin",
        restaurantCount: restaurants.length,
        employeeCount: restaurants.reduce((sum, restaurant) => sum + restaurant.employeeCount, 0),
        restaurants,
      };
    })
    .sort((a, b) => a.adminName.localeCompare(b.adminName));
};

const buildUserSummaries = (sessions, activityEvents) => {
  const userMap = new Map();

  const ensureUser = (item) => {
    const key = `${item.userType}:${item.userId || item.displayId || "guest"}`;
    if (!userMap.has(key)) {
      userMap.set(key, {
        key,
        userId: item.userId || "",
        userType: item.userType,
        role: item.role,
        roleLabel: item.roleLabel || getRoleLabel(item.role),
        displayId: item.displayId || "",
        displayName: item.displayName || "",
        adminId: item.adminId || "",
        adminName: item.adminName || "",
        restaurantId: item.restaurantId || "",
        restaurantName: item.restaurantName || "",
        sessionCount: 0,
        activeSessions: 0,
        totalPageViews: 0,
        totalDurationSeconds: 0,
        avgDurationSeconds: 0,
        loginCount: 0,
        logoutCount: 0,
        lastLoginAt: null,
        lastLogoutAt: null,
        lastSeenAt: null,
      });
    }
    return userMap.get(key);
  };

  for (const session of sessions) {
    const user = ensureUser(session);
    user.sessionCount += 1;
    user.activeSessions += session.isActive ? 1 : 0;
    user.totalPageViews += session.pageViewCount || 0;
    user.totalDurationSeconds += session.durationSeconds || 0;

    if (!user.lastSeenAt || new Date(session.lastSeenAt || 0) > new Date(user.lastSeenAt)) {
      user.lastSeenAt = session.lastSeenAt || user.lastSeenAt;
    }

    if (session.loginAt && (!user.lastLoginAt || new Date(session.loginAt) > new Date(user.lastLoginAt))) {
      user.lastLoginAt = session.loginAt;
    }

    if (
      session.logoutAt &&
      (!user.lastLogoutAt || new Date(session.logoutAt) > new Date(user.lastLogoutAt))
    ) {
      user.lastLogoutAt = session.logoutAt;
    }
  }

  for (const event of activityEvents) {
    const user = ensureUser(event);
    if (event.eventType === "LOGIN") {
      user.loginCount += 1;
      if (!user.lastLoginAt || new Date(event.occurredAt) > new Date(user.lastLoginAt)) {
        user.lastLoginAt = event.occurredAt;
      }
    }
    if (event.eventType === "LOGOUT") {
      user.logoutCount += 1;
      if (!user.lastLogoutAt || new Date(event.occurredAt) > new Date(user.lastLogoutAt)) {
        user.lastLogoutAt = event.occurredAt;
      }
    }
  }

  return Array.from(userMap.values())
    .map((user) => ({
      ...user,
      avgDurationSeconds: user.sessionCount
        ? Math.round(user.totalDurationSeconds / user.sessionCount)
        : 0,
      currentlyLoggedIn: user.activeSessions > 0,
    }))
    .sort((a, b) => {
      if (b.currentlyLoggedIn !== a.currentlyLoggedIn) {
        return Number(b.currentlyLoggedIn) - Number(a.currentlyLoggedIn);
      }
      if (b.loginCount !== a.loginCount) return b.loginCount - a.loginCount;
      if (b.sessionCount !== a.sessionCount) return b.sessionCount - a.sessionCount;
      return a.displayName.localeCompare(b.displayName);
    });
};

const buildLiveStatus = (userSummaries) => {
  const seed = {
    totalLoggedInNow: 0,
    totalLoggedOut: 0,
    adminLoggedInNow: 0,
    adminLoggedOut: 0,
    vendorLoggedInNow: 0,
    vendorLoggedOut: 0,
    employeeLoggedInNow: 0,
    employeeLoggedOut: 0,
  };

  return userSummaries.reduce((acc, user) => {
    const loggedIn = user.currentlyLoggedIn;
    if (loggedIn) acc.totalLoggedInNow += 1;
    else acc.totalLoggedOut += 1;

    if (user.userType === "admin") {
      if (loggedIn) acc.adminLoggedInNow += 1;
      else acc.adminLoggedOut += 1;
    }

    if (user.userType === "vendor") {
      if (loggedIn) acc.vendorLoggedInNow += 1;
      else acc.vendorLoggedOut += 1;
    }

    if (user.userType === "employee") {
      if (loggedIn) acc.employeeLoggedInNow += 1;
      else acc.employeeLoggedOut += 1;
    }

    return acc;
  }, seed);
};

const buildExcelWorkbookXml = (dataset) => {
  const summaryRows = [
    ["Metric", "Value"],
    ["Range Type", dataset.range.isCustom ? "Custom" : "Preset"],
    ["Start Date", new Date(dataset.range.startDate).toISOString()],
    ["End Date", new Date(dataset.range.endDate).toISOString()],
    ["Exported At", new Date(dataset.range.exportedAt).toISOString()],
    ["Total Sessions", dataset.totals.totalSessions],
    ["Total Page Views", dataset.totals.totalPageViews],
    ["Home Page Visits", dataset.totals.homePageVisits],
    ["Active Sessions", dataset.totals.activeSessions],
    ["Authenticated Sessions", dataset.totals.authenticatedSessions],
    ["Guest Sessions", dataset.totals.guestSessions],
    ["Average Session Duration (sec)", dataset.totals.avgDurationSeconds],
    ["Total Logins", dataset.totals.totalLogins],
    ["Total Logouts", dataset.totals.totalLogouts],
    ["Users Logged In Now", dataset.liveStatus.totalLoggedInNow],
    ["Users Logged Out", dataset.liveStatus.totalLoggedOut],
    ["Admin Users Logged In", dataset.liveStatus.adminLoggedInNow],
    ["Vendor Users Logged In", dataset.liveStatus.vendorLoggedInNow],
    ["Employee Users Logged In", dataset.liveStatus.employeeLoggedInNow],
    ["Admin Sessions", dataset.roleTotals.admin.sessions],
    ["Admin Avg Duration (sec)", dataset.roleTotals.admin.avgDurationSeconds],
    ["Vendor Sessions", dataset.roleTotals.vendor.sessions],
    ["Vendor Avg Duration (sec)", dataset.roleTotals.vendor.avgDurationSeconds],
    ["Employee Sessions", dataset.roleTotals.employee.sessions],
    ["Employee Avg Duration (sec)", dataset.roleTotals.employee.avgDurationSeconds],
  ];

  const sessionsRows = [
    [
      "Session ID",
      "User Type",
      "Role",
      "User ID",
      "User Name",
      "Admin ID",
      "Admin Name",
      "Restaurant",
      "Authenticated",
      "Device",
      "Browser",
      "OS",
      "Entry Path",
      "Last Path",
      "Page Views",
      "Started At",
      "Login At",
      "Last Seen At",
      "Logout At",
      "Ended At",
      "Duration Seconds",
      "Active",
      "Timezone",
      "Referrer",
      "IP Address",
      "Screen Width",
      "Screen Height",
    ],
    ...dataset.sessions.map((session) => [
      session.sessionId,
      session.userType,
      session.roleLabel,
      session.displayId,
      session.displayName,
      session.adminId,
      session.adminName,
      session.restaurantName,
      session.isAuthenticated,
      session.deviceType,
      session.browser,
      session.os,
      session.entryPath,
      session.lastPath,
      session.pageViewCount,
      session.startedAt ? new Date(session.startedAt).toISOString() : "",
      session.loginAt ? new Date(session.loginAt).toISOString() : "",
      session.lastSeenAt ? new Date(session.lastSeenAt).toISOString() : "",
      session.logoutAt ? new Date(session.logoutAt).toISOString() : "",
      session.endedAt ? new Date(session.endedAt).toISOString() : "",
      session.durationSeconds,
      session.isActive,
      session.timezone,
      session.referrer,
      session.ipAddress,
      session.screenWidth,
      session.screenHeight,
    ]),
  ];

  const userSummaryRows = [
    [
      "User Type",
      "Role",
      "User ID",
      "User Name",
      "Admin ID",
      "Admin Name",
      "Restaurant",
      "Session Count",
      "Active Sessions",
      "Page Views",
      "Avg Duration Seconds",
      "Logins",
      "Logouts",
      "Currently Logged In",
      "Last Login At",
      "Last Logout At",
      "Last Seen At",
    ],
    ...dataset.userSummaries.map((user) => [
      user.userType,
      user.roleLabel,
      user.displayId,
      user.displayName,
      user.adminId,
      user.adminName,
      user.restaurantName,
      user.sessionCount,
      user.activeSessions,
      user.totalPageViews,
      user.avgDurationSeconds,
      user.loginCount,
      user.logoutCount,
      user.currentlyLoggedIn,
      user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : "",
      user.lastLogoutAt ? new Date(user.lastLogoutAt).toISOString() : "",
      user.lastSeenAt ? new Date(user.lastSeenAt).toISOString() : "",
    ]),
  ];

  const pageViewsRows = [
    [
      "Session ID",
      "User Type",
      "Role",
      "User ID",
      "User Name",
      "Path",
      "Title",
      "Device",
      "Browser",
      "OS",
      "Viewed At",
    ],
    ...dataset.pageViews.map((view) => [
      view.sessionId,
      view.userType,
      view.roleLabel,
      view.displayId,
      view.displayName,
      view.path,
      view.title,
      view.deviceType,
      view.browser,
      view.os,
      view.viewedAt ? new Date(view.viewedAt).toISOString() : "",
    ]),
  ];

  const activityRows = [
    [
      "Session ID",
      "User Type",
      "Role",
      "User ID",
      "User Name",
      "Event Type",
      "Feature Key",
      "Feature Label",
      "Path",
      "Occurred At",
      "Details",
    ],
    ...dataset.activityEvents.map((event) => [
      event.sessionId,
      event.userType,
      event.roleLabel,
      event.displayId,
      event.displayName,
      event.eventType,
      event.featureKey,
      event.featureLabel,
      event.path,
      event.occurredAt ? new Date(event.occurredAt).toISOString() : "",
      JSON.stringify(event.details || {}),
    ]),
  ];

  const topPagesRows = [
    ["Path", "Views", "Unique Sessions"],
    ...dataset.topPages.map((page) => [page.path, page.views, page.uniqueSessions]),
  ];

  const topFeaturesRows = [
    ["Feature Key", "Feature Label", "Count", "Roles"],
    ...dataset.topFeatures.map((feature) => [
      feature.featureKey,
      feature.featureLabel,
      feature.count,
      (feature.roles || []).join(", "),
    ]),
  ];

  const trendRows = [
    ["Date", "Page Views", "Sessions"],
    ...dataset.recentTrend.map((item) => [item.date, item.pageViews, item.sessions]),
  ];

  const adminRestaurantRows = [
    ["Admin ID", "Admin Name", "Restaurant ID", "Restaurant Name", "Employee ID", "Employee Name", "Employee Role", "Employee Active"],
    ...dataset.adminRestaurantEmployees.flatMap((admin) =>
      admin.restaurants.flatMap((restaurant) =>
        restaurant.employees.length
          ? restaurant.employees.map((employee) => [
              admin.adminId,
              admin.adminName,
              restaurant.restaurantId,
              restaurant.restaurantName,
              employee.employeeId,
              employee.name,
              employee.roleLabel,
              employee.isActive,
            ])
          : [[admin.adminId, admin.adminName, restaurant.restaurantId, restaurant.restaurantName, "", "", "", ""]]
      )
    ),
  ];

  const liveStatusRows = [
    ["Metric", "Value"],
    ["Total Logged In Now", dataset.liveStatus.totalLoggedInNow],
    ["Total Logged Out", dataset.liveStatus.totalLoggedOut],
    ["Admin Logged In Now", dataset.liveStatus.adminLoggedInNow],
    ["Admin Logged Out", dataset.liveStatus.adminLoggedOut],
    ["Vendor Logged In Now", dataset.liveStatus.vendorLoggedInNow],
    ["Vendor Logged Out", dataset.liveStatus.vendorLoggedOut],
    ["Employee Logged In Now", dataset.liveStatus.employeeLoggedInNow],
    ["Employee Logged Out", dataset.liveStatus.employeeLoggedOut],
  ];

  const worksheets = [
    buildWorksheet("Summary", summaryRows),
    buildWorksheet("Live Status", liveStatusRows),
    buildWorksheet("User Summary", userSummaryRows),
    buildWorksheet("Sessions", sessionsRows),
    buildWorksheet("Page Views", pageViewsRows),
    buildWorksheet("Activity Events", activityRows),
    buildWorksheet("Top Pages", topPagesRows),
    buildWorksheet("Top Features", topFeaturesRows),
    buildWorksheet("Traffic Trend", trendRows),
    buildWorksheet("Admin Restaurants", adminRestaurantRows),
  ].join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  ${worksheets}
</Workbook>`;
};

const getAnalyticsDataset = async ({ days, startDate, endDate }) => {
  const range = resolveRange({ days, startDate, endDate });
  const dateFilter = {
    $gte: range.since,
    $lte: range.until,
  };

  const [
    sessionsRaw,
    pageViewsRaw,
    totalPageViews,
    deviceBreakdown,
    browserBreakdown,
    topPagesRaw,
    recentViews,
    activityEventsRaw,
    topFeaturesRaw,
  ] = await Promise.all([
    ProjectAnalyticsSession.find({ startedAt: dateFilter })
      .select(
        "sessionId userId role isAuthenticated deviceType browser os entryPath lastPath pageViewCount screenWidth screenHeight timezone referrer ipAddress startedAt loginAt lastSeenAt logoutAt endedAt isActive"
      )
      .sort({ startedAt: -1 })
      .lean(),
    ProjectPageView.find({ viewedAt: dateFilter })
      .select(
        "sessionId userId role isAuthenticated path title deviceType browser os viewedAt"
      )
      .sort({ viewedAt: -1 })
      .lean(),
    ProjectPageView.countDocuments({ viewedAt: dateFilter }),
    ProjectAnalyticsSession.aggregate([
      { $match: { startedAt: dateFilter } },
      { $group: { _id: "$deviceType", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    ProjectAnalyticsSession.aggregate([
      { $match: { startedAt: dateFilter } },
      { $group: { _id: "$browser", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    ProjectPageView.aggregate([
      { $match: { viewedAt: dateFilter } },
      { $group: { _id: "$path", views: { $sum: 1 }, uniqueSessions: { $addToSet: "$sessionId" } } },
      { $sort: { views: -1, _id: 1 } },
      { $limit: 8 },
    ]),
    ProjectPageView.aggregate([
      { $match: { viewedAt: dateFilter } },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$viewedAt" },
            },
          },
          pageViews: { $sum: 1 },
          sessions: { $addToSet: "$sessionId" },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]),
    ProjectActivityEvent.find({ occurredAt: dateFilter })
      .select(
        "sessionId userId role isAuthenticated eventType featureKey featureLabel path details occurredAt"
      )
      .sort({ occurredAt: -1 })
      .lean(),
    ProjectActivityEvent.aggregate([
      {
        $match: {
          occurredAt: dateFilter,
          eventType: "FEATURE_USE",
          featureKey: { $ne: "" },
        },
      },
      {
        $group: {
          _id: {
            featureKey: "$featureKey",
            featureLabel: "$featureLabel",
          },
          count: { $sum: 1 },
          roles: { $addToSet: "$role" },
        },
      },
      { $sort: { count: -1, "_id.featureKey": 1 } },
      { $limit: 10 },
    ]),
  ]);

  const directory = await buildUserDirectory([
    ...sessionsRaw,
    ...pageViewsRaw,
    ...activityEventsRaw,
  ]);

  const sessions = sessionsRaw.map((session) => ({
    ...enrichRecordIdentity(session, directory),
    durationSeconds: Math.round(incrementSessionDuration(session) / 1000),
  }));
  const pageViews = pageViewsRaw.map((view) => enrichRecordIdentity(view, directory));
  const activityEvents = activityEventsRaw.map((event) => enrichRecordIdentity(event, directory));

  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((session) => session.isActive).length;
  const authenticatedSessions = sessions.filter((session) => session.isAuthenticated).length;
  const guestSessions = totalSessions - authenticatedSessions;
  const totalDurationMs = sessions.reduce(
    (sum, session) => sum + incrementSessionDuration(session),
    0
  );
  const avgDurationSeconds = totalSessions
    ? Math.round(totalDurationMs / totalSessions / 1000)
    : 0;

  const topPages = topPagesRaw.map((page) => ({
    path: page._id,
    views: page.views,
    uniqueSessions: page.uniqueSessions.length,
  }));

  const recentTrend = recentViews.map((item) => ({
    date: item._id.date,
    pageViews: item.pageViews,
    sessions: item.sessions.length,
  }));

  const homePageVisits = pageViews.filter((item) => item.path === "/").length;
  const loginEvents = activityEvents.filter((event) => event.eventType === "LOGIN");
  const logoutEvents = activityEvents.filter((event) => event.eventType === "LOGOUT");
  const adminSessions = sessions.filter((session) => session.userType === "admin");
  const vendorSessions = sessions.filter((session) => session.userType === "vendor");
  const employeeSessions = sessions.filter((session) => session.userType === "employee");
  const avgRoleDuration = (roleSessions) =>
    roleSessions.length
      ? Math.round(
          roleSessions.reduce((sum, session) => sum + incrementSessionDuration(session), 0) /
            roleSessions.length /
            1000
        )
      : 0;

  const userSummaries = buildUserSummaries(sessions, activityEvents);
  const adminRestaurantEmployees = buildAdminRestaurantEmployees(userSummaries, directory);
  const liveStatus = buildLiveStatus(userSummaries);

  return {
    range: {
      days: range.days,
      startDate: range.since,
      endDate: range.until,
      isCustom: range.isCustom,
      exportedAt: new Date(),
    },
    totals: {
      totalSessions,
      totalPageViews,
      homePageVisits,
      activeSessions,
      authenticatedSessions,
      guestSessions,
      avgDurationSeconds,
      totalLogins: loginEvents.length,
      totalLogouts: logoutEvents.length,
    },
    roleTotals: {
      admin: {
        sessions: adminSessions.length,
        avgDurationSeconds: avgRoleDuration(adminSessions),
      },
      vendor: {
        sessions: vendorSessions.length,
        avgDurationSeconds: avgRoleDuration(vendorSessions),
      },
      employee: {
        sessions: employeeSessions.length,
        avgDurationSeconds: avgRoleDuration(employeeSessions),
      },
    },
    liveStatus,
    breakdowns: {
      devices: deviceBreakdown.map((item) => ({
        label: item._id || "unknown",
        count: item.count,
      })),
      browsers: browserBreakdown.map((item) => ({
        label: item._id || "Unknown",
        count: item.count,
      })),
      roles: buildRoleBreakdown(sessions),
    },
    topPages,
    topFeatures: topFeaturesRaw.map((item) => ({
      featureKey: item._id.featureKey,
      featureLabel: item._id.featureLabel || item._id.featureKey,
      count: item.count,
      roles: item.roles.map((role) => getRoleLabel(role)),
    })),
    recentTrend,
    userSummaries,
    adminUsers: userSummaries.filter((user) => user.userType === "admin"),
    vendorUsers: userSummaries.filter((user) => user.userType === "vendor"),
    employeeUsers: userSummaries.filter((user) => user.userType === "employee"),
    adminRestaurantEmployees,
    sessions,
    pageViews,
    activityEvents,
  };
};

export const startProjectAnalyticsSession = async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const sessionId = String(body.sessionId || "").trim();
    const path = normalizePath(body.path);

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session ID is required" });
    }

    const now = new Date();
    const identity = resolveIdentity(req);
    const meta = buildSessionMeta(req, body);

    const session = await ProjectAnalyticsSession.findOneAndUpdate(
      { sessionId },
      {
        $setOnInsert: {
          sessionId,
          startedAt: now,
          entryPath: path,
          pageViewCount: 0,
        },
        $set: {
          ...identity,
          ...meta,
          lastPath: path,
          lastSeenAt: now,
          endedAt: null,
          isActive: true,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.status(201).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        startedAt: session.startedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const trackProjectPageView = async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const sessionId = String(body.sessionId || "").trim();
    const path = normalizePath(body.path);

    if (!sessionId || !path) {
      return res.status(400).json({
        success: false,
        message: "Session ID and path are required",
      });
    }

    const now = new Date();
    const identity = resolveIdentity(req);
    const meta = buildSessionMeta(req, body);

    await ProjectPageView.create({
      sessionId,
      path,
      title: String(body.title || "").trim(),
      ...identity,
      deviceType: meta.deviceType,
      browser: meta.browser,
      os: meta.os,
      viewedAt: now,
    });

    await ProjectAnalyticsSession.findOneAndUpdate(
      { sessionId },
      {
        $setOnInsert: {
          sessionId,
          startedAt: now,
          entryPath: path,
          ...identity,
          ...meta,
        },
        $set: {
          lastPath: path,
          lastSeenAt: now,
          endedAt: null,
          isActive: true,
          ...identity,
        },
        $inc: {
          pageViewCount: 1,
        },
      },
      {
        upsert: true,
      }
    );

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const pingProjectAnalyticsSession = async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const sessionId = String(body.sessionId || "").trim();

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session ID is required" });
    }

    const updates = {
      lastSeenAt: new Date(),
      isActive: true,
    };

    if (body.path) {
      updates.lastPath = normalizePath(body.path);
    }

    await ProjectAnalyticsSession.findOneAndUpdate({ sessionId }, { $set: updates });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const endProjectAnalyticsSession = async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const sessionId = String(body.sessionId || "").trim();

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session ID is required" });
    }

    const identity = resolveIdentity(req);
    const path = body.path ? normalizePath(body.path) : "/";
    const updates = {
      lastSeenAt: new Date(),
      endedAt: new Date(),
      logoutAt: new Date(),
      isActive: false,
    };

    if (body.path) {
      updates.lastPath = path;
    }

    await ProjectAnalyticsSession.findOneAndUpdate({ sessionId }, { $set: updates });

    if (identity.isAuthenticated) {
      await createActivityEvent({
        sessionId,
        path,
        identity,
        eventType: "LOGOUT",
        featureKey: "auth.logout",
        featureLabel: "Logout",
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const trackProjectActivityEvent = async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const sessionId = String(body.sessionId || "").trim();
    const identity = resolveIdentity(req);
    const eventType = String(body.eventType || "").trim().toUpperCase();
    const path = normalizePath(body.path);

    if (!sessionId || !eventType) {
      return res.status(400).json({
        success: false,
        message: "Session ID and event type are required",
      });
    }

    await createActivityEvent({
      sessionId,
      path,
      identity,
      eventType,
      featureKey: String(body.featureKey || "").trim(),
      featureLabel: String(body.featureLabel || "").trim(),
      details: body.details && typeof body.details === "object" ? body.details : {},
    });

    const updates = {
      lastSeenAt: new Date(),
      lastPath: path,
      isActive: true,
    };

    if (eventType === "LOGIN") {
      updates.loginAt = new Date();
    }

    await ProjectAnalyticsSession.findOneAndUpdate(
      { sessionId },
      {
        $setOnInsert: {
          sessionId,
          startedAt: new Date(),
          entryPath: path,
          ...identity,
        },
        $set: updates,
      },
      { upsert: true }
    );

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectAnalyticsSummary = async (req, res) => {
  try {
    const dataset = await getAnalyticsDataset({
      days: req.query.days,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });

    res.json({
      success: true,
      data: {
        range: dataset.range,
        totals: dataset.totals,
        roleTotals: dataset.roleTotals,
        liveStatus: dataset.liveStatus,
        breakdowns: dataset.breakdowns,
        topPages: dataset.topPages,
        topFeatures: dataset.topFeatures,
        recentTrend: dataset.recentTrend,
        adminUsers: dataset.adminUsers,
        vendorUsers: dataset.vendorUsers,
        employeeUsers: dataset.employeeUsers,
        adminRestaurantEmployees: dataset.adminRestaurantEmployees,
        recentAuthEvents: dataset.activityEvents
          .filter((event) => ["LOGIN", "LOGOUT"].includes(event.eventType))
          .slice(0, 20),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportProjectAnalytics = async (req, res) => {
  try {
    const dataset = await getAnalyticsDataset({
      days: req.query.days,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });
    const dateLabel = new Date().toISOString().slice(0, 10);
    const rangeLabel = dataset.range.isCustom
      ? `${new Date(dataset.range.startDate).toISOString().slice(0, 10)}-to-${new Date(dataset.range.endDate).toISOString().slice(0, 10)}`
      : `${dataset.range.days}d`;
    const workbookXml = buildExcelWorkbookXml(dataset);

    res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="project-analytics-${rangeLabel}-${dateLabel}.xls"`
    );

    res.status(200).send(workbookXml);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
