import API from "./api";

export const getManagerReportCatalog = async () => {
  const response = await API.get("/manager-reports/catalog");
  return Array.isArray(response.data?.data) ? response.data.data : [];
};

export const getManagerReportRestaurant = async () => {
  const response = await API.get("/manager-reports/restaurant");
  return response.data?.data || null;
};

export const generateManagerReport = async (key, params = {}) => {
  const response = await API.get(`/manager-reports/${key}`, { params });
  return response.data?.data || null;
};

export const downloadManagerReport = async (key, format, params = {}) => {
  const response = await API.get(`/manager-reports/${key}/export`, {
    params: { ...params, format },
    responseType: "blob",
  });
  return response.data;
};
