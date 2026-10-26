/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import { FaBell, FaCheckCircle, FaExchangeAlt, FaMinus, FaPlus, FaPrint, FaSearch, FaShoppingCart, FaTable, FaTimes, FaUtensils } from "react-icons/fa";
import {
  addItemsToOrder,
  cancelOrderItem,
  changeOrderTable,
  createOrder,
  getWaiterOrders,
  markOrderServed,
  printOrderKOT,
  sendOrderToBilling,
  setJoinedTables,
} from "../../services/order.service";
import { getMenu } from "../../services/menu.service";
import { getTables } from "../../services/table.service";
import socket from "../../socket/socket";

const REFRESH_INTERVAL = 5000;
const CUSTOMIZATION_PRESETS = [
  "Extra chili",
  "Less spicy",
  "No tomato",
  "No onion",
  "Extra cheese",
  "Jain preparation",
];
const CANCEL_REASON_PRESETS = [
  "Customer changed mind",
  "Wrong item added",
  "Item delayed",
  "Item not required",
  "Service recovery",
];

const MenuModal = ({ children, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
    <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} />
    <div className="relative z-10 flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 sm:h-auto sm:max-h-[92vh] sm:rounded-3xl">
      <div className="z-20 flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 sm:px-5 sm:py-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">Take Order</h2>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">
          <FaTimes />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5 sm:py-4">{children}</div>
    </div>
  </div>
);

const idOf = (value) => String(value?._id || value || "");

const formatCourseType = (value) =>
  (value || "-")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function WaiterManagement() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const restaurantId =
    typeof user?.restaurant === "object" ? user?.restaurant?._id : user?.restaurant || "";
  const restaurantType = String(
    user?.restaurant?.restaurantType || user?.restaurantType || "HYBRID"
  ).toUpperCase();
  const currentWaiterId = String(user?._id || user?.id || "");

  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuSearch, setMenuSearch] = useState("");
  const [activeMenuFilter, setActiveMenuFilter] = useState("all");
  const [billedOrderIds, setBilledOrderIds] = useState([]);
  const [billMessage, setBillMessage] = useState("");
  const [tableLockMessage, setTableLockMessage] = useState("");
  const [activeMobilePanel, setActiveMobilePanel] = useState("menu");
  const [tableSearch, setTableSearch] = useState("");
  const [tableViewFilter, setTableViewFilter] = useState("all");
  const [tableMoveId, setTableMoveId] = useState("");
  const [movingTable, setMovingTable] = useState(false);
  const [joinSelection, setJoinSelection] = useState([]);
  const [joiningTables, setJoiningTables] = useState(false);
  const [tableTool, setTableTool] = useState("");
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [kotPrintingId, setKotPrintingId] = useState("");
  const [billingId, setBillingId] = useState("");
  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    orderId: "",
    itemId: "",
    itemName: "",
    reason: "",
  });
  const [cancellingItem, setCancellingItem] = useState(false);

  const load = async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      const [tablesRes, menuRes, ordersRes] = await Promise.all([
        getTables(restaurantId),
        getMenu(restaurantId),
        getWaiterOrders(),
      ]);

      setTables(Array.isArray(tablesRes) ? tablesRes : []);
      setMenuItems(Array.isArray(menuRes) ? menuRes : []);
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
    } catch (err) {
      console.error("WAITER LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOrderReady = (payload) => {
      if (
        currentWaiterId &&
        payload?.waiter &&
        String(payload.waiter) !== currentWaiterId
      ) {
        return;
      }

      const tableText = payload?.tableNumber
        ? `Table ${payload.tableNumber}`
        : "Order";

      setLiveNotifications((prev) => {
        const nextNotification = {
          id: payload?.orderId || String(Date.now()),
          orderId: payload?.orderId || "",
          title: "Order Ready",
          message: `${tableText} is ready to serve.`,
        };

        return [
          nextNotification,
          ...prev.filter((notification) => notification.orderId !== nextNotification.orderId),
        ].slice(0, 5);
      });
      load();
    };

    const handleOrderServed = (payload) => {
      if (
        currentWaiterId &&
        payload?.waiter &&
        String(payload.waiter) !== currentWaiterId
      ) {
        return;
      }

      setLiveNotifications((prev) =>
        prev.filter((notification) => notification.orderId !== payload?.orderId)
      );
      load();
    };

    socket.on("waiter:order-ready", handleOrderReady);
    socket.on("waiter:order-served", handleOrderServed);
    return () => {
      socket.off("waiter:order-ready", handleOrderReady);
      socket.off("waiter:order-served", handleOrderServed);
    };
  }, [currentWaiterId]);

  const closeLiveNotification = (id) => {
    const notification = liveNotifications.find((item) => item.id === id);
    if (notification?.orderId) {
      window.dispatchEvent(
        new CustomEvent("waiter-notification-dismissed", {
          detail: { orderId: notification.orderId },
        })
      );
    }
    setLiveNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const ownOrderIds = useMemo(
    () => new Set(orders.map((order) => String(order._id))),
    [orders]
  );

  const tableOrders = useMemo(() => {
    const map = {};
    tables.forEach((table) => {
      if (table.activeOrder?._id && table.activeOrder.status !== "PAID") {
        map[table._id] = table.activeOrder;
      }
    });
    orders.forEach((order) => {
      if (order.table?._id && order.status !== "PAID" && !map[order.table._id]) {
        map[order.table._id] = order;
      }
    });
    return map;
  }, [orders, tables]);

  const isOwnOrder = (order) => {
    if (!order?._id) return false;
    const waiterId = String(order.waiter?._id || order.waiter || "");
    return ownOrderIds.has(String(order._id)) || Boolean(currentWaiterId && waiterId === currentWaiterId);
  };

  const availableMenuItems = useMemo(
    () => menuItems.filter((item) => item.isAvailable),
    [menuItems]
  );

  const cuisines = [...new Map(availableMenuItems.map((item) => [item.cuisine?._id, item.cuisine]).filter(([id]) => id)).values()];
  const courseTypes = [...new Set(availableMenuItems.map((item) => item.courseType).filter(Boolean))];

  const filteredMenuItems = useMemo(() => {
    return availableMenuItems.filter((item) => {
      const matchesSearch = `${item.name} ${item.cuisine?.name || ""} ${item.courseType}`.toLowerCase().includes(menuSearch.toLowerCase());
      if (!matchesSearch) return false;
      if (activeMenuFilter === "all") return true;
      if (activeMenuFilter.startsWith("cuisine:")) return item.cuisine?._id === activeMenuFilter.slice(8);
      if (activeMenuFilter.startsWith("course:")) return item.courseType === activeMenuFilter.slice(7);
      return true;
    });
  }, [availableMenuItems, menuSearch, activeMenuFilter]);

  const totalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cartItems]
  );

  const hasReadyItems = (order) =>
    (order?.items || []).some((item) => item.status === "READY");

  const getActiveOrderItems = (order) =>
    (order?.items || []).filter((item) => item.status !== "CANCELLED");

  const isKotDirectBilling = (order) =>
    Boolean(order?.kot?.mode || order?.kot?.directBilling || order?.kot?.printed);

  const allItemsServed = (order) =>
    getActiveOrderItems(order).length > 0 &&
    getActiveOrderItems(order).every((item) => item.status === "SERVED");

  const canBillOrder = (order) => isKotDirectBilling(order) || allItemsServed(order);

  const isBillingSent = (order) =>
    Boolean(order?.billing?.sent || billedOrderIds.includes(order?._id));

  const getStatusLabel = (order) => {
    if (!order) return "Available";
    if (!isOwnOrder(order)) {
      return order.waiter?.name
        ? `Occupied by ${order.waiter.name}`
        : "Occupied by another waiter";
    }
    if (isBillingSent(order)) return "Sent to Billing";
    if (order.status === "PENDING") return "Order Placed";
    if (isKotDirectBilling(order)) return "KOT Sent - Ready for Bill";
    if (order.status === "ACCEPTED") {
      return order.chef?.name ? `Accepted by Chef ${order.chef.name}` : "Accepted by Chef";
    }
    if (order.status === "PREPARING") return "Preparing";
    if (allItemsServed(order)) return "All Items Served";
    if (hasReadyItems(order)) return "Some Items Ready";
    return order.status;
  };

  const getTableCardStyle = (order) => {
    if (!order) return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200";
    if (!isOwnOrder(order)) return "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300";
    if (allItemsServed(order)) return "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-200";
    if (hasReadyItems(order)) return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200";
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200";
  };

  const getTableFilterLabel = (order) => {
    if (!order) return "available";
    if (isBillingSent(order)) return "billing";
    if (hasReadyItems(order) || allItemsServed(order)) return "ready";
    return "active";
  };

  const filteredTables = useMemo(() => {
    const search = tableSearch.trim().toLowerCase();

    return tables.filter((table) => {
      const order = tableOrders[table._id];
      const statusKey = getTableFilterLabel(order);
      const matchesFilter =
        tableViewFilter === "all" ? true : statusKey === tableViewFilter;

      const matchesSearch = search
        ? String(table.tableNumber || "").toLowerCase().includes(search)
        : true;

      return matchesFilter && matchesSearch;
    });
  }, [tables, tableOrders, tableSearch, tableViewFilter]);

  if (!restaurantId) {
    return <div className="p-10 text-xl text-red-600">No restaurant assigned to this waiter.</div>;
  }

  if (restaurantType === "MANUAL_ONLY") {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900/40 dark:bg-amber-950/30">
        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
            Waiter Billing Disabled
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            This restaurant uses manual-only billing
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Table-based order taking is not available for this restaurant type. Use the manual billing flow instead.
          </p>
        </div>
      </div>
    );
  }

  const handleBill = async (order) => {
    if (!order || !canBillOrder(order) || isBillingSent(order)) return;

    try {
      setBillingId(order._id);
      await sendOrderToBilling(order._id);
      setBilledOrderIds((prev) =>
        prev.includes(order._id) ? prev : [...prev, order._id]
      );
      await load();
      setBillMessage("Bill sent to Accountant > Order Billing for payment processing.");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Send to billing failed");
    } finally {
      setBillingId("");
    }
  };

  const closeBillMessage = () => setBillMessage("");
  const closeTableLockMessage = () => setTableLockMessage("");

  const handleTableClick = (table) => {
    const existingOrder = tableOrders[table._id];
    if (existingOrder && !isOwnOrder(existingOrder)) {
      setTableLockMessage(
        existingOrder.waiter?.name
          ? `This table is already occupied by ${existingOrder.waiter.name}.`
          : "This table is already occupied by another waiter."
      );
      return;
    }

    // Tapping a joined table opens the group order on its main table.
    const mainTableId = existingOrder ? idOf(existingOrder.table) : "";
    const mainTable =
      mainTableId && mainTableId !== table._id
        ? tables.find((item) => item._id === mainTableId) || table
        : table;

    setSelectedTable(mainTable);
    setSelectedOrder(existingOrder || null);
    setTableMoveId(mainTable._id);
    setJoinSelection((existingOrder?.joinedTables || []).map(idOf));
    setTableTool("");
    setCartItems([]);
    setActiveMobilePanel("menu");
    setMenuSearch("");
    setActiveMenuFilter("all");
    setIsMenuOpen(true);
  };

  const addToCart = (item) => {
    setCartItems((prev) => {
      const existing = prev.find((entry) => entry.menuItem === item._id);
      if (existing) {
        return prev.map((entry) =>
          entry.menuItem === item._id ? { ...entry, qty: entry.qty + 1 } : entry
        );
      }

      return [
        ...prev,
        {
          menuItem: item._id,
          name: item.name,
          price: item.price,
          qty: 1,
          customization: [],
        },
      ];
    });
  };

  const updateQty = (id, type) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.menuItem === id
            ? { ...item, qty: type === "inc" ? item.qty + 1 : item.qty - 1 }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const toggleCustomization = (id, value) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.menuItem !== id) return item;

        const selected = new Set(item.customization || []);
        if (selected.has(value)) {
          selected.delete(value);
        } else {
          selected.add(value);
        }

        return { ...item, customization: Array.from(selected) };
      })
    );
  };

  const updateCustomNote = (id, value) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.menuItem !== id) return item;

        const presetNotes = (item.customization || []).filter(
          (note) => !note.startsWith("Note: ")
        );
        const note = value.trim() ? [`Note: ${value.slice(0, 120)}`] : [];

        return { ...item, customization: [...presetNotes, ...note] };
      })
    );
  };

  const getCustomNote = (item) =>
    (item.customization || [])
      .find((note) => note.startsWith("Note: "))
      ?.replace(/^Note:\s*/, "") || "";

  const closeMenuModal = () => {
    setIsMenuOpen(false);
    setSelectedTable(null);
    setSelectedOrder(null);
    setTableMoveId("");
    setTableTool("");
    setJoinSelection([]);
    setCartItems([]);
    setActiveMobilePanel("menu");
    setMenuSearch("");
    setActiveMenuFilter("all");
  };

  const toggleJoinTable = (tableId) => {
    setJoinSelection((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
    );
  };

  const savedJoinIds = (selectedOrder?.joinedTables || []).map(idOf);
  const joinChanged =
    joinSelection.length !== savedJoinIds.length ||
    joinSelection.some((id) => !savedJoinIds.includes(id));

  const handleApplyJoin = async () => {
    if (!selectedOrder?._id) return;

    try {
      setJoiningTables(true);
      const updatedOrder = await setJoinedTables(selectedOrder._id, joinSelection);
      setSelectedOrder(updatedOrder);
      setJoinSelection((updatedOrder?.joinedTables || []).map(idOf));
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Joining tables failed");
    } finally {
      setJoiningTables(false);
    }
  };

  const handleMoveOrderTable = async () => {
    if (!selectedOrder?._id || !tableMoveId || tableMoveId === selectedTable?._id) return;

    try {
      setMovingTable(true);
      const updatedOrder = await changeOrderTable(selectedOrder._id, tableMoveId);
      const nextTable =
        tables.find((table) => table._id === updatedOrder?.table?._id) ||
        updatedOrder?.table ||
        selectedTable;

      setSelectedOrder(updatedOrder);
      setSelectedTable(nextTable);
      setTableMoveId(nextTable?._id || "");
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Table change failed");
    } finally {
      setMovingTable(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!cartItems.length || !selectedTable) return;

    try {
      const payload = {
        items: cartItems.map((item) => ({
          menuItem: item.menuItem,
          quantity: item.qty,
          customization: item.customization || [],
        })),
      };

      if (selectedOrder) {
        await addItemsToOrder(selectedOrder._id, payload);
      } else {
        await createOrder({
          table: selectedTable._id,
          joinedTables: joinSelection,
          ...payload,
        });
      }

      await load();
      closeMenuModal();
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed");
    }
  };

  const handleServe = async (orderId) => {
    try {
      await markOrderServed(orderId);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Serve failed");
    }
  };

  const handlePrintKOT = async (orderId) => {
    try {
      setKotPrintingId(orderId);
      const result = await printOrderKOT(orderId);
      const printJobs = result?.printJobs || [];
      await load();
      const count = printJobs.length;
      setBillMessage(
        `KOT sent to ${count || "kitchen"} chef/kitchen print job${count === 1 ? "" : "s"}. Click Bill when the customer asks for billing.`
      );
    } catch (err) {
      alert(err.response?.data?.message || err.message || "KOT print failed");
    } finally {
      setKotPrintingId("");
    }
  };

  const closeCancelDialog = () => {
    if (cancellingItem) return;
    setCancelDialog({
      open: false,
      orderId: "",
      itemId: "",
      itemName: "",
      reason: "",
    });
  };

  const submitCancelledItem = async () => {
    const reason = String(cancelDialog.reason || "").trim();
    if (!reason) {
      alert("Please enter cancel reason");
      return;
    }

    try {
      setCancellingItem(true);
      const result = await cancelOrderItem(
        cancelDialog.orderId,
        cancelDialog.itemId,
        reason
      );
      await load();
      closeCancelDialog();
      if (result?.inventoryEffect) {
        alert(result.inventoryEffect);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Cancel item failed");
    } finally {
      setCancellingItem(false);
    }
  };

  // Free tables (plus the ones already joined to this order) that can be pushed together.
  const joinableTables = selectedTable
    ? tables.filter(
        (table) =>
          table._id !== selectedTable._id &&
          (!tableOrders[table._id] || savedJoinIds.includes(table._id))
      )
    : [];

  const movableTables = selectedOrder
    ? tables.filter((table) => !tableOrders[table._id] || table._id === selectedTable?._id)
    : [];

  const filterPills = [
    { id: "all", label: "All", count: tables.length },
    {
      id: "available",
      label: "Available",
      count: tables.filter((table) => !tableOrders[table._id]).length,
    },
    {
      id: "active",
      label: "Active",
      count: tables.filter((table) => {
        const order = tableOrders[table._id];
        return Boolean(order) && getTableFilterLabel(order) === "active";
      }).length,
    },
    {
      id: "ready",
      label: "Ready",
      count: tables.filter((table) => {
        const order = tableOrders[table._id];
        return Boolean(order) && getTableFilterLabel(order) === "ready";
      }).length,
    },
    {
      id: "billing",
      label: "Billing",
      count: tables.filter((table) => {
        const order = tableOrders[table._id];
        return Boolean(order) && getTableFilterLabel(order) === "billing";
      }).length,
    },
  ];

  if (loading) {
    return <div className="p-10 text-xl text-slate-700 dark:text-slate-200">Loading waiter panel...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 dark:bg-slate-900 sm:p-4">
      {liveNotifications.length > 0 && (
        <div className="fixed right-4 top-4 z-[80] grid w-[calc(100%-2rem)] max-w-sm gap-3">
          {liveNotifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-2xl border border-sky-200 bg-white p-4 shadow-2xl dark:border-sky-900/60 dark:bg-slate-800"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-sky-100 p-2 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200">
                  <FaBell />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 dark:text-white">{notification.title}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{notification.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => closeLiveNotification(notification.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mx-auto max-w-7xl space-y-3">
        <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="flex h-9 w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-900 sm:w-56">
              <FaSearch className="text-xs text-slate-400" />
              <input
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search table..."
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto">
              {filterPills.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setTableViewFilter(filter.id)}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition ${
                    tableViewFilter === filter.id
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {filter.label}
                  <span className={`text-xs ${tableViewFilter === filter.id ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filteredTables.map((table) => {
              const order = tableOrders[table._id];
              const isLocked = Boolean(order && !isOwnOrder(order));
              const isBilled = isBillingSent(order);
              const itemCount = (order?.items || []).filter((item) => item.status !== "CANCELLED").length;
              const mainTableId = order ? idOf(order.table) : "";
              const isJoinedChild = Boolean(order && mainTableId && mainTableId !== table._id);
              const mainTableNumber = isJoinedChild
                ? tables.find((item) => item._id === mainTableId)?.tableNumber ||
                  order.table?.tableNumber
                : null;
              const joinedNumbers = !isJoinedChild
                ? (order?.joinedTables || [])
                    .map((joined) => tables.find((item) => item._id === idOf(joined))?.tableNumber)
                    .filter(Boolean)
                : [];
              const btn = "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold";
              return (
                <div
                  key={table._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTableClick(table)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleTableClick(table);
                    }
                  }}
                  className={`flex flex-col rounded-xl border p-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isLocked ? "cursor-not-allowed opacity-85" : "cursor-pointer hover:shadow-md active:scale-[0.99]"} ${getTableCardStyle(order)}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xl font-black leading-none">T{table.tableNumber}</h2>
                    {order ? (
                      <span className="rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide dark:bg-slate-900/40">
                        {itemCount} item{itemCount === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1.5 truncate text-xs font-semibold" title={getStatusLabel(order)}>
                    {isJoinedChild ? `Joined with T${mainTableNumber}` : getStatusLabel(order)}
                  </p>
                  {joinedNumbers.length > 0 && (
                    <p className="truncate text-[11px] font-medium opacity-80">
                      + {joinedNumbers.map((number) => `T${number}`).join(", ")}
                    </p>
                  )}

                  {order && !isLocked && !isJoinedChild && (
                    <div className="mt-2 flex gap-1.5">
                      {!isBilled && !isKotDirectBilling(order) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTableClick(table);
                          }}
                          className={`${btn} border border-slate-200 bg-white/80 text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200`}
                        >
                          Edit
                        </button>
                      )}

                      {!isKotDirectBilling(order) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintKOT(order._id);
                          }}
                          disabled={kotPrintingId === order._id}
                          className={`${btn} bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900`}
                        >
                          <FaPrint />
                          {kotPrintingId === order._id ? "..." : "KOT"}
                        </button>
                      )}

                      {!isKotDirectBilling(order) && hasReadyItems(order) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleServe(order._id);
                          }}
                          className={`${btn} bg-sky-600 text-white hover:bg-sky-700`}
                        >
                          Serve
                        </button>
                      )}

                      {canBillOrder(order) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBill(order);
                          }}
                          disabled={billingId === order._id || isBilled}
                          className={`${btn} text-white disabled:opacity-70 ${isBilled ? "bg-slate-500" : "bg-violet-600 hover:bg-violet-700"}`}
                        >
                          {isBilled ? "Billed" : billingId === order._id ? "Sending..." : "Bill"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredTables.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No tables match this filter.
              </div>
            )}
          </div>
        </div>

        {isMenuOpen && selectedTable && (
          <MenuModal onClose={closeMenuModal}>
            <div className="flex min-h-full flex-col gap-2 pb-20 lg:block lg:space-y-3 lg:pb-0">
              <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Table #{selectedTable.tableNumber}
                    {joinSelection
                      .map((id) => tables.find((table) => table._id === id)?.tableNumber)
                      .filter(Boolean)
                      .map((number) => ` + T${number}`)
                      .join("")}
                  </h3>
                  <span className="inline-flex h-6 items-center rounded-md bg-white px-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">
                    {selectedOrder ? getStatusLabel(selectedOrder) : "New Order"}
                  </span>
                  <div className="ml-auto flex gap-1.5">
                    {selectedOrder && (
                      <button
                        type="button"
                        onClick={() => setTableTool((tool) => (tool === "move" ? "" : "move"))}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold ring-1 transition ${
                          tableTool === "move"
                            ? "bg-slate-900 text-white ring-slate-900 dark:bg-white dark:text-slate-900"
                            : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700"
                        }`}
                      >
                        <FaExchangeAlt className="text-[10px]" />
                        Change table
                      </button>
                    )}
                    {joinableTables.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setTableTool((tool) => (tool === "join" ? "" : "join"))}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold ring-1 transition ${
                          tableTool === "join" || joinSelection.length > 0
                            ? "bg-emerald-600 text-white ring-emerald-600"
                            : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700"
                        }`}
                      >
                        <FaTable className="text-[10px]" />
                        Join tables{joinSelection.length > 0 ? ` (${joinSelection.length})` : ""}
                      </button>
                    )}
                  </div>
                </div>

                {tableTool === "move" && selectedOrder && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-white p-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Move order to</span>
                    <select
                      value={tableMoveId}
                      onChange={(e) => setTableMoveId(e.target.value)}
                      className="h-8 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      {movableTables.map((table) => (
                        <option key={table._id} value={table._id}>
                          Table #{table.tableNumber}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleMoveOrderTable}
                      disabled={movingTable || !tableMoveId || tableMoveId === selectedTable?._id}
                      className="inline-flex h-8 items-center rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {movingTable ? "Moving..." : "Move"}
                    </button>
                  </div>
                )}

                {tableTool === "join" && joinableTables.length > 0 && (
                  <div className="mt-2 rounded-lg bg-white p-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                    <p className="mb-1.5 text-xs text-slate-500 dark:text-slate-400">
                      Tap the free tables this group is sitting at. They share one order and one bill.
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {joinableTables.map((table) => {
                        const on = joinSelection.includes(table._id);
                        return (
                          <button
                            key={table._id}
                            type="button"
                            onClick={() => toggleJoinTable(table._id)}
                            className={`h-8 rounded-lg px-3 text-xs font-bold transition ${
                              on
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                            }`}
                          >
                            T{table.tableNumber}
                          </button>
                        );
                      })}
                      {selectedOrder && joinChanged && (
                        <button
                          type="button"
                          onClick={handleApplyJoin}
                          disabled={joiningTables}
                          className="ml-auto inline-flex h-8 items-center rounded-lg bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900"
                        >
                          {joiningTables ? "Saving..." : "Apply"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 lg:hidden">
                <button
                  type="button"
                  onClick={() => setActiveMobilePanel("menu")}
                  className={`h-9 rounded-lg text-sm font-bold transition ${
                    activeMobilePanel === "menu"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Items
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMobilePanel("order")}
                  className={`flex h-9 items-center justify-center gap-2 rounded-lg text-sm font-bold transition ${
                    activeMobilePanel === "order"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <FaShoppingCart />
                  Order ({cartItems.length})
                </button>
              </div>

              <div className="min-h-0 flex-1 lg:grid lg:gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.9fr)] xl:grid-cols-[1.7fr_0.9fr]">
                <div className={`${activeMobilePanel === "menu" ? "block" : "hidden"} min-h-0 space-y-3 lg:block lg:space-y-4`}>
                  <div className="space-y-2 rounded-xl bg-white p-2.5 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                    <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 dark:border-slate-600 dark:bg-slate-900">
                      <FaSearch className="text-xs text-slate-400" />
                      <input
                        value={menuSearch}
                        onChange={(e) => setMenuSearch(e.target.value)}
                        placeholder="Search dish, cuisine or course..."
                        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                      />
                    </div>

                    {availableMenuItems.length > 0 && (
                      <div className="-mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:overflow-visible">
                        <button onClick={() => setActiveMenuFilter("all")} className={`h-7 shrink-0 rounded-full px-3 text-xs font-semibold ${activeMenuFilter === "all" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"}`}>All ({availableMenuItems.length})</button>
                        {cuisines.map((cuisine) => <button key={cuisine._id} onClick={() => setActiveMenuFilter(`cuisine:${cuisine._id}`)} className={`h-7 shrink-0 rounded-full px-3 text-xs font-semibold ${activeMenuFilter === `cuisine:${cuisine._id}` ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"}`}>{cuisine.name}</button>)}
                        {courseTypes.map((courseType) => <button key={courseType} onClick={() => setActiveMenuFilter(`course:${courseType}`)} className={`h-7 shrink-0 rounded-full px-3 text-xs font-semibold ${activeMenuFilter === `course:${courseType}` ? "bg-sky-600 text-white" : "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200"}`}>{formatCourseType(courseType)}</button>)}
                      </div>
                    )}
                  </div>

                  {filteredMenuItems.length === 0 ? (
                    <div className="flex min-h-[240px] items-center justify-center rounded-2xl bg-white px-4 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                      No available menu items match the current filter.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                      <div className="divide-y divide-slate-100 dark:divide-slate-700 lg:hidden">
                        {filteredMenuItems.map((item) => {
                          const inCart = cartItems.find((entry) => entry.menuItem === item._id);
                          return (
                            <article key={item._id} className="flex items-center gap-2 px-3 py-2">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                  {[item.cuisine?.name, formatCourseType(item.courseType)].filter(Boolean).join(" · ")}
                                </p>
                              </div>
                              <p className="shrink-0 text-sm font-bold text-emerald-700 dark:text-emerald-300">Rs. {item.price}</p>
                              {inCart ? (
                                <div className="flex shrink-0 items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => updateQty(item._id, "dec")}
                                    aria-label={`Remove one ${item.name}`}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-200"
                                  >
                                    <FaMinus className="text-xs" />
                                  </button>
                                  <span className="w-6 text-center text-sm font-bold text-slate-900 dark:text-white">{inCart.qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => addToCart(item)}
                                    aria-label={`Add one more ${item.name}`}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white"
                                  >
                                    <FaPlus className="text-xs" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => addToCart(item)}
                                  className="inline-flex h-9 w-16 shrink-0 items-center justify-center gap-1 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700"
                                >
                                  <FaPlus className="text-[10px]" />
                                  Add
                                </button>
                              )}
                            </article>
                          );
                        })}
                      </div>

                      <div className="hidden overflow-x-auto lg:block">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                          <thead className="bg-slate-100 dark:bg-slate-900/60">
                            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                              <th className="px-4 py-2">Dish</th>
                              <th className="px-4 py-2">Cuisine</th>
                              <th className="px-4 py-2">Course</th>
                              <th className="px-4 py-2">Price</th>
                              <th className="px-4 py-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-700 dark:bg-slate-800">
                            {filteredMenuItems.map((item) => (
                              <tr key={item._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                                <td className="px-4 py-2 font-semibold text-slate-900 dark:text-white">{item.name}</td>
                                <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300">{item.cuisine?.name || "-"}</td>
                                <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300">{formatCourseType(item.courseType)}</td>
                                <td className="px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">Rs. {item.price}</td>
                                <td className="px-4 py-2 text-right">
                                  <button type="button" onClick={() => addToCart(item)} className="inline-flex h-8 items-center rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700">
                                    Add
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`${activeMobilePanel === "order" ? "flex" : "hidden"} max-h-[calc(100dvh-190px)] min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 lg:sticky lg:inset-auto lg:top-24 lg:z-10 lg:flex lg:mx-0 lg:max-h-[calc(92vh-8rem)]`}>
                  <div className="flex shrink-0 items-center justify-between p-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Selected Items</h3>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Rs. {totalAmount}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">{cartItems.length}</span>
                    </div>
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="mx-3 mb-3 flex min-h-[120px] flex-1 flex-col items-center justify-center gap-3 rounded-2xl bg-slate-50 px-4 text-center text-sm text-slate-400 dark:bg-slate-800 dark:text-slate-500 lg:mx-4 lg:mb-4">
                      <FaShoppingCart className="text-3xl text-slate-300 dark:text-slate-600" />
                      <span>Tap Add on a dish to start the order.</span>
                      <button
                        type="button"
                        onClick={() => setActiveMobilePanel("menu")}
                        className="min-h-11 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-900 lg:hidden"
                      >
                        Browse Items
                      </button>
                    </div>
                  ) : (
                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3">
                      {cartItems.map((item) => (
                        <div key={item.menuItem} className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                              <p className="mt-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Rs. {item.price * item.qty}</p>
                            </div>
                            <div className="grid grid-cols-[32px_24px_32px] items-center gap-1">
                              <button type="button" onClick={() => updateQty(item.menuItem, "dec")} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:hover:bg-rose-900/50">
                                <FaMinus className="text-xs" />
                              </button>
                              <div className="text-center text-sm font-bold text-slate-800 dark:text-slate-100">{item.qty}</div>
                              <button type="button" onClick={() => updateQty(item.menuItem, "inc")} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/50">
                                <FaPlus className="text-xs" />
                              </button>
                            </div>
                          </div>

                          <details className="space-y-2" open={(item.customization || []).length > 0}>
                            <summary className="cursor-pointer text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Customize
                            </summary>
                            <div className="flex flex-wrap gap-2">
                              {CUSTOMIZATION_PRESETS.map((preset) => (
                                <button
                                  key={`${item.menuItem}-${preset}`}
                                  type="button"
                                  onClick={() => toggleCustomization(item.menuItem, preset)}
                                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                                    (item.customization || []).includes(preset)
                                      ? "bg-emerald-600 text-white"
                                      : "bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700"
                                  }`}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              value={getCustomNote(item)}
                              onChange={(e) => updateCustomNote(item.menuItem, e.target.value)}
                              placeholder="Other note: no tomato, extra chili..."
                              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            />
                          </details>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="shrink-0 border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <div className="hidden items-center justify-between text-sm font-medium text-slate-500 dark:text-slate-400 lg:flex">
                      <span>Total</span>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">Rs. {totalAmount}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 lg:mt-3">
                      <button type="button" onClick={closeMenuModal} className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                        Cancel
                      </button>
                      <button type="button" disabled={!cartItems.length} onClick={handleSubmitOrder} className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                        {selectedOrder ? "Place Updated Order" : "Place Order"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {activeMobilePanel === "menu" && cartItems.length > 0 && (
                <div className="fixed inset-x-0 bottom-0 z-[110] border-t border-slate-200 bg-white p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-900 lg:hidden">
                  <button
                    type="button"
                    onClick={() => setActiveMobilePanel("order")}
                    className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3 text-left text-white dark:bg-white dark:text-slate-900"
                  >
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <FaShoppingCart />
                      Review {cartItems.length} item{cartItems.length === 1 ? "" : "s"}
                    </span>
                    <span className="text-sm font-bold">Rs. {totalAmount}</span>
                  </button>
                </div>
              )}
            </div>
          </MenuModal>
        )}

        {tableLockMessage && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-4 sm:items-center">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-center shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-xl text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                <FaTable />
              </div>
              <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
                Table Occupied
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                {tableLockMessage}
              </p>
              <button
                type="button"
                onClick={closeTableLockMessage}
                className="mt-5 min-h-11 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {billMessage && (
          <MenuModal onClose={closeBillMessage}>
            <div className="mx-auto max-w-xl space-y-5 py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                <FaCheckCircle />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {billMessage.startsWith("KOT") ? "KOT Sent" : "Bill Sent"}
                </h3>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{billMessage}</p>
              </div>
              <button
                onClick={closeBillMessage}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                OK
              </button>
            </div>
          </MenuModal>
        )}

        {cancelDialog.open && (
          <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:items-center">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
              <div className="border-b border-slate-200 px-4 py-2 dark:border-slate-700 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-500 dark:text-rose-300">
                      Cancel Item
                    </p>
                    <h3 className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                      {cancelDialog.itemName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      This item will be removed from billing. Stock stays consumed if preparation already happened.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeCancelDialog}
                    disabled={cancellingItem}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              <div className="space-y-4 px-5 py-5 sm:px-6">
                <div>
                  <p className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                    Quick reasons
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CANCEL_REASON_PRESETS.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setCancelDialog((prev) => ({ ...prev, reason }))}
                        className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                          cancelDialog.reason === reason
                            ? "bg-rose-600 text-white"
                            : "bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-200 dark:ring-rose-900/40"
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-100">
                    Cancel reason
                  </label>
                  <textarea
                    rows="4"
                    maxLength="200"
                    value={cancelDialog.reason}
                    onChange={(e) =>
                      setCancelDialog((prev) => ({ ...prev, reason: e.target.value }))
                    }
                    placeholder="Write why this item is being cancelled..."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-950 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={closeCancelDialog}
                  disabled={cancellingItem}
                  className="min-h-11 rounded-2xl border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Keep Item
                </button>
                <button
                  type="button"
                  onClick={submitCancelledItem}
                  disabled={cancellingItem || !String(cancelDialog.reason || "").trim()}
                  className="min-h-11 rounded-2xl bg-rose-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cancellingItem ? "Cancelling..." : "Confirm Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
