import api from "../../../services/api"; // sənin hazır Axios instance

// GET: bütün təcrübələr
const getAllExperiences = async () => {
  try {
    const res = await api.get("/user/experience");
    return { 
      success: res.data.success, 
      experiences: res.data.experience, 
      message: res.data.message 
    };
  } catch (err) {
    return { 
      success: false, 
      message: err.response?.data?.message || "Failed to fetch experiences" 
    };
  }
};

// POST: yeni təcrübə əlavə et
const addExperience = async (dto) => {
  try {
    const res = await api.post("/user/experience", dto);
    return { 
      success: res.data.success, 
      experience: res.data.experience, 
      message: res.data.message 
    };
  } catch (err) {
    return { 
      success: false, 
      message: err.response?.data?.message || "Failed to add experience" 
    };
  }
};

// PUT: təcrübəni update et
const updateExperience = async (id, dto) => {
  try {
    const res = await api.put(`/user/experience/${id}`, dto);
    return { success: true, experience: res.data.experience };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to update experience" };
  }
};

// DELETE: təcrübəni sil
const deleteExperience = async (id) => {
  try {
    const res = await api.delete(`/user/experience/${id}`);
    return { success: true, experienceId: res.data.experienceId };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to delete experience" };
  }
};

export default {
  getAllExperiences,
  addExperience,
  updateExperience,
  deleteExperience,
};
