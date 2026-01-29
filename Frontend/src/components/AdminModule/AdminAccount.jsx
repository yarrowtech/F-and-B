// import React, { useState, useMemo } from "react";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// // ✅ Floating Input Component
// const FloatingInput = ({ id, label, type = "text", value, onChange, error, maxLength }) => (
//   <div className="relative w-full">
//     <input
//       id={id}
//       type={type}
//       value={value}
//       onChange={onChange}
//       placeholder=" "
//       maxLength={maxLength}
//       className="peer w-full px-4 pt-5 pb-2 bg-white dark:bg-zinc-800 text-black dark:text-white border border-gray-300 dark:border-zinc-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
//     />
//     <label
//       htmlFor={id}
//       className="absolute left-4 top-2 text-sm text-gray-500 dark:text-gray-300 transition-all
//         peer-placeholder-shown:top-3.5
//         peer-placeholder-shown:text-base
//         peer-placeholder-shown:text-gray-400 dark:peer-placeholder-shown:text-gray-500
//         peer-focus:top-2
//         peer-focus:text-sm
//         peer-focus:text-green-600 peer-focus:drop-shadow-sm"
//     >
//       {label}
//     </label>
//     {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
//   </div>
// );

// const AdminAccountManager = () => {
//   const [activeTab, setActiveTab] = useState("employee");

//   const [employees, setEmployees] = useState([]);
//   const [vendors, setVendors] = useState([]);
//   const [others, setOthers] = useState([]);
//   const [history, setHistory] = useState([]);

//   const [formData, setFormData] = useState({
//     employee: { name: "", employeeId: "", salary: "", accountNumber: "", ifsc: "" },
//     vendor: { companyName: "", vendorname: "", amount: "", accountNumber: "", ifsc: "" },
//     others: { label: "", balance: "", accountNumber: "", ifsc: "" },
//   });

//   const [errors, setErrors] = useState({});

//   const validate = (type) => {
//     const data = formData[type];
//     const errs = {};

//     const requiredFields = {
//       employee: ["name", "employeeId", "salary", "accountNumber", "ifsc"],
//       vendor: ["companyName", "vendorname", "amount", "accountNumber", "ifsc"],
//       others: ["label", "balance", "accountNumber", "ifsc"],
//     };

//     requiredFields[type].forEach((field) => {
//       if (!data[field]?.trim()) errs[field] = `${field} is required`;
//     });

//     if (!/^\d{9,16}$/.test(data.accountNumber)) errs.accountNumber = "Enter valid A/C (9–16 digits)";
//     if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.ifsc)) errs.ifsc = "Enter valid IFSC";

//     return errs;
//   };

//   const handleAdd = () => {
//     const errs = validate(activeTab);
//     if (Object.keys(errs).length) {
//       setErrors(errs);
//       return;
//     }

//     const updatedData = [...(activeTab === "employee" ? employees : activeTab === "vendor" ? vendors : others)];
//     const newEntry = formData[activeTab];
//     const date = new Date().toLocaleString();

//     updatedData.push(newEntry);

//     if (activeTab === "employee") setEmployees(updatedData);
//     if (activeTab === "vendor") setVendors(updatedData);
//     if (activeTab === "others") setOthers(updatedData);

//     setHistory([...history, { ...newEntry, type: activeTab, date }]);

//     setFormData({
//       ...formData,
//       [activeTab]: Object.fromEntries(Object.keys(formData[activeTab]).map((k) => [k, ""])),
//     });

//     setErrors({});
//   };

//   const handleDelete = (type, index) => {
//     const update = (arr) => arr.filter((_, i) => i !== index);
//     if (type === "employee") setEmployees(update(employees));
//     if (type === "vendor") setVendors(update(vendors));
//     if (type === "others") setOthers(update(others));
//   };

 

//   const exportPDF = () => {
//     const doc = new jsPDF();
//     const table = history.map((item) => Object.values(item));
//     const headers = history.length ? Object.keys(history[0]) : [];

//     autoTable(doc, {
//       head: [headers],
//       body: table,
//     });
//     doc.save("account_history.pdf");
//   };

//   const tabData = useMemo(() => {
//     const configs = {
//       employee: {
//         data: employees,
//         fields: [
//           { id: "name", label: "Name" },
//           { id: "employeeId", label: "Employee ID" },
//           { id: "salary", label: "Salary", type: "number" },
//           { id: "accountNumber", label: "Account Number", maxLength: 16 },
//           { id: "ifsc", label: "IFSC", maxLength: 11 },
//         ],
//       },
//       vendor: {
//         data: vendors,
//         fields: [
//           { id: "companyName", label: "Company Name" },
//           { id: "vendorname", label: "Vendor Name" },
//           { id: "amount", label: "Amount", type: "number" },
//           { id: "accountNumber", label: "Account Number", maxLength: 16 },
//           { id: "ifsc", label: "IFSC", maxLength: 11 },
//         ],
//       },
//       others: {
//         data: others,
//         fields: [
//           { id: "label", label: "Service Type (e.g. Plumber, Electrician)" },
//           { id: "balance", label: "Payable Amount", type: "number" },
//           { id: "accountNumber", label: "Account Number", maxLength: 16 },
//           { id: "ifsc", label: "IFSC", maxLength: 11 },
//         ],
//       },
//       history: {
//         data: history,
//         form: (
//           <div className="flex gap-4 flex-wrap">
//             <button
//               onClick={exportPDF}
//               className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white px-5 py-2 rounded-xl shadow"
//             >
//               Export PDF
//             </button>
            
//           </div>
//         ),
//       },
//     };

//     return configs;
//   }, [employees, vendors, others, history, formData, errors]);

//   const current = tabData[activeTab];

//   return (
//     <div className="p-6 bg-white/80 dark:bg-zinc-900 dark:text-white backdrop-blur-xl shadow-2xl rounded-2xl border border-gray-200 dark:border-zinc-800 max-w-6xl mx-auto transition-all">
//       <h2 className="text-3xl font-bold mb-6 text-left text-black-700 dark:text-green-400">
//             Account Management 
//           </h2>

//       <div className="flex gap-4 mb-8 justify-center flex-wrap">
//         {[
//           { key: "employee", label: "Employee" },
//           { key: "vendor", label: "Vendor" },
//           { key: "others", label: "Others" },
//           { key: "history", label: "History" },
//         ].map(({ key, label }) => (
//           <button
//             key={key}
//             onClick={() => setActiveTab(key)}
//             className={`px-5 py-2.5 rounded-full font-medium transition-all duration-300 shadow-sm ${
//               activeTab === key
//                 ? "bg-gradient-to-r from-green-500 to-green-700 text-white"
//                 : "bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-700 dark:text-white"
//             }`}
//           >
//             {label}
//           </button>
//         ))}
//       </div>

//       {activeTab !== "history" ? (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//           {current.fields.map(({ id, label, type, maxLength }) => (
//             <FloatingInput
//               key={id}
//               id={id}
//               label={label}
//               type={type || "text"}
//               value={formData[activeTab][id]}
//               onChange={(e) =>
//                 setFormData({
//                   ...formData,
//                   [activeTab]: {
//                     ...formData[activeTab],
//                     [id]:
//                       id === "accountNumber"
//                         ? e.target.value.replace(/\D/g, "").slice(0, maxLength || 16)
//                         : id === "ifsc"
//                         ? e.target.value.toUpperCase().slice(0, maxLength || 11)
//                         : e.target.value,
//                   },
//                 })
//               }
//               error={errors[id]}
//               maxLength={maxLength}
//             />
//           ))}
//           <div className="md:col-span-2">
//             <button
//               onClick={handleAdd}
//               className="w-full md:w-auto bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white py-2.5 px-6 rounded-xl shadow-md transition-all"
//             >
//               Add {activeTab === "others" ? "Other" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
//             </button>
//           </div>
//         </div>
//       ) : (
//         <div className="mb-6">{tabData.history.form}</div>
//       )}

//       <div>
//         <h3 className="text-lg font-semibold mb-2">Records:</h3>
//         {current.data.length === 0 ? (
//           <p className="text-gray-500 dark:text-gray-300">No data available.</p>
//         ) : (
//           <div className="overflow-auto rounded-xl border border-gray-200 dark:border-zinc-700">
//             <table className="w-full table-auto border-collapse text-sm text-black dark:text-white">
//               <thead>
//                 <tr className="bg-gray-100 dark:bg-zinc-800 text-left">
//                   {Object.keys(current.data[0]).map((key) => (
//                     <th key={key} className="border px-4 py-2 capitalize">
//                       {key}
//                     </th>
//                   ))}
//                   {activeTab !== "history" && <th className="border px-4 py-2">Action</th>}
//                 </tr>
//               </thead>
//               <tbody>
//                 {current.data.map((item, idx) => (
//                   <tr key={idx} className="hover:bg-green-50 dark:hover:bg-zinc-800 transition-colors duration-200">
//                     {Object.values(item).map((val, i) => (
//                       <td key={i} className="border px-4 py-2">
//                         {val}
//                       </td>
//                     ))}
//                     {activeTab !== "history" && (
//                       <td className="border px-4 py-2 text-center">
//                         <button
//                           onClick={() => handleDelete(activeTab, idx)}
//                           className="text-red-500 hover:underline"
//                         >
//                           Delete
//                         </button>
//                       </td>
//                     )}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AdminAccountManager;



import React, { useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ========================= */
/* Floating Input Component  */
/* ========================= */
const FloatingInput = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  maxLength,
  inputMode,
}) => (
  <div className="relative w-full">
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder=" "
      maxLength={maxLength}
      inputMode={inputMode}
      className="peer w-full px-4 pt-5 pb-2 bg-white dark:bg-zinc-800 text-black dark:text-white border border-gray-300 dark:border-zinc-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
    />
    <label
      htmlFor={id}
      className="absolute left-4 top-2 text-sm text-gray-500 dark:text-gray-300 transition-all
        peer-placeholder-shown:top-3.5
        peer-placeholder-shown:text-base
        peer-placeholder-shown:text-gray-400 dark:peer-placeholder-shown:text-gray-500
        peer-focus:top-2
        peer-focus:text-sm
        peer-focus:text-green-600 peer-focus:drop-shadow-sm"
    >
      {label}
    </label>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

const AdminAccountManager = () => {
  const [activeTab, setActiveTab] = useState("employee");

  const [employees, setEmployees] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [others, setOthers] = useState([]);
  const [history, setHistory] = useState([]);

  const [formData, setFormData] = useState({
    employee: { name: "", employeeId: "", salary: "", accountNumber: "", ifsc: "" },
    vendor: { companyName: "", vendorname: "", amount: "", accountNumber: "", ifsc: "" },
    others: { label: "", balance: "", accountNumber: "", ifsc: "" },
  });

  const [errors, setErrors] = useState({});

  const validate = (type) => {
    const data = formData[type];
    const errs = {};

    const requiredFields = {
      employee: ["name", "employeeId", "salary", "accountNumber", "ifsc"],
      vendor: ["companyName", "vendorname", "amount", "accountNumber", "ifsc"],
      others: ["label", "balance", "accountNumber", "ifsc"],
    };

    requiredFields[type].forEach((field) => {
      if (!data[field]?.trim()) errs[field] = `${field} is required`;
    });

    if (!/^\d{9,16}$/.test(data.accountNumber)) errs.accountNumber = "Enter valid A/C (9–16 digits)";
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.ifsc)) errs.ifsc = "Enter valid IFSC";

    return errs;
  };

  const handleAdd = () => {
    const errs = validate(activeTab);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const list =
      activeTab === "employee" ? employees : activeTab === "vendor" ? vendors : others;

    const newEntry = { ...formData[activeTab] };
    const date = new Date().toLocaleString();

    const updatedData = [...list, newEntry];

    if (activeTab === "employee") setEmployees(updatedData);
    if (activeTab === "vendor") setVendors(updatedData);
    if (activeTab === "others") setOthers(updatedData);

    setHistory([...history, { ...newEntry, type: activeTab, date }]);

    setFormData((prev) => ({
      ...prev,
      [activeTab]: Object.fromEntries(Object.keys(prev[activeTab]).map((k) => [k, ""])),
    }));

    setErrors({});
  };

  const handleDelete = (type, index) => {
    const update = (arr) => arr.filter((_, i) => i !== index);
    if (type === "employee") setEmployees(update(employees));
    if (type === "vendor") setVendors(update(vendors));
    if (type === "others") setOthers(update(others));
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const table = history.map((item) => Object.values(item));
    const headers = history.length ? Object.keys(history[0]) : [];

    autoTable(doc, {
      head: [headers],
      body: table,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [34, 197, 94] }, // green-ish header
    });
    doc.save("account_history.pdf");
  };

  const tabData = useMemo(() => {
    const configs = {
      employee: {
        data: employees,
        fields: [
          { id: "name", label: "Name" },
          { id: "employeeId", label: "Employee ID" },
          { id: "salary", label: "Salary", type: "number", inputMode: "decimal" },
          { id: "accountNumber", label: "Account Number", maxLength: 16, inputMode: "numeric" },
          { id: "ifsc", label: "IFSC", maxLength: 11 },
        ],
      },
      vendor: {
        data: vendors,
        fields: [
          { id: "companyName", label: "Company Name" },
          { id: "vendorname", label: "Vendor Name" },
          { id: "amount", label: "Amount", type: "number", inputMode: "decimal" },
          { id: "accountNumber", label: "Account Number", maxLength: 16, inputMode: "numeric" },
          { id: "ifsc", label: "IFSC", maxLength: 11 },
        ],
      },
      others: {
        data: others,
        fields: [
          { id: "label", label: "Service Type (e.g. Plumber, Electrician)" },
          { id: "balance", label: "Payable Amount", type: "number", inputMode: "decimal" },
          { id: "accountNumber", label: "Account Number", maxLength: 16, inputMode: "numeric" },
          { id: "ifsc", label: "IFSC", maxLength: 11 },
        ],
      },
      history: {
        data: history,
        form: (
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={exportPDF}
              className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white px-5 py-2 rounded-xl shadow active:scale-[0.98]"
            >
              Export PDF
            </button>
          </div>
        ),
      },
    };

    return configs;
  }, [employees, vendors, others, history]);

  const current = tabData[activeTab];

  /* ========= Helpers for mobile card view ========= */
  const renderMobileCards = (list, type) => {
    if (!list?.length) {
      return <p className="text-gray-500 dark:text-gray-300">No data available.</p>;
    }

    return (
      <div className="space-y-3">
        {list.map((row, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 shadow-sm"
          >
            <div className="grid grid-cols-1 gap-2 text-sm">
              {Object.entries(row).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="font-medium text-gray-600 dark:text-gray-300 capitalize">
                    {k.replace(/([A-Z])/g, " $1")}
                  </span>
                  <span className="text-right break-all">{String(v || "")}</span>
                </div>
              ))}
            </div>

            {activeTab !== "history" && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700 flex justify-end">
                <button
                  onClick={() => handleDelete(type, idx)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderDesktopTable = (list) => {
    if (!list?.length) {
      return <p className="text-gray-500 dark:text-gray-300">No data available.</p>;
    }

    return (
      <div className="overflow-auto rounded-xl border border-gray-200 dark:border-zinc-700">
        <table className="w-full table-auto border-collapse text-sm text-black dark:text-white">
          <thead>
            <tr className="bg-gray-100 dark:bg-zinc-800 text-left">
              {Object.keys(list[0]).map((key) => (
                <th key={key} className="border px-4 py-2 capitalize">
                  {key}
                </th>
              ))}
              {activeTab !== "history" && <th className="border px-4 py-2">Action</th>}
            </tr>
          </thead>
          <tbody>
            {list.map((item, idx) => (
              <tr
                key={idx}
                className="hover:bg-green-50 dark:hover:bg-zinc-800 transition-colors duration-200"
              >
                {Object.values(item).map((val, i) => (
                  <td key={i} className="border px-4 py-2">
                    {String(val)}
                  </td>
                ))}
                {activeTab !== "history" && (
                  <td className="border px-4 py-2 text-center">
                    <button
                      onClick={() => handleDelete(activeTab, idx)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 bg-white/80 dark:bg-zinc-900 dark:text-white backdrop-blur-xl shadow-2xl rounded-2xl border border-gray-200 dark:border-zinc-800 max-w-6xl mx-auto transition-all">
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-black/80 dark:text-green-400">
          Account Management
        </h2>

        {/* Sticky mobile action for History export */}
        {activeTab === "history" && (
          <div className="hidden sm:block">
            <button
              onClick={exportPDF}
              className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white px-4 py-2 rounded-xl shadow"
            >
              Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Tabs — horizontally scrollable on mobile */}
      <div className="-mx-2 sm:mx-0 mb-6">
        <div className="px-2 sm:px-0 flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
          {[
            { key: "employee", label: "Employee" },
            { key: "vendor", label: "Vendor" },
            { key: "others", label: "Others" },
            { key: "history", label: "History" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 sm:px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition-all duration-300 shadow-sm ${
                activeTab === key
                  ? "bg-gradient-to-r from-green-500 to-green-700 text-white"
                  : "bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-700 dark:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Form (hidden on History tab) */}
      {activeTab !== "history" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-16 sm:mb-6">
            {current.fields.map(({ id, label, type, maxLength, inputMode }) => (
              <FloatingInput
                key={id}
                id={id}
                label={label}
                type={type || "text"}
                inputMode={inputMode}
                value={formData[activeTab][id]}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [activeTab]: {
                      ...prev[activeTab],
                      [id]:
                        id === "accountNumber"
                          ? e.target.value.replace(/\D/g, "").slice(0, maxLength || 16)
                          : id === "ifsc"
                          ? e.target.value.toUpperCase().slice(0, maxLength || 11)
                          : e.target.value,
                    },
                  }))
                }
                error={errors[id]}
                maxLength={maxLength}
              />
            ))}
          </div>

          {/* Sticky bottom action on mobile, inline on desktop */}
          <div className="sm:hidden fixed left-0 right-0 bottom-3 z-20 px-4">
            <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-xl rounded-2xl p-3">
              <button
                onClick={handleAdd}
                className="w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white py-3 rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                Add {activeTab === "others" ? "Other" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </button>
            </div>
          </div>

          <div className="hidden sm:block mb-6">
            <button
              onClick={handleAdd}
              className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white py-2.5 px-6 rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              Add {activeTab === "others" ? "Other" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </button>
          </div>
        </>
      ) : (
        <div className="mb-4 sm:mb-6">{tabData.history.form}</div>
      )}

      {/* Records */}
      <div className="mt-3">
        <h3 className="text-base sm:text-lg font-semibold mb-2">Records:</h3>

        {/* Mobile: card list | Desktop: table */}
        <div className="sm:hidden">
          {renderMobileCards(current.data, activeTab)}
        </div>
        <div className="hidden sm:block">
          {renderDesktopTable(current.data)}
        </div>
      </div>
    </div>
  );
};

export default AdminAccountManager;
