import React, { createContext, useContext, useState, useEffect } from 'react';

// 🔑 1. Definimos el tipo del contexto incluyendo la nueva propiedad avatarUrl
interface AuthContextType {
  token: string | null;
  username: string | null;
  email: string | null;
  avatarColor: string;
  avatarUrl: string; // <-- Nueva propiedad agregada de forma explícita
  language: string;
  darkMode: boolean;
  login: (token: string, email: string, username: string, preferences?: any) => void;
  logout: () => void;
  updatePreferences: (color: string, url: string, lang: string, dark: boolean) => Promise<void>; // <-- Ahora acepta 4 argumentos
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('chronos_token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('chronos_username'));
  const [email, setEmail] = useState<string | null>(localStorage.getItem('chronos_email'));
  
  // Estados de preferencias con valores seguros por defecto
  const [avatarColor, setAvatarColor] = useState<string>(localStorage.getItem('chronos_avatar') || 'bg-purple-600');
  const [avatarUrl, setAvatarUrl] = useState<string>(localStorage.getItem('chronos_avatar_url') || '');
  const [language, setLanguage] = useState<string>(localStorage.getItem('chronos_lang') || 'en');
  const [darkMode, setDarkMode] = useState<boolean>(localStorage.getItem('chronos_dark') === 'true');

  // Efecto para sincronizar la clase 'dark' en el documento HTML de Tailwind
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Al hacer login guardamos token, datos básicos y sus preferencias si vienen del servidor
  const login = (token: string, email: string, username: string, preferences?: any) => {
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

  // 🔑 2. Función optimizada con los 4 parámetros sincronizados con tu backend en .NET
  const updatePreferences = async (color: string, url: string, lang: string, dark: boolean) => {
    // Sincronización instantánea local en UI
    localStorage.setItem('chronos_avatar', color);
    localStorage.setItem('chronos_avatar_url', url);
    localStorage.setItem('chronos_lang', lang);
    localStorage.setItem('chronos_dark', String(dark));
    
    setAvatarColor(color);
    setAvatarUrl(url);
    setLanguage(lang);
    setDarkMode(dark);

    // Sincronización en caliente con la base de datos remota SQLite
    if (token) {
      try {
        await fetch('http://localhost:5155/api/auth/preferences', { // Asegúrate de que este puerto coincida con tu backend
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
        console.error("No se pudieron sincronizar los ajustes con el servidor local:", err);
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  return context;
};