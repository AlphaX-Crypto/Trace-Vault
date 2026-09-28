import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setAuthToken, ApiError } from '../services/api';

const TOKEN_KEY = 'tracevault_token';
const USER_KEY = 'tracevault_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize session on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
        const storedUser = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);

        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        setAuthToken(storedToken);
        setToken(storedToken);

        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (_) {}
        }

        // Verify session freshness with backend /api/auth/me
        try {
          const profile = await api.getMe();
          setUser(profile);
          const activeStorage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
          activeStorage.setItem(USER_KEY, JSON.stringify(profile));
        } catch (authErr) {
          // If 401 or invalid session, clear local state
          if (authErr instanceof ApiError && authErr.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            sessionStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(USER_KEY);
            setAuthToken(null);
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (identifier, password, remember = false) => {
    setError(null);
    try {
      const data = await api.login({ identifier, password });
      const authToken = data.token;
      const authUser = data.user;

      setAuthToken(authToken);
      setToken(authToken);
      setUser(authUser);

      const targetStorage = remember ? localStorage : sessionStorage;
      const otherStorage = remember ? sessionStorage : localStorage;

      otherStorage.removeItem(TOKEN_KEY);
      otherStorage.removeItem(USER_KEY);

      targetStorage.setItem(TOKEN_KEY, authToken);
      targetStorage.setItem(USER_KEY, JSON.stringify(authUser));

      return authUser;
    } catch (err) {
      const genericMsg = err instanceof ApiError && err.status === 401
        ? 'Invalid credentials.'
        : err.message || 'Authentication failed. Please try again.';
      setError(genericMsg);
      throw new Error(genericMsg);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (_) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      setAuthToken(null);
      setToken(null);
      setUser(null);
      setError(null);
    }
  }, []);

  const value = {
    user,
    role: user?.role || null,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    error,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
