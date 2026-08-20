import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getProfile, loginUser, registerUser } from '../services/authService';

const AuthContext = createContext(null);
const TOKEN_KEY = 'pulse-auth-token';

function parseJwtPayload(jwtToken) {
  if (!jwtToken) return null;
  try {
    const base64Url = jwtToken.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setIsLoading(false);
  }, []);

  const hydrateProfile = useCallback(async () => {
    try {
      const response = await getProfile();
      const currentToken = localStorage.getItem(TOKEN_KEY);
      const payload = parseJwtPayload(currentToken);
      const mergedUser = {
        _id: payload?.user_id,
        role: payload?.role || 'user',
        ...(response.user || {}),
      };
      setUser(mergedUser);
      return mergedUser;
    } catch {
      logout();
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) hydrateProfile();
    else setIsLoading(false);
  }, [token, hydrateProfile]);

  useEffect(() => {
    window.addEventListener('pulse:unauthenticated', logout);
    return () => window.removeEventListener('pulse:unauthenticated', logout);
  }, [logout]);

  const login = useCallback(async (credentials) => {
    const response = await loginUser(credentials);
    localStorage.setItem(TOKEN_KEY, response.token);
    setToken(response.token);
    return response;
  }, []);

  const register = useCallback((details) => registerUser(details), []);
  const value = useMemo(() => ({ token, user, isAuthenticated: Boolean(token), isLoading, login, logout, register, refreshProfile: hydrateProfile }), [token, user, isLoading, login, logout, register, hydrateProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
