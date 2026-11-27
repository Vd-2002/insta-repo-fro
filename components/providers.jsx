'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiFetch, getStoredToken, setStoredToken } from '@/lib/api';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const AuthContext = createContext(null);
const ToastContext = createContext(null);

export function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 20 * 1000,
            retry: 1,
          },
        },
      })
  );

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const me = await apiFetch('/auth/me');
      setUser(me);
      return me;
    } catch {
      setStoredToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const initAuth = async () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const oauthToken = params.get('token');
        if (oauthToken) {
          setStoredToken(oauthToken);
          params.delete('token');
          const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
          window.history.replaceState({}, '', cleanUrl);
        }
      }
      const token = getStoredToken();
      if (!token) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      try {
        const me = await apiFetch('/auth/me');
        if (active) setUser(me);
      } catch {
        setStoredToken(null);
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    initAuth();
    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setStoredToken(null);
    setUser(null);
    queryClient.clear();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
        <ToastContext.Provider value={{ toast }}>
          {children}
          <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium bg-white ${
                  t.type === 'error'
                    ? 'border-rose-200 text-rose-800'
                    : 'border-emerald-200 text-slate-800'
                }`}
              >
                {t.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <span className="flex-1">{t.message}</span>
                <button
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </ToastContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useToast() {
  return useContext(ToastContext);
}

