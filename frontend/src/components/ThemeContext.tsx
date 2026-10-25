'use client';

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { UserRole } from '@/lib/types';

interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  userRole: 'Operations Controller',
  setUserRole: () => {},
});

function subscribeTheme(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('railsync-theme-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('railsync-theme-change', callback);
  };
}

function subscribeRole(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('railsync-role-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('railsync-role-change', callback);
  };
}

function getThemeSnapshot(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem('railsync_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}

function getRoleSnapshot(): UserRole {
  if (typeof window === 'undefined') return 'Operations Controller';
  try {
    const saved = localStorage.getItem('railsync_role');
    if (saved) return saved as UserRole;
    return 'Operations Controller';
  } catch {
    return 'Operations Controller';
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore<'dark' | 'light'>(
    subscribeTheme,
    getThemeSnapshot,
    (): 'dark' | 'light' => 'dark'
  );
  const userRole = useSyncExternalStore<UserRole>(
    subscribeRole,
    getRoleSnapshot,
    (): UserRole => 'Operations Controller'
  );

  // Synchronize document classes and data attributes whenever theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('railsync_theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
      window.dispatchEvent(new Event('railsync-theme-change'));
    } catch {
      // Ignore storage error
    }
  };

  const setUserRole = (role: UserRole) => {
    try {
      localStorage.setItem('railsync_role', role);
      window.dispatchEvent(new Event('railsync-role-change'));
    } catch {
      // Ignore storage error
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, userRole, setUserRole }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
