"use client";

import type { AuthToken, User } from "@luxiwood/shared";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const TOKEN_KEY = "luxiwood-token";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  // false, пока не проверили сохранённый токен — шапка в это время не мигает кнопкой «Войти»
  ready: boolean;
  signIn: (data: AuthToken) => void;
  // После правки профиля: токен тот же, меняются только данные
  updateUser: (user: User) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      setReady(true);
      return;
    }
    api<User>("/auth/me", { token: saved })
      .then((me) => {
        setToken(saved);
        setUser(me);
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setReady(true));
  }, []);

  function signIn(data: AuthToken) {
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, token, ready, signIn, updateUser: setUser, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth работает только внутри AuthProvider");
  }
  return context;
}
