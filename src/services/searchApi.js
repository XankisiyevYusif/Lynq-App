import api from "./api";

export const searchUsers = async (query) => {
  try {
    const normalizedQuery = query.trim().replace(/^@+/, "");
    const response = await api.get(
      `/User/users?query=${encodeURIComponent(normalizedQuery)}`,
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

export const searchPosts = async (query, page = 1, pageSize = 6) => {
  try {
    const response = await api.get("/Post/search", {
      params: { query, page, pageSize },
    });

    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;
    if (Array.isArray(response.data?.Data)) return response.data.Data;
    return [];
  } catch (error) {
    console.error("Search posts error:", error);
    throw error;
  }
};

export const searchHashtags = async (query, take = 6) => {
  try {
    const normalizedQuery = query.trim().replace(/^#+/, "");
    const response = await api.get("/Post/hashtags", {
      params: { query: normalizedQuery, take },
    });

    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;
    if (Array.isArray(response.data?.Data)) return response.data.Data;
    return [];
  } catch (error) {
    console.error("Search hashtags error:", error);
    return [];
  }
};

export const searchJobs = async (query, page = 1, pageSize = 6) => {
  try {
    const response = await api.get(
      `/JobPost?page=${page}&pageSize=${pageSize}&query=${encodeURIComponent(
        query,
      )}`,
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

export const searchEvents = async (
  query = "",
  page = 1,
  pageSize = 6,
  recommended = true,
) => {
  try {
    const response = await api.get("/SearchDirectory/events", {
      params: { query, page, pageSize, recommended },
    });
    const payload = response.data?.data || response.data?.Data || response.data;

    if (Array.isArray(payload)) {
      return {
        items: payload,
        page,
        pageSize,
        totalCount: payload.length,
        totalPages: 1,
        hasMore: false,
      };
    }

    return {
      items: payload?.items || payload?.Items || [],
      page: payload?.page || payload?.Page || page,
      pageSize: payload?.pageSize || payload?.PageSize || pageSize,
      totalCount: payload?.totalCount || payload?.TotalCount || 0,
      totalPages: payload?.totalPages || payload?.TotalPages || 1,
      hasMore: payload?.hasMore ?? payload?.HasMore ?? false,
    };
  } catch (error) {
    console.error("Search events error:", error);
    throw error;
  }
};

const unwrapPaged = (response, page, pageSize) => {
  const payload = response?.data?.data ?? response?.data?.Data ?? response?.data ?? {};
  if (Array.isArray(payload)) {
    return { items: payload, page, pageSize, totalCount: payload.length, totalPages: 1, hasMore: false };
  }
  return {
    items: payload.items || payload.Items || [],
    page: payload.page || payload.Page || page,
    pageSize: payload.pageSize || payload.PageSize || pageSize,
    totalCount: payload.totalCount || payload.TotalCount || 0,
    totalPages: payload.totalPages || payload.TotalPages || 1,
    hasMore: payload.hasMore ?? payload.HasMore ?? false,
  };
};

export const searchDirectoryPeople = async (query = "", page = 1, pageSize = 6) => {
  const response = await api.get("/SearchDirectory/people", { params: { query, page, pageSize } });
  return unwrapPaged(response, page, pageSize);
};

export const searchCompanies = async (query = "", page = 1, pageSize = 6) => {
  const response = await api.get("/SearchDirectory/companies", { params: { query, page, pageSize } });
  return unwrapPaged(response, page, pageSize);
};

export const searchDirectoryJobs = async (query = "", page = 1, pageSize = 6) => {
  const response = await api.get("/SearchDirectory/jobs", { params: { query, page, pageSize } });
  return unwrapPaged(response, page, pageSize);
};

export const getRelevantHashtags = async (query = "", take = 5) => {
  const response = await api.get("/SearchDirectory/hashtags", { params: { query, take } });
  const payload = response?.data?.data ?? response?.data?.Data ?? response?.data;
  return Array.isArray(payload) ? payload : [];
};

export const getSearchHistory = async () => {
  try {
    const response = await api.get("/User/search-history");
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;
    if (Array.isArray(response.data?.Data)) return response.data.Data;
    return [];
  } catch (error) {
    console.error("Get search history error:", error);
    throw error;
  }
};

export const hideSearchHistoryItem = async (historyId) => {
  await api.delete(`/User/search-history/${historyId}`);
};

export const clearVisibleSearchHistory = async () => {
  await api.delete("/User/search-history");
};

export const getRecommendedUsers = async (pageNumber = 1, pageSize = 10) => {
  try {
    const response = await api.get("/User/recommended", {
      params: {
        pageNumber,
        pageSize,
      },
    });

    const result = response.data;

    if (Array.isArray(result?.data?.items)) {
      return result.data.items;
    }

    // Ehtiyat variantlar
    if (Array.isArray(result?.data?.Items)) {
      return result.data.Items;
    }

    if (Array.isArray(result?.items)) {
      return result.items;
    }

    if (Array.isArray(result?.Items)) {
      return result.Items;
    }

    if (Array.isArray(result)) {
      return result;
    }

    return [];
  } catch (error) {
    console.error("Get recommended users error:", error);
    throw error;
  }
};
