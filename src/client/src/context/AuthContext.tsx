import React, { createContext, useState, useEffect } from 'react';

export interface UserPreferences {
  avatarColor?: string;
  avatarUrl?: string;
  theme?: string;
  language?: string;
}

interface AuthContextType {
  token: string | null;
  username: string | null;
  email: string | null;
  avatarColor: string;
  avatarUrl: string;
  language: string;
  darkMode: boolean;
  login: (token: string, email: string, username: string, preferences?: UserPreferences) => void;
  logout: () => void;
  updatePreferences: (color: string, url: string, lang: string, dark: boolean) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('chronos_token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('chronos_username'));
  const [email, setEmail] = useState<string | null>(localStorage.getItem('chronos_email'));
  const [avatarColor, setAvatarColor] = useState<string>(localStorage.getItem('chronos_avatar') || 'bg-purple-600');
  const [avatarUrl, setAvatarUrl] = useState<string>(localStorage.getItem('chronos_avatar_url') || '');
  const [language, setLanguage] = useState<string>(localStorage.getItem('chronos_lang') || 'en');
  const [darkMode, setDarkMode] = useState<boolean>(localStorage.getItem('chronos_dark') === 'true');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const login = (token: string, email: string, username: string, preferences?: UserPreferences) => {
    localStorage.setItem('chronos_token', token);
    localStorage.setItem('chronos_email', email);
    localStorage.setItem('chronos_username', username);
    setToken(token);
    setEmail(email);
    setUsername(username);

    if (preferences) {
      const { avatarColor, avatarUrl, theme, language } = preferences;
      const isDark = theme === 'dark';

      localStorage.setItem('chronos_avatar', avatarColor || 'bg-purple-600');
      localStorage.setItem('chronos_avatar_url', avatarUrl || '');
      localStorage.setItem('chronos_lang', language || 'en');
      localStorage.setItem('chronos_dark', String(isDark));

      setAvatarColor(avatarColor || 'bg-purple-600');
      setAvatarUrl(avatarUrl || '');
      setLanguage(language || 'en');
      setDarkMode(isDark);
    }
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUsername(null);
    setEmail(null);
    setAvatarColor('bg-purple-600');
    setAvatarUrl('');
    setLanguage('en');
    setDarkMode(false);
  };

  const updatePreferences = async (color: string, url: string, lang: string, dark: boolean) => {
    localStorage.setItem('chronos_avatar', color);
    localStorage.setItem('chronos_avatar_url', url);
    localStorage.setItem('chronos_lang', lang);
    localStorage.setItem('chronos_dark', String(dark));

    setAvatarColor(color);
    setAvatarUrl(url);
    setLanguage(lang);
    setDarkMode(dark);

    if (token) {
      try {
        await fetch('http://localhost:5155/api/auth/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            avatarColor: color,
            avatarUrl: url,
            theme: dark ? 'dark' : 'light',
            language: lang
          })
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      token, username, email, avatarColor, avatarUrl, language, darkMode, login, logout, updatePreferences
    }}>
      {children}
    </AuthContext.Provider>
  );
};