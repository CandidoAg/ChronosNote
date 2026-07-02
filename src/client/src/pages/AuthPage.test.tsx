import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthPage } from './AuthPage';
import { AuthProvider } from '../context/AuthContext';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('debe cambiar entre modo Login y Registro', () => {
    render(<AuthProvider><AuthPage /></AuthProvider>);
    
    expect(screen.queryByPlaceholderText(/johndoe/i)).not.toBeInTheDocument();
    
    fireEvent.click(screen.getByText(/Don't have an account\? Sign up/i));
    
    expect(screen.getByPlaceholderText(/johndoe/i)).toBeInTheDocument();
  });

  it('debe mostrar error si el servidor falla', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Credenciales inválidas' }),
    });

    render(<AuthProvider><AuthPage /></AuthProvider>);

    fireEvent.change(screen.getByPlaceholderText(/name@domain.com/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/Credenciales inválidas/i)).toBeInTheDocument();
    });
  });

  it('debe llamar a la API al hacer login exitoso', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'fake-token',
        email: 'test@test.com',
        username: 'tester',
        preferences: {}
      }),
    });

    render(<AuthProvider><AuthPage /></AuthProvider>);

    fireEvent.change(screen.getByPlaceholderText(/name@domain.com/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5155/api/auth/login',
        expect.any(Object)
      );
    });
  });
});