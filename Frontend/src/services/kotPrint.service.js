import api from "./api";

export const getMyKotPrintJobs = async () => {
  const res = await api.get("/kot/my-print-jobs");
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

export const markMyKotPrintJobPrinted = async (jobId) => {
  const res = await api.put(`/kot/my-print-jobs/${jobId}/printed`);
  return res.data?.data || null;
};

export const markMyKotPrintJobFailed = async (jobId, error) => {
  const res = await api.put(`/kot/my-print-jobs/${jobId}/failed`, {
    error: error?.message || String(error || "Print failed"),
  });
  return res.data?.data || null;
};
