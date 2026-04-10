import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Role = 'USER' | 'STAFF' | 'ADMIN' | null;

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  avatar?: string;
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  reloadProfile: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/profile');
      if (res.ok) {
        const data = await res.json();
        const loggedUser: User = {
          id: data.id,
          username: data.username,
          name: data.fullName || data.username,
          fullName: data.fullName,
          email: data.email,
          role: data.role as Role,
          avatar: data.avatarUrl,
        };
        setUser(loggedUser);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        return loggedUser;
      } else if (res.status === 401) {
        // Expected for guests, no need to log
        setUser(null);
        localStorage.removeItem('user');
        return null;
      } else {
        setUser(null);
        localStorage.removeItem('user');
        return null;
      }
    } catch (e) {
      // Network errors only
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Sai tài khoản hoặc mật khẩu!');
    }

    const profile = await fetchProfile();
    if (!profile) throw new Error('Không thể tải hồ sơ người dùng');
    return profile;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error', e);
    }
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading, reloadProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

