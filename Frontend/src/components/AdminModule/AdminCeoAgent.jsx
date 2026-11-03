import { useEffect, useState } from "react";
import { FaRobot, FaExternalLinkAlt } from "react-icons/fa";
import useOpenCeoAgent from "../../hooks/useOpenCeoAgent";
import {
  createCeoAgentApiKey,
  getCeoAgentApiKeyStatus,
  getCeoAgentResults,
} from "../../services/crm.service";

const steps = [
  "Click Open CEO Agent below.",
  "The CEO Agent opens in a new tab and signs you in automatically.",
  "Create and run your marketing from there. Come back here any time.",
];

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

const AdminCeoAgent = ({ embedded = false }) => {
  const { open, opening, error } = useOpenCeoAgent();

  const [keyStatus, setKeyStatus] = useState(null);
  const [newKey, setNewKey] = useState("");
  const [keyBusy, setKeyBusy] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [copied, setCopied] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    getCeoAgentApiKeyStatus().then(setKeyStatus).catch(() => {});
    getCeoAgentResults().then(setResults).catch(() => {});
  }, []);

  const handleCreateKey = async () => {
    if (
      keyStatus?.hasKey &&
      !window.confirm("This replaces your current key. The CEO Agent will stop working until you give it the new key. Continue?")
    ) {
      return;
    }
    try {
      setKeyBusy(true);
      setKeyError("");
      setCopied(false);
      setNewKey(await createCeoAgentApiKey());
      setKeyStatus({ hasKey: true, createdAt: new Date().toISOString() });
    } catch (err) {
      setKeyError(err.response?.data?.message || "Could not create the key");
    } finally {
      setKeyBusy(false);
    }
  };

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
    } catch {
      setKeyError("Could not copy. Select the key and copy it by hand.");
    }
  };

  return (
    <div className={embedded ? "" : "min-h-screen bg-gray-50 p-3 dark:bg-gray-900 sm:p-6"}>
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-xl text-green-700 dark:bg-green-900/40 dark:text-green-300">
              <FaRobot />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                CEO Agent
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Your AI marketing assistant. It automates your marketing so you
                can reach more customers with less work.
              </p>
            </div>
          </div>

          <ol className="mt-6 space-y-3">
            {steps.map((text, index) => (
              <li key={text} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-200">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span className="pt-0.5">{text}</span>
              </li>
            ))}
          </ol>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={open}
            disabled={opening}
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {opening ? "Opening..." : "Open CEO Agent"}
            {!opening && <FaExternalLinkAlt className="text-xs" />}
          </button>

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            You are signed in with your admin account. The sign-in link works
            once and expires within a minute.
          </p>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700 sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Data access key</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Give this key to the CEO Agent so it can read your customers,
            sales and menu. It only sees your own restaurants.
          </p>

          <p className="mt-3 text-sm text-gray-700 dark:text-gray-200">
            {keyStatus?.hasKey
              ? `A key is active (created ${formatDate(keyStatus.createdAt)}).`
              : "No key created yet."}
          </p>

          {newKey && (
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-900/20">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                Copy this key now. It will not be shown again.
              </p>
              <p className="mt-2 break-all rounded bg-white px-2 py-1.5 font-mono text-xs text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                {newKey}
              </p>
              <button
                type="button"
                onClick={handleCopyKey}
                className="mt-2 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900"
              >
                {copied ? "Copied" : "Copy key"}
              </button>
            </div>
          )}

          {keyError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{keyError}</p>
          )}

          <button
            type="button"
            onClick={handleCreateKey}
            disabled={keyBusy}
            className="mt-4 min-h-10 w-full rounded-lg border border-green-600 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-60 dark:text-green-400 dark:hover:bg-green-900/20 sm:w-auto"
          >
            {keyBusy ? "Creating..." : keyStatus?.hasKey ? "Create a new key" : "Create key"}
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700 sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Marketing results</h2>
          {results.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              No results yet. They appear here after the CEO Agent sends a campaign.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="py-2 pr-4">Campaign</th>
                    <th className="py-2 pr-4">Channel</th>
                    <th className="py-2 pr-4">Sent</th>
                    <th className="py-2 pr-4">Results</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800 dark:text-gray-200">
                  {results.map((item) => (
                    <tr key={item.id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="py-2 pr-4 font-medium">{item.campaignId}</td>
                      <td className="py-2 pr-4 capitalize">{item.channel}</td>
                      <td className="py-2 pr-4">{formatDate(item.sentAt || item.updatedAt)}</td>
                      <td className="py-2 pr-4">
                        {Object.entries(item.metrics).map(([name, value]) => `${name}: ${value}`).join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCeoAgent;
