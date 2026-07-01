import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';

export const AuthPage: React.FC = () => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 [AuthPage] Formulario enviado. Iniciando proceso...", { isLogin, email, username });
    
    setError('');
    setLoading(true);

    const endpoint = isLogin ? 'login' : 'register';

    const requestBody = isLogin 
      ? { email, password } 
      : { username, email, password };

    try {
      console.log(`📡 [AuthPage] Lanzando fetch a: http://localhost:5155/api/auth/${endpoint}`);
      const response = await fetch(`http://localhost:5155/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log("📦 [AuthPage] Respuesta del servidor recibida. Status:", response.status);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      const userToken = data.token || data.Token;
      const userEmail = data.email || data.Email;
      const userUsername = data.username || data.Username;
      const userPreferences = data.preferences || data.Preferences;

      console.log("🔑 [AuthPage] Login exitoso en backend. Pasando datos al AuthContext...");
      login(userToken, userEmail, userUsername, userPreferences);
      
    } catch (err: any) {
      console.error("❌ [AuthPage] Error cazado en el bloque try-catch:", err);
      setError(err.message || 'Connection refused by backend server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#fbfbfa]">
      <div className="w-full max-w-md p-8 bg-white rounded-xl border border-gray-200 shadow-sm">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-8">
          <Logo className="w-16 h-16 mb-3 rounded-2xl" />
          <h1 className="text-2xl font-bold text-gray-800">ChronosNote</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isLogin ? 'Welcome back to your second brain' : 'Create your private workspace'}
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* 🔑 noValidate en el formulario desactiva bloqueos raros del navegador */}
          
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="johndoe"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="name@domain.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
          >
            {loading ? 'Processing...' : isLogin ? 'Continue' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button" 
            onClick={() => {
              setIsLogin(!isLogin);
              setUsername(''); 
              setEmail('');
              setPassword('');
              setError('');
            }}
            className="text-xs font-medium text-purple-600 hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
    </div>
  );
};