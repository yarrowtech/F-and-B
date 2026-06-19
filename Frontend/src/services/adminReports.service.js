import API from "./api";

export const getAdminReportCatalog = async () => {
  const response = await API.get("/admin-reports/catalog");
  return Array.isArray(response.data?.data) ? response.data.data : [];
};

export const getAdminReportRestaurants = async () => {
  const response = await API.get("/admin-reports/restaurants");
  return Array.isArray(response.data?.data) ? response.data.data : [];
};

export const generateAdminReport = async (key, params = {}) => {
  const response = await API.get(`/admin-reports/${key}`, { params });
  return response.data?.data || null;
};

export const downloadAdminReport = async (key, format, params = {}) => {
  const response = await API.get(`/admin-reports/${key}/export`, {
    params: { ...params, format },
    responseType: "blob",
  });
  return response.data;
};
