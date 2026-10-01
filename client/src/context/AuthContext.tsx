import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: { email?: string; usn?: string; password: string }) => Promise<void>;
  logout: () => void;
  quickLogin: (email: string) => Promise<void>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  demoModalOpen: boolean;
  setDemoModalOpen: (open: boolean) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('labguard_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [demoModalOpen, setDemoModalOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          logout();
        }
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (credentials: { email?: string; usn?: string; password: string }) => {
    const res = await api.login(credentials);
    if (res.success && res.token) {
      localStorage.setItem('labguard_token', res.token);
      setToken(res.token);
      setUser(res.user);
      if (res.user.role === 'STUDENT') {
        setActiveTab('student-dashboard');
      } else if (res.user.role === 'FACULTY') {
        setActiveTab('teacher-attendance');
      } else {
        setActiveTab('dashboard');
      }
    }
  };

  const quickLogin = async (identifierOrEmail: string) => {
    let password = 'Faculty@123';
    if (identifierOrEmail.startsWith('3GN')) {
      password = 'Student@123';
      await login({ usn: identifierOrEmail, password });
    } else {
      await login({ email: identifierOrEmail, password });
    }
  };

  const logout = () => {
    localStorage.removeItem('labguard_token');
    setToken(null);
    setUser(null);
    setActiveTab('login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        quickLogin,
        activeTab,
        setActiveTab,
        demoModalOpen,
        setDemoModalOpen,
        refreshTrigger,
        triggerRefresh,
        mobileMenuOpen,
        setMobileMenuOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
