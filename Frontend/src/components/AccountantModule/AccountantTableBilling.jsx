import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaArrowLeft, FaCheck, FaMinus, FaPlus, FaPrint, FaSearch, FaTimes } from "react-icons/fa";
import {
  generateTableBill,
  getBillingSettings,
  getTableBillingHistory,
  getTableBoard,
  getTableOpenBill,
  settleTableBill,
  voidTableBill,
} from "../../services/billing.service";
import { printJobsOnThisDevice } from "../../services/localPrint.service";
import { getMenu } from "../../services/menu.service";

const DEFAULT_PAYMENT_METHODS = ["CASH", "CARD", "UPI"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const getRestaurantId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.restaurant?._id || user?.restaurant || user?.restaurantId || "";
  } catch {
    return "";
  }
};

const menuIdOf = (item) => String(item?.menuItem?._id || item?.menuItem || "");

const inputCls =
  "min-h-10 min-w-0 w-full rounded-xl border border-[#d7e3ef] bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
const cardCls =
  "rounded-[20px] border border-[#d7e3ef] bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950 xl:rounded-[22px] xl:p-4";
const pillCls =
  "rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200";

export default function AccountantTableBilling() {
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [taxDefaults, setTaxDefaults] = useState({ cgst: 2.5, sgst: 2.5 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("TABLES");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("ALL");
  const [historySearch, setHistorySearch] = useState("");
  const [historyNotice, setHistoryNotice] = useState("");
  const [voidTarget, setVoidTarget] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidReissue, setVoidReissue] = useState(true);
  const [voidError, setVoidError] = useState("");
  const [voidBusy, setVoidBusy] = useState(false);

  const [activeTable, setActiveTable] = useState(null);
  const [openBill, setOpenBill] = useState(null);
  const [cart, setCart] = useState([]); // [{ menuItem, name, price, quantity, note }]
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const [codeInput, setCodeInput] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [nameSearchOpen, setNameSearchOpen] = useState(false);
  const [showMenuList, setShowMenuList] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const [showAllFastAdd, setShowAllFastAdd] = useState(false);
  const codeRef = useRef(null);

  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [showComp, setShowComp] = useState(false);
  const [compType, setCompType] = useState("NONE");
  const [compItems, setCompItems] = useState([]);
  const [compNote, setCompNote] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [cgstRate, setCgstRate] = useState("");
  const [sgstRate, setSgstRate] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");
  const [packagingCharge, setPackagingCharge] = useState("");
  const [extraCharge, setExtraCharge] = useState("");
  const [extraReason, setExtraReason] = useState("");
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState("AMOUNT");

  const [settleOpen, setSettleOpen] = useState(false);
  const [settleError, setSettleError] = useState("");
  const [method, setMethod] = useState("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [cardLast4, setCardLast4] = useState("");

  const loadBoard = useCallback(async () => {
    try {
      setError("");
      setTables(await getTableBoard());
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load tables");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
    const timer = setInterval(loadBoard, 20000);
    return () => clearInterval(timer);
  }, [loadBoard]);

  useEffect(() => {
    const restaurantId = getRestaurantId();
    if (restaurantId) {
      getMenu(restaurantId)
        .then((items) => setMenu(items.filter((m) => m.isAvailable !== false)))
        .catch(() => setMenu([]));
    }
    getBillingSettings()
      .then((s) => {
        const template = s?.restaurant?.billingTemplate || {};
        const methods = template.paymentMethods;
        if (Array.isArray(methods) && methods.length > 0) {
          setPaymentMethods(methods);
          setMethod(methods[0]);
        }
        setTaxDefaults({
          cgst: Number(template.cgstRate ?? 2.5),
          sgst: Number(template.sgstRate ?? 2.5),
        });
      })
      .catch(() => {});
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const data = await getTableBillingHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      setHistoryNotice(err?.response?.data?.message || "Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "HISTORY") loadHistory();
  }, [view, loadHistory]);

  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    return history
      .filter((b) => b.order?.table)
      .filter((b) => historyFilter === "ALL" || b.paymentStatus === historyFilter)
      .filter(
        (b) =>
          !q ||
          String(b.billNo).toLowerCase().includes(q) ||
          String(b.order?.table?.tableNumber || "").includes(q)
      );
  }, [history, historyFilter, historySearch]);

  const handleVoid = async () => {
    if (voidReason.trim().length < 5) {
      setVoidError("Enter a reason (at least 5 characters)");
      return;
    }
    try {
      setVoidBusy(true);
      setVoidError("");
      await voidTableBill(voidTarget._id, voidReason.trim(), voidReissue);
      const tableNo = voidTarget.order?.table?.tableNumber ?? "";
      setHistoryNotice(
        voidReissue
          ? `Bill #${voidTarget.billNo} voided. It is open again on Table ${tableNo} - correct it from the Tables tab.`
          : `Bill #${voidTarget.billNo} voided.`
      );
      setVoidTarget(null);
      setVoidReason("");
      setVoidReissue(true);
      loadHistory();
      loadBoard();
    } catch (err) {
      setVoidError(err?.response?.data?.message || err.message || "Failed to void bill");
    } finally {
      setVoidBusy(false);
    }
  };

  const resetForm = () => {
    setCart([]);
    setNotice("");
    setSettleOpen(false);
    setShowComp(false);
    setShowAdvanced(false);
    setShowMenuList(false);
    setCustomerPhone("");
    setCustomerEmail("");
    setCompType("NONE");
    setCompItems([]);
    setCompNote("");
    setCgstRate("");
    setSgstRate("");
    setServiceCharge("");
    setPackagingCharge("");
    setExtraCharge("");
    setExtraReason("");
    setDiscount("");
    setDiscountType("AMOUNT");
    setCashReceived("");
    setCardLast4("");
    setCodeInput("");
    setNameSearch("");
  };

  const applyBillToForm = (bill) => {
    if (!bill) return;
    setCustomerPhone(bill.customerPhone || "");
    setCustomerEmail(bill.customerEmail || "");
    setCgstRate(String(bill.cgstRate ?? ""));
    setSgstRate(String(bill.sgstRate ?? ""));
    setServiceCharge(bill.serviceCharge ? String(bill.serviceCharge) : "");
    setPackagingCharge(bill.packagingCharge ? String(bill.packagingCharge) : "");
    setExtraCharge(bill.extraCharge ? String(bill.extraCharge) : "");
    setExtraReason(bill.extraChargeReason || "");
    setDiscount(bill.discountValue ? String(bill.discountValue) : "");
    setDiscountType(bill.discountType || "AMOUNT");
    setCompType(bill.complimentaryType || "NONE");
    setCompNote(bill.complimentaryNote || "");
    const freeIds = new Set((bill.complimentaryItems || []).map(String));
    setCompItems(
      (bill.order?.items || [])
        .filter((i) => freeIds.has(String(i._id)))
        .map((i) => menuIdOf(i))
    );
  };

  const openTable = async (table) => {
    resetForm();
    setActiveTable(table);
    setOpenBill(null);
    try {
      const bill = await getTableOpenBill(table._id);
      setOpenBill(bill);
      applyBillToForm(bill);
    } catch (err) {
      setNotice(err?.response?.data?.message || "Failed to load table");
    }
  };

  const closeTable = () => {
    setActiveTable(null);
    setOpenBill(null);
    resetForm();
  };

  /* ---------- cart ---------- */
  const addItem = (item) => {
    setNotice("");
    setCart((prev) => {
      const found = prev.find((l) => l.menuItem === item._id);
      if (found) {
        return prev.map((l) =>
          l.menuItem === item._id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          menuItem: item._id,
          name: item.name,
          price: Number(item.price || 0),
          gstFree: item.gstFree === true,
          quantity: 1,
          note: "",
        },
      ];
    });
  };

  const changeQty = (id, delta) =>
    setCart((prev) =>
      prev
        .map((l) => (l.menuItem === id ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );

  const setNote = (id, note) =>
    setCart((prev) => prev.map((l) => (l.menuItem === id ? { ...l, note } : l)));

  const handleAddByCode = () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    const found = menu.find((m) => String(m.menuCode || "").toUpperCase() === code);
    if (!found) {
      setNotice(`No menu item with code ${code}`);
      return;
    }
    addItem(found);
    setCodeInput("");
    codeRef.current?.focus();
  };

  const nameResults = useMemo(() => {
    const q = nameSearch.trim().toLowerCase();
    if (!q) return [];
    return menu
      .filter(
        (m) =>
          String(m.name || "").toLowerCase().includes(q) ||
          String(m.menuCode || "").toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [menu, nameSearch]);

  const menuGroups = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();
    return menu
      .filter((item) =>
        `${item.name || ""} ${item.menuCode || ""} ${item.cuisine?.name || ""} ${item.courseType || ""}`
          .toLowerCase()
          .includes(q)
      )
      .reduce((groups, item) => {
        const cuisine = item.cuisine?.name || "Other Cuisine";
        const course = item.courseType || "General";
        const key = `${cuisine}__${course}`;
        if (!groups[key]) groups[key] = { title: cuisine, subtitle: course, items: [] };
        groups[key].items.push(item);
        return groups;
      }, {});
  }, [menu, menuSearch]);

  /* ---------- totals (same maths as the server) ---------- */
  const runningItems = useMemo(
    () => (openBill?.order?.items || []).filter((i) => i.status !== "CANCELLED"),
    [openBill]
  );

  const allLines = useMemo(
    () => [
      ...runningItems.map((i) => ({
        id: menuIdOf(i),
        name: i.menuItem?.name || "Item",
        price: Number(i.price || 0),
        quantity: Number(i.quantity || 0),
        gstFree: i.gstFree === true,
      })),
      ...cart.map((l) => ({
        id: l.menuItem,
        name: l.name,
        price: l.price,
        quantity: l.quantity,
        gstFree: l.gstFree === true,
      })),
    ],
    [runningItems, cart]
  );

  const effectiveCgst = cgstRate !== "" ? num(cgstRate) : taxDefaults.cgst;
  const effectiveSgst = sgstRate !== "" ? num(sgstRate) : taxDefaults.sgst;

  const totals = useMemo(() => {
    const isFree = (line) =>
      compType === "FULL_ORDER" || (compType === "ITEMS" && compItems.includes(line.id));
    const chargeable = allLines.filter((l) => !isFree(l));
    const itemsSubtotal = allLines.reduce((s, l) => s + l.price * l.quantity, 0);
    const base = chargeable.reduce((s, l) => s + l.price * l.quantity, 0);
    const withTax = chargeable.reduce(
      (s, l) =>
        l.gstFree
          ? s + l.price * l.quantity // GST-free item: exact price, no tax
          : s + Math.ceil(l.price * (1 + (effectiveCgst + effectiveSgst) / 100)) * l.quantity,
      0
    );
    const complimentary = allLines
      .filter(isFree)
      .reduce((s, l) => s + l.price * l.quantity, 0);
    const service = num(serviceCharge);
    const packaging = num(packagingCharge);
    const extra = num(extraCharge);
    const before = withTax + service + packaging + extra;
    const dv = num(discount);
    const raw = discountType === "PERCENT" ? before * (Math.min(dv, 100) / 100) : dv;
    const applied = Math.min(raw, before);
    return {
      itemsSubtotal,
      complimentary,
      tax: Math.max(withTax - base, 0),
      service,
      packaging,
      extra,
      discount: applied,
      total: Math.ceil(before - applied),
    };
  }, [
    allLines, compType, compItems, effectiveCgst, effectiveSgst,
    serviceCharge, packagingCharge, extraCharge, discount, discountType,
  ]);

  const chargePayload = () => ({
    customerPhone,
    customerEmail,
    cgstRate: effectiveCgst,
    sgstRate: effectiveSgst,
    serviceCharge: num(serviceCharge),
    packagingCharge: num(packagingCharge),
    extraCharge: num(extraCharge),
    extraChargeReason: extraReason,
    discount: num(discount),
    discountType,
    complimentaryType: compType,
    complimentaryItems: compType === "ITEMS" ? compItems : [],
    complimentaryNote: compNote,
  });

  /* ---------- actions ---------- */
  const printAll = async (jobs) => {
    const list = jobs.filter(Boolean);
    if (list.length === 0) return;
    try {
      await printJobsOnThisDevice(list, {
        combineBrowserFallback: true,
        combineLocalJobs: false,
        ensureCutAfterEach: true,
      });
    } catch (err) {
      console.error("PRINT ERROR:", err);
      setNotice("Saved, but printing failed. Check the printer.");
    }
  };

  const openSettlePopup = () => {
    setMethod(paymentMethods[0] || "CASH");
    setCashReceived("");
    setCardLast4("");
    setSettleError("");
    setSettleOpen(true);
  };

  const closeSettlePopup = () => {
    if (busy) return;
    setSettleOpen(false);
    setSettleError("");
  };

  const handleGenerate = async () => {
    if (cart.length === 0) {
      setNotice("Add at least one item");
      return;
    }
    try {
      setBusy(true);
      setNotice("");
      const response = await generateTableBill(activeTable._id, {
        items: cart.map((l) => ({
          menuItem: l.menuItem,
          quantity: l.quantity,
          customization: l.note.trim() ? [l.note.trim()] : [],
        })),
        ...chargePayload(),
      });
      const { printJob, kotPrintJob, ...bill } = response;
      setOpenBill(bill);
      setCart([]);
      await printAll([printJob, kotPrintJob]);
      loadBoard();
      openSettlePopup(); // bill + KOT printed -> ask how the customer paid
    } catch (err) {
      setNotice(err?.response?.data?.message || err.message || "Failed to generate bill");
    } finally {
      setBusy(false);
    }
  };

  const handleSettle = async () => {
    if (cart.length > 0) {
      setSettleError("Finalize the new items first (KOT), or remove them.");
      return;
    }
    try {
      setBusy(true);
      setSettleError("");
      const response = await settleTableBill(activeTable._id, {
        paymentMethod: method,
        ...chargePayload(),
        cashReceived: method === "CASH" ? num(cashReceived) : 0,
        cardLast4: method === "CARD" ? cardLast4 : "",
      });
      await printAll([response.settlementPrintJob]);
      closeTable();
      loadBoard();
    } catch (err) {
      setSettleError(err?.response?.data?.message || err.message || "Failed to settle");
    } finally {
      setBusy(false);
    }
  };

  // F5 = Finalize Order (instead of reloading the page).
  const handleGenerateRef = useRef(handleGenerate);
  handleGenerateRef.current = handleGenerate;
  useEffect(() => {
    if (!activeTable) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "F5") return;
      event.preventDefault();
      if (event.repeat || busy || cart.length === 0) return;
      if (settleOpen || showMenuList || showAdvanced || showComp) return;
      handleGenerateRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTable, busy, cart.length, settleOpen, showMenuList, showAdvanced, showComp]);

  // Settle pop-up keys: arrows / 1-9 choose, Enter settles & prints, Esc skips.
  const handleSettleRef = useRef(handleSettle);
  handleSettleRef.current = handleSettle;
  const closeSettleRef = useRef(closeSettlePopup);
  closeSettleRef.current = closeSettlePopup;
  useEffect(() => {
    if (!settleOpen) return undefined;
    const onKeyDown = (event) => {
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName);
      const count = paymentMethods.length;
      const current = paymentMethods.indexOf(method);
      if (event.key === "Escape") {
        event.preventDefault();
        closeSettleRef.current();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        if (!event.repeat) handleSettleRef.current();
        return;
      }
      if (typing || count === 0) return;
      if (/^[1-9]$/.test(event.key) && paymentMethods[Number(event.key) - 1]) {
        event.preventDefault();
        setMethod(paymentMethods[Number(event.key) - 1]);
      } else if (["ArrowRight", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        setMethod(paymentMethods[(current + 1) % count]);
      } else if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        setMethod(paymentMethods[(current - 1 + count) % count]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [settleOpen, method, paymentMethods]);

  const toggleCompItem = (id) =>
    setCompItems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  /* ================= TABLE GRID ================= */
  if (!activeTable) {
    return (
      <div className="min-h-screen bg-[#f3f7fc] p-3 dark:bg-neutral-800 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/70 p-1 dark:bg-slate-800">
              {[
                ["TABLES", "Tables"],
                ["HISTORY", "Billing History"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setView(value)}
                  className={`min-h-9 rounded-lg px-4 py-1.5 text-sm font-bold transition ${
                    view === value
                      ? "bg-emerald-600 text-white shadow"
                      : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {view === "TABLES" && (
              <div className="flex gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <i className="h-3 w-3 rounded bg-emerald-500" /> Free
                </span>
                <span className="flex items-center gap-1">
                  <i className="h-3 w-3 rounded bg-amber-500" /> Running
                </span>
              </div>
            )}
          </div>

          {view === "HISTORY" && (
            <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <input
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search bill no or table"
                  className={`${inputCls} !w-56`}
                />
                {["ALL", "PAID", "VOID"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setHistoryFilter(f)}
                    className={`min-h-10 rounded-xl px-3 text-xs font-black ${
                      historyFilter === f
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {f === "ALL" ? "All" : f === "PAID" ? "Paid" : "Voided"}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={loadHistory}
                  className="min-h-10 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  Refresh
                </button>
              </div>

              {historyNotice && (
                <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                  {historyNotice}
                </p>
              )}
              {historyLoading && <p className="text-sm text-slate-500">Loading history...</p>}
              {!historyLoading && filteredHistory.length === 0 && (
                <p className="text-sm text-slate-500">No bills found.</p>
              )}

              <div className="overflow-x-auto">
                {filteredHistory.length > 0 && (
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
                        <th className="py-2 pr-3">Bill</th>
                        <th className="py-2 pr-3">Table</th>
                        <th className="py-2 pr-3">Date</th>
                        <th className="py-2 pr-3">Payment</th>
                        <th className="py-2 pr-3 text-right">Total</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((b) => (
                        <tr key={b._id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-2.5 pr-3 font-bold text-slate-800 dark:text-slate-100">#{b.billNo}</td>
                          <td className="py-2.5 pr-3">T{b.order?.table?.tableNumber ?? "-"}</td>
                          <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300">
                            {new Date(b.paidAt || b.updatedAt || b.createdAt).toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 pr-3">{b.paymentMethod || "-"}</td>
                          <td className="py-2.5 pr-3 text-right font-bold">{formatCurrency(b.totalAmount)}</td>
                          <td className="py-2.5 pr-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-black ${
                                b.paymentStatus === "VOID"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {b.paymentStatus === "VOID" ? "Voided" : "Paid"}
                            </span>
                            {b.paymentStatus === "VOID" && b.voidReason && (
                              <p className="mt-1 max-w-[220px] truncate text-[11px] text-slate-500" title={b.voidReason}>
                                {b.voidReason}
                              </p>
                            )}
                          </td>
                          <td className="py-2.5 text-right">
                            {b.paymentStatus === "PAID" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setVoidTarget(b);
                                  setVoidReason("");
                                  setVoidReissue(true);
                                  setVoidError("");
                                }}
                                className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-600 hover:bg-rose-100"
                              >
                                Void Bill
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {voidTarget && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Void Bill #{voidTarget.billNo}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Table {voidTarget.order?.table?.tableNumber ?? "-"} · {formatCurrency(voidTarget.totalAmount)}
                </p>
                <textarea
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  rows={3}
                  placeholder="Reason for voiding (min 5 characters)"
                  className="mt-3 w-full rounded-xl border border-[#d7e3ef] px-3 py-2 text-sm outline-none focus:border-rose-400 dark:border-slate-700 dark:bg-slate-950"
                />
                <label className="mt-3 flex items-start gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={voidReissue}
                    onChange={(e) => setVoidReissue(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    Re-open this bill on the table so I can correct and settle it again
                    <span className="block text-xs font-normal text-slate-500">
                      Untick to cancel the bill completely.
                    </span>
                  </span>
                </label>
                {voidError && <p className="mt-3 text-sm font-semibold text-red-600">{voidError}</p>}
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVoidTarget(null)}
                    className="min-h-11 flex-1 rounded-xl bg-slate-100 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleVoid}
                    disabled={voidBusy}
                    className="min-h-11 flex-1 rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    {voidBusy ? "Voiding..." : "Void Bill"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === "TABLES" && error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          {view === "TABLES" && loading && <p className="text-sm text-slate-500">Loading tables...</p>}
          {view === "TABLES" && !loading && tables.length === 0 && !error && (
            <p className="text-sm text-slate-500">No tables found. Ask the admin to add tables.</p>
          )}

          <div
            className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 ${
              view === "TABLES" ? "" : "hidden"
            }`}
          >
            {tables.map((table) => {
              const running = Boolean(table.openBill);
              return (
                <button
                  key={table._id}
                  type="button"
                  onClick={() => openTable(table)}
                  className={`rounded-2xl border-2 p-3 text-left shadow-sm transition hover:shadow-md ${
                    running
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
                      : "border-emerald-300 bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                    T{table.tableNumber}
                  </div>
                  <div className="text-xs text-slate-500">Seats {table.capacity}</div>
                  <div className={`mt-2 text-sm font-bold ${running ? "text-amber-700" : "text-emerald-600"}`}>
                    {running ? formatCurrency(table.openBill.totalAmount) : "Free"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ================= BILLING SCREEN (same look as manual New Bill) ================= */
  return (
    <div className="min-h-screen bg-[#f3f7fc] p-3 dark:bg-neutral-800 sm:p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-[#eef4fb] px-3 py-2 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <button
            type="button"
            onClick={closeTable}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-white/70 px-3 text-sm font-bold text-slate-700 hover:bg-white dark:bg-slate-800 dark:text-slate-200"
          >
            <FaArrowLeft /> All Tables
          </button>
          <p className="text-sm font-black text-slate-800 dark:text-slate-100">
            Table {activeTable.tableNumber}
            <span className="ml-2 font-semibold text-slate-500">
              {openBill ? `Bill #${openBill.billNo} · running` : "New order"}
            </span>
          </p>
        </div>

        {notice && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{notice}</p>
        )}

        <div className="rounded-[28px] bg-[#f8fbff] p-2.5 shadow-sm ring-1 ring-[#dce7f3] dark:bg-slate-900 dark:ring-slate-700 min-[1024px]:p-3 xl:rounded-[30px]">
          <div className="grid gap-2.5 min-[1024px]:grid-cols-[220px_minmax(0,1fr)_195px] min-[1024px]:gap-3 xl:grid-cols-[360px_minmax(0,1fr)_300px] xl:gap-4">
            {/* ============ LEFT ============ */}
            <div className="space-y-3 min-[1024px]:sticky min-[1024px]:top-4 min-[1024px]:self-start">
              <div className={cardCls}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-900 dark:text-white">
                    Bill Setup
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      {allLines.length} items
                    </span>
                    <span className="rounded-lg bg-[#e8f8ef] px-2 py-1 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                      {formatCurrency(totals.total)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex min-h-10 items-center rounded-xl border border-[#d7e3ef] bg-slate-50 px-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    Table {activeTable.tableNumber}
                  </div>
                  <input
                    type="text"
                    placeholder="Customer phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className={inputCls}
                  />
                  <input
                    type="email"
                    placeholder="Customer email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className={`${inputCls} col-span-2`}
                  />
                </div>
              </div>

              <div className="rounded-[22px] border border-[#d7e3ef] bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950 xl:rounded-[24px]">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(true)}
                  className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span>
                    <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">
                      Advanced Bill Options
                    </span>
                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                      GST, discount, service, packaging, and extra charge
                    </span>
                  </span>
                  <span className={pillCls}>Open</span>
                </button>
              </div>

              <div className="rounded-[22px] border border-[#d7e3ef] bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950 xl:rounded-[24px]">
                <button
                  type="button"
                  onClick={() => setShowComp(true)}
                  className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span>
                    <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">
                      Complimentary
                    </span>
                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                      {compType === "NONE"
                        ? "No free items applied"
                        : `${compType.replace("_", " ")} | ${formatCurrency(totals.complimentary)}`}
                    </span>
                  </span>
                  <span className={pillCls}>Open</span>
                </button>
              </div>

              {showAdvanced && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
                  <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        Advanced Bill Options
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowAdvanced(false)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Close"
                      >
                        <FaTimes />
                      </button>
                    </div>
                    <p className="mb-4 text-xs text-slate-500">
                      GST, discount, service, packaging, and extra charge
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs font-bold text-slate-500">
                        CGST %
                        <input type="number" min="0" value={cgstRate !== "" ? cgstRate : taxDefaults.cgst}
                          onChange={(e) => setCgstRate(e.target.value)} className={`${inputCls} mt-1`} />
                      </label>
                      <label className="text-xs font-bold text-slate-500">
                        SGST %
                        <input type="number" min="0" value={sgstRate !== "" ? sgstRate : taxDefaults.sgst}
                          onChange={(e) => setSgstRate(e.target.value)} className={`${inputCls} mt-1`} />
                      </label>
                      <label className="col-span-2 text-xs font-bold text-slate-500">
                        Discount
                        <div className="mt-1 flex gap-2">
                          <input type="number" min="0" value={discount}
                            onChange={(e) => setDiscount(e.target.value)} className={inputCls} />
                          <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}
                            className={`${inputCls} !w-20 px-2 font-semibold`}>
                            <option value="AMOUNT">₹</option>
                            <option value="PERCENT">%</option>
                          </select>
                        </div>
                      </label>
                      <label className="text-xs font-bold text-slate-500">
                        Service charge
                        <input type="number" min="0" value={serviceCharge}
                          onChange={(e) => setServiceCharge(e.target.value)} className={`${inputCls} mt-1`} />
                      </label>
                      <label className="text-xs font-bold text-slate-500">
                        Packaging
                        <input type="number" min="0" value={packagingCharge}
                          onChange={(e) => setPackagingCharge(e.target.value)} className={`${inputCls} mt-1`} />
                      </label>
                      <label className="col-span-2 text-xs font-bold text-slate-500">
                        Extra charge
                        <input type="number" min="0" value={extraCharge}
                          onChange={(e) => setExtraCharge(e.target.value)} className={`${inputCls} mt-1`} />
                      </label>
                      {num(extraCharge) > 0 && (
                        <input
                          value={extraReason}
                          onChange={(e) => setExtraReason(e.target.value)}
                          placeholder="Extra charge reason"
                          className={`${inputCls} col-span-2`}
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(false)}
                      className="mt-5 min-h-11 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700"
                    >
                      Done
                    </button>
                  </div>
                </div>,
                document.body
              )}

              {showComp && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
                  <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        Complimentary
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowComp(false)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Close"
                      >
                        <FaTimes />
                      </button>
                    </div>
                    <p className="mb-4 text-xs text-slate-500">Mark the whole order or some items as free.</p>
                    <div className="space-y-2 text-sm">
                      {[
                        ["NONE", "None"],
                        ["FULL_ORDER", "Full order free"],
                        ["ITEMS", "Selected items free"],
                      ].map(([value, label]) => (
                        <label key={value} className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                          <input
                            type="radio"
                            checked={compType === value}
                            onChange={() => setCompType(value)}
                          />
                          {label}
                        </label>
                      ))}
                      {compType === "ITEMS" && (
                        <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                          {Array.from(new Map(allLines.map((l) => [l.id, l])).values()).map((l) => (
                            <label key={l.id} className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                              <input
                                type="checkbox"
                                checked={compItems.includes(l.id)}
                                onChange={() => toggleCompItem(l.id)}
                              />
                              {l.name}
                            </label>
                          ))}
                          {allLines.length === 0 && (
                            <p className="text-xs text-slate-500">Add items first.</p>
                          )}
                        </div>
                      )}
                      {compType !== "NONE" && (
                        <input
                          value={compNote}
                          onChange={(e) => setCompNote(e.target.value)}
                          placeholder="Reason / note"
                          className={inputCls}
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowComp(false)}
                      className="mt-5 min-h-11 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700"
                    >
                      Done
                    </button>
                  </div>
                </div>,
                document.body
              )}
            </div>

            {/* ============ MIDDLE ============ */}
            <div className="rounded-[24px] border border-[#d7e3ef] bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950 xl:rounded-[26px] xl:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[1.05rem] font-black text-slate-900 dark:text-white">
                    Selected Items
                  </h3>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {cart.length} new item{cart.length === 1 ? "" : "s"} in this KOT
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden rounded-xl bg-[#eaf9ef] px-3 py-2.5 text-right sm:block dark:bg-emerald-950/30 xl:rounded-2xl xl:px-4 xl:py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                      Current Total
                    </p>
                    <p className="text-sm font-black text-emerald-700 dark:text-emerald-200">
                      {formatCurrency(totals.total)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMenuList(true)}
                    className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 xl:min-h-14 xl:rounded-[18px] xl:px-5 xl:text-base"
                  >
                    <FaPlus />
                    Add Item
                  </button>
                </div>
              </div>

              <div className="relative mb-4 rounded-[22px] border border-emerald-200 bg-[#f2fcf7] p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 xl:rounded-[24px] xl:p-5">
                {cart.length > 0 && (
                  <div className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 z-30 overflow-hidden rounded-2xl border border-emerald-300 bg-white shadow-xl dark:border-emerald-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-3 border-b border-emerald-100 px-4 py-3 dark:border-emerald-900/50">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-emerald-600">
                          Current order
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-500">
                          {cart.length} item{cart.length === 1 ? "" : "s"} added
                        </p>
                      </div>
                      <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(totals.total)}
                      </p>
                    </div>

                    <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                      {(showAllFastAdd ? cart : cart.slice(0, 7)).map((item) => (
                        <div
                          key={`fast-add-cart-${item.menuItem}`}
                          className="flex items-center justify-between gap-2 px-3 py-1.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-black text-slate-900 dark:text-white">
                              {item.name}
                            </p>
                            <p className="truncate text-[10px] font-semibold text-slate-500">
                              Code {menu.find((m) => m._id === item.menuItem)?.menuCode || "----"}
                              {" · "}
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => changeQty(item.menuItem, -1)}
                              className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 text-[10px] text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                            >
                              <FaMinus />
                            </button>
                            <span className="w-5 text-center text-xs font-black text-slate-900 dark:text-white">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => changeQty(item.menuItem, 1)}
                              className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-600 text-[10px] text-white hover:bg-emerald-700"
                            >
                              <FaPlus />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                changeQty(item.menuItem, -item.quantity);
                                codeRef.current?.focus();
                              }}
                              className="ml-0.5 min-h-11 rounded-md bg-rose-50 px-2 text-[9px] font-black text-rose-600 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-300"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {cart.length > 7 && (
                      <button
                        type="button"
                        onClick={() => setShowAllFastAdd((v) => !v)}
                        className="w-full border-t border-emerald-100 bg-emerald-50/70 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                      >
                        {showAllFastAdd ? "Show less" : `+ ${cart.length - 7} more items`}
                      </button>
                    )}
                  </div>
                )}

                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                  Fast Add By Code
                </p>
                <p className="mt-1 text-[11px] font-medium text-emerald-700/80 dark:text-emerald-200/80">
                  Type the menu code and press Enter.
                </p>
                <div className="mt-3 flex gap-2">
                  <input
                    ref={codeRef}
                    type="text"
                    autoComplete="off"
                    autoCapitalize="characters"
                    maxLength={20}
                    value={codeInput}
                    onChange={(e) =>
                      setCodeInput(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddByCode();
                      }
                    }}
                    placeholder="Enter code, e.g. A1 or TEA10"
                    className="min-h-12 w-full rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 dark:border-emerald-900/50 dark:bg-slate-900 dark:text-slate-100 xl:min-h-14 xl:rounded-2xl xl:px-5 xl:text-base"
                  />
                  <button
                    type="button"
                    onClick={handleAddByCode}
                    className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700 xl:min-h-14 xl:rounded-2xl xl:px-6 xl:text-base"
                  >
                    Add
                  </button>
                </div>

                <div
                  className="relative mt-3"
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) setNameSearchOpen(false);
                  }}
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                    Search Item By Name
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-emerald-700/80 dark:text-emerald-200/80">
                    Type the item name and tap a result to add it.
                  </p>
                  <input
                    type="text"
                    autoComplete="off"
                    value={nameSearch}
                    onChange={(e) => {
                      setNameSearch(e.target.value);
                      setNameSearchOpen(true);
                    }}
                    onFocus={() => setNameSearchOpen(true)}
                    placeholder="Search item name, e.g. Paneer Tikka"
                    className="mt-3 min-h-12 w-full rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 dark:border-emerald-900/50 dark:bg-slate-900 dark:text-slate-100 xl:min-h-14 xl:rounded-2xl xl:px-5 xl:text-base"
                  />
                  {nameSearchOpen && nameSearch.trim() && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-emerald-200 bg-white shadow-xl dark:border-emerald-900/50 dark:bg-slate-900">
                      {nameResults.length === 0 ? (
                        <p className="px-4 py-3 text-sm font-semibold text-slate-500">No matching items</p>
                      ) : (
                        nameResults.map((item) => (
                          <button
                            key={item._id}
                            type="button"
                            onClick={() => {
                              addItem(item);
                              setNameSearch("");
                              setNameSearchOpen(false);
                            }}
                            className="flex min-h-12 w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 text-left last:border-b-0 hover:bg-emerald-50 dark:border-slate-800 dark:hover:bg-emerald-950/20"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                                {item.name}
                              </span>
                              <span className="text-xs font-semibold text-slate-500">
                                Code {item.menuCode || "----"}
                              </span>
                            </span>
                            <span className="shrink-0 text-sm font-black text-emerald-700">
                              {formatCurrency(item.price)}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {showMenuList &&
                createPortal(
                  <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/55 sm:items-center sm:p-4">
                    <div className="flex h-[92svh] w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:rounded-2xl">
                      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-slate-900 px-4 py-4 text-white sm:px-6">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                            Select Menu
                          </p>
                          <h2 className="mt-2 text-xl font-black">Menu List</h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowMenuList(false)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                          aria-label="Close"
                        >
                          <FaTimes />
                        </button>
                      </div>

                      <div className="shrink-0 border-b border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-950">
                          <FaSearch className="text-slate-400" />
                          <input
                            type="text"
                            autoFocus
                            autoComplete="off"
                            placeholder="Search by menu, cuisine or category..."
                            value={menuSearch}
                            onChange={(e) => setMenuSearch(e.target.value)}
                            className="h-12 w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="grid min-h-0 flex-1 gap-0 overflow-hidden min-[1024px]:grid-cols-[1fr_300px]">
                        <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
                          {Object.keys(menuGroups).length === 0 && (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-950">
                              No menu items found.
                            </div>
                          )}

                          <div className="space-y-5">
                            {Object.entries(menuGroups).map(([groupKey, group]) => (
                              <section key={groupKey}>
                                <div className="mb-2 flex items-end justify-between gap-3">
                                  <div>
                                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                                      {group.title}
                                    </h3>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                                      {group.subtitle}
                                    </p>
                                  </div>
                                  <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800">
                                    {group.items.length} items
                                  </span>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2 min-[1024px]:grid-cols-3">
                                  {group.items.map((item) => {
                                    const selectedItem = cart.find((l) => l.menuItem === item._id);
                                    return (
                                      <button
                                        key={item._id}
                                        type="button"
                                        onClick={() => addItem(item)}
                                        className={`flex min-h-16 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 ${
                                          selectedItem
                                            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                                            : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950"
                                        }`}
                                      >
                                        <span className="min-w-0">
                                          <span className="block break-words text-sm font-bold leading-snug text-slate-800 dark:text-slate-100">
                                            {item.name}
                                          </span>
                                          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 font-bold tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                              Code {item.menuCode || "----"}
                                            </span>
                                            <span>{item.courseType || "General"}</span>
                                            {item.gstFree && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700">GST Free</span>}
                                          </span>
                                        </span>
                                        <span className="shrink-0 text-right">
                                          <span className="block text-sm font-black text-emerald-700">
                                            {formatCurrency(item.price)}
                                          </span>
                                          {selectedItem && (
                                            <span className="mt-1 inline-flex rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                                              Qty {selectedItem.quantity}
                                            </span>
                                          )}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </section>
                            ))}
                          </div>
                        </div>

                        <aside className="min-h-0 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950 min-[1024px]:border-l min-[1024px]:border-t-0">
                          <div className="flex h-full min-h-0 flex-col">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                  Selected Items
                                </h3>
                                <p className="text-xs font-semibold text-slate-500">
                                  {cart.length} item{cart.length === 1 ? "" : "s"} selected
                                </p>
                              </div>
                              <p className="text-lg font-black text-emerald-700">
                                {formatCurrency(totals.total)}
                              </p>
                            </div>

                            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                              {cart.length === 0 && (
                                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900">
                                  Selected dishes will appear here.
                                </div>
                              )}

                              {cart.map((item) => (
                                <div
                                  key={`${item.menuItem}-picker-selected`}
                                  className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="break-words pr-2 text-sm font-bold leading-snug text-slate-800 dark:text-slate-100">
                                        {item.name}
                                      </p>
                                      <p className="mt-1 text-xs font-semibold text-slate-500">
                                        {formatCurrency(item.price)} x {item.quantity}
                                      </p>
                                    </div>
                                    <p className="shrink-0 text-sm font-black text-slate-900 dark:text-white">
                                      {formatCurrency(item.price * item.quantity)}
                                    </p>
                                  </div>
                                  <div className="mt-3 flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => changeQty(item.menuItem, -1)}
                                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                                    >
                                      <FaMinus />
                                    </button>
                                    <span className="w-8 text-center text-sm font-black text-slate-800 dark:text-slate-100">
                                      {item.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => changeQty(item.menuItem, 1)}
                                      className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                    >
                                      <FaPlus />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </aside>
                      </div>

                      <div className="shrink-0 border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:p-4">
                        <button
                          type="button"
                          onClick={() => setShowMenuList(false)}
                          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}

              <div className="max-h-[430px] space-y-3 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.menuItem}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-950"
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <p className="break-words pr-2 text-sm font-bold leading-snug text-slate-800 dark:text-slate-100">
                          {item.name}
                          {item.gstFree && <span className="ml-2 align-middle rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700">GST Free</span>}
                        </p>
                        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-200 dark:bg-slate-900 dark:ring-emerald-900/60">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">
                        {formatCurrency(item.price)} x {item.quantity}
                      </div>
                      <input
                        value={item.note}
                        onChange={(e) => setNote(item.menuItem, e.target.value)}
                        placeholder="Note for kitchen (optional)"
                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                    <div className="flex items-center gap-2 self-start rounded-xl bg-white px-2 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                      <button
                        type="button"
                        onClick={() => changeQty(item.menuItem, -1)}
                        className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                      >
                        <FaMinus />
                      </button>
                      <span className="w-8 text-center text-sm font-black text-slate-800 dark:text-slate-100">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQty(item.menuItem, 1)}
                        className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <FaPlus />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {runningItems.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Already on bill (KOT printed)
                  </p>
                  <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
                    {runningItems.map((item, idx) => (
                      <div key={item._id || idx} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                        <span className="min-w-0 truncate font-semibold text-slate-700 dark:text-slate-200">
                          {item.quantity} × {item.menuItem?.name || "Item"}
                        </span>
                        <span className="shrink-0 font-bold text-slate-600 dark:text-slate-300">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ============ RIGHT ============ */}
            <div className="min-[1024px]:sticky min-[1024px]:top-4 min-[1024px]:self-start">
              <div className="rounded-[24px] border border-[#d7e3ef] bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950 xl:rounded-[26px] xl:p-5">
                <h3 className="mb-4 text-[1.05rem] font-black text-slate-900 dark:text-white">
                  Billing Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-3 text-slate-600 dark:text-slate-300">
                    <span>Items Subtotal</span>
                    <span>{formatCurrency(totals.itemsSubtotal)}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-slate-600 dark:text-slate-300">
                    <span>Complimentary</span>
                    <span>-{formatCurrency(totals.complimentary)}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-slate-600 dark:text-slate-300">
                    <span>Taxes (GST)</span>
                    <span>{formatCurrency(totals.tax)}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-slate-600 dark:text-slate-300">
                    <span>Service Charge</span>
                    <span>{formatCurrency(totals.service)}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-slate-600 dark:text-slate-300">
                    <span>Packaging</span>
                    <span>{formatCurrency(totals.packaging)}</span>
                  </div>
                  {totals.extra > 0 && (
                    <div className="flex justify-between gap-3 text-slate-600 dark:text-slate-300">
                      <span>Extra Charge</span>
                      <span>{formatCurrency(totals.extra)}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-3 text-emerald-700 dark:text-emerald-300">
                    <span>
                      {discountType === "PERCENT" && num(discount) > 0
                        ? `Discount (${num(discount)}%)`
                        : "Discount"}
                    </span>
                    <span>-{formatCurrency(totals.discount)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvanced(true)}
                  className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Edit Taxes & Fees
                </button>

                <div className="mt-4 flex items-end justify-between gap-3 border-t border-dashed border-slate-200 pt-4 dark:border-slate-700">
                  <span className="text-sm font-black text-slate-900 dark:text-white">Total Amount</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatCurrency(totals.total)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={busy || cart.length === 0}
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaCheck />
                  {busy ? "Generating..." : "Finalize Order"}
                  <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-black">F5</span>
                </button>
                <p className="mt-1.5 text-center text-[11px] text-slate-500">Prints KOT + Bill</p>

                {openBill && (
                  <button
                    type="button"
                    onClick={openSettlePopup}
                    className="mt-3 min-h-12 w-full rounded-xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                  >
                    Settle Payment
                  </button>
                )}

                {openBill &&
                  settleOpen &&
                  createPortal(
                    <div
                      className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
                      onClick={closeSettlePopup}
                    >
                      <div
                        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                            <FaCheck />
                          </div>
                          <div className="min-w-0">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">
                              Settle Bill #{openBill.billNo}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              Bill generated. Choose how the customer paid.
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-center dark:bg-emerald-950/30">
                          <p className="text-[10px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                            Amount to collect
                          </p>
                          <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-200">
                            {formatCurrency(totals.total)}
                          </p>
                        </div>

                        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          Payment type
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {paymentMethods.map((m, idx) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setMethod(m);
                                setSettleError("");
                              }}
                              className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-bold transition ${
                                method === m
                                  ? "border-emerald-500 bg-emerald-600 text-white"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                              }`}
                            >
                              <span className="mr-1 text-[10px] opacity-60">{idx + 1}</span>
                              {String(m).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-[11px] text-slate-400">
                          Arrows / 1-9 to choose &middot; Enter to settle &amp; print &middot; Esc to skip
                        </p>

                        {method === "CASH" && (
                          <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                                Cash Calculator
                              </p>
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Bill {formatCurrency(totals.total)}
                              </p>
                            </div>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              autoFocus
                              value={cashReceived}
                              onChange={(e) => setCashReceived(e.target.value)}
                              placeholder="Cash received"
                              className="min-h-11 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-slate-100"
                            />
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                              <div className="rounded-lg bg-white/80 p-2 dark:bg-slate-900/50">
                                <p className="text-slate-400">Balance</p>
                                <p className="mt-0.5 font-bold text-rose-600 dark:text-rose-300">
                                  {formatCurrency(Math.max(totals.total - num(cashReceived), 0))}
                                </p>
                              </div>
                              <div className="rounded-lg bg-white/80 p-2 dark:bg-slate-900/50">
                                <p className="text-slate-400">Change</p>
                                <p className="mt-0.5 font-bold text-emerald-700 dark:text-emerald-300">
                                  {formatCurrency(Math.max(num(cashReceived) - totals.total, 0))}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {method === "CARD" && (
                          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Card last 4 digits <span className="font-semibold normal-case">(optional)</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={4}
                              autoFocus
                              value={cardLast4}
                              onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                              placeholder="e.g. 4242"
                              className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold tracking-[0.3em] text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            />
                          </label>
                        )}

                        {settleError && (
                          <p role="alert" className="mt-3 text-sm font-semibold text-rose-600 dark:text-rose-300">
                            {settleError}
                          </p>
                        )}

                        <div className="mt-5 flex gap-2">
                          <button
                            type="button"
                            onClick={closeSettlePopup}
                            disabled={busy}
                            className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                          >
                            Skip
                          </button>
                          <button
                            type="button"
                            onClick={handleSettle}
                            disabled={busy || !method}
                            className="inline-flex min-h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <FaPrint />
                            {busy ? "Settling..." : "Settle & Print"}
                          </button>
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
