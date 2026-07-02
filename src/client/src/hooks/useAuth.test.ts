import { renderHook } from '@testing-library/react';
import { useAuth } from './useAuth';
import { AuthProvider } from '../context/AuthContext';
import { describe, it, expect, vi } from 'vitest';

describe('useAuth hook', () => {
  it('debe lanzar error si se usa fuera del provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow('useAuth debe ser utilizado dentro de un AuthProvider');
    consoleSpy.mockRestore();
  });

  it('debe retornar los valores del provider', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(result.current.language).toBe('en');
  });
});