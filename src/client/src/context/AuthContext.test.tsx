import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthProvider } from './AuthContext';
import { useAuth } from '../hooks/useAuth';

const fetchMock = vi.fn();

describe('AuthContext & Provider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('debe inicializar con valores de localStorage', () => {
    localStorage.setItem('chronos_token', 'test-token');
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(result.current.token).toBe('test-token');
  });

  it('debe actualizar el estado al hacer login', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    act(() => {
      result.current.login('new-token', 'user@test.com', 'testuser');
    });
    expect(result.current.token).toBe('new-token');
  });

  it('debe llamar al backend al actualizar preferencias', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    act(() => {
      result.current.login('valid-token', 'e', 'u');
    });

    await act(async () => {
      await result.current.updatePreferences('blue', 'url', 'es', true);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5155/api/auth/preferences',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Authorization': 'Bearer valid-token'
        })
      })
    );
  });
});