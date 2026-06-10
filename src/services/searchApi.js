import api from "./api";

export const searchUsers = async (query) => {
  try {
    const response = await api.get(
      `/User/users?query=${encodeURIComponent(query)}`
    );

    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;
    if (Array.isArray(response.data?.Data)) return response.data.Data;

    return [];
  } catch (error) {
    console.error("Search users error:", error);
    throw error;
  }
};

export const searchJobs = async (query, page = 1, pageSize = 6) => {
  try {
    const response = await api.get(
      `/JobPost?page=${page}&pageSize=${pageSize}&query=${encodeURIComponent(
        query
      )}`
    );

    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;
    if (Array.isArray(response.data?.Data)) return response.data.Data;

    return [];
  } catch (error) {
    console.error("Search jobs error:", error);
    throw error;
  }
};