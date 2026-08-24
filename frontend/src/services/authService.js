import api from "./api";

// =============================
// Register User
// =============================
export const registerUser = async (userData) => {
  const response = await api.post("/register", userData);
  return response.data;
};

// =============================
// Login User
// =============================
export const loginUser = async (userData) => {
  const response = await api.post("/login", userData);
  return response.data;
};

// =============================
// Reset Password
// =============================
export const resetPassword = async (data) => {
  const response = await api.post("/reset-password", data);
  return response.data;
};