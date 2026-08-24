import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

const getUserFromToken = (jwtToken) => {
  if (!jwtToken) return null;
  try {
    const decoded = jwtDecode(jwtToken);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      console.warn("JWT Token expired, purging from localStorage.");
      localStorage.removeItem("token");
      return null;
    }
    return {
      id: decoded.user_id || decoded.sub || decoded.id,
      name: decoded.name || decoded.username || (decoded.email ? decoded.email.split("@")[0] : "User"),
      email: decoded.email || "",
      role: decoded.role || "user",
    };
  } catch (err) {
    console.error("Invalid JWT Token:", err);
    localStorage.removeItem("token");
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => getUserFromToken(localStorage.getItem("token")));

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    setUser(getUserFromToken(storedToken));
  }, []);

  const login = (jwtToken) => {
    localStorage.setItem("token", jwtToken);
    setToken(jwtToken);
    setUser(getUserFromToken(jwtToken));
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);