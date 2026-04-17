import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  username: string;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const VALID_USERS: Record<string, string> = {
  "admin": "trader2024",
  "trader": "smart123",
};

const AUTH_KEY = "trading_auth_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const session = localStorage.getItem(AUTH_KEY);
    if (session) {
      try {
        const { user, exp } = JSON.parse(session);
        if (exp > Date.now()) {
          setIsAuthenticated(true);
          setUsername(user);
        } else {
          localStorage.removeItem(AUTH_KEY);
        }
      } catch {
        localStorage.removeItem(AUTH_KEY);
      }
    }
  }, []);

  const login = (u: string, p: string): boolean => {
    const expected = VALID_USERS[u.toLowerCase()];
    if (expected && expected === p) {
      const session = { user: u, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      setIsAuthenticated(true);
      setUsername(u);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setUsername("");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
