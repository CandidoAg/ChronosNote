import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationProvider, useNotifications } from './NotificationContext';

const mockConnection = {
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: class {
    withUrl() { return this; }
    withAutomaticReconnect() { return this; }
    build() { return mockConnection; }
  }
}));

describe('NotificationContext - Cobertura Completa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe manejar el error si la conexión falla', async () => {
    mockConnection.start.mockRejectedValueOnce(new Error('SignalR Failed'));
    
    await act(async () => {
      renderHook(() => useNotifications(), { wrapper: NotificationProvider });
    });
    
    expect(mockConnection.start).toHaveBeenCalled();
  });

  it('debe limpiar la conexión al desmontar el provider', async () => {
    const { unmount } = renderHook(() => useNotifications(), { wrapper: NotificationProvider });
    
    await act(async () => {
      unmount();
    });
    
    expect(mockConnection.off).toHaveBeenCalledWith('ReceiveReminderAlert');
    expect(mockConnection.stop).toHaveBeenCalled();
  });

  it('debe ejecutar el callback de alerta al recibir ReceiveReminderAlert', async () => {
    const mockAlert = vi.fn();
    vi.stubGlobal('alert', mockAlert);

    let capturedCallback: any;
    mockConnection.on.mockImplementation((event, cb) => {
      if (event === 'ReceiveReminderAlert') {
        capturedCallback = cb;
      }
      return mockConnection;
    });

    await act(async () => {
      renderHook(() => useNotifications(), { wrapper: NotificationProvider });
    });

    await waitFor(() => {
      expect(mockConnection.on).toHaveBeenCalledWith('ReceiveReminderAlert', expect.any(Function));
    });

    await act(async () => {
      capturedCallback({ noteId: 1, message: 'Test', timestamp: 'now' });
    });

    expect(mockAlert).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('debe lanzar un error si se usa useNotifications fuera del provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => renderHook(() => useNotifications())).toThrow(
      'useNotifications debe usarse dentro de un NotificationProvider'
    );
    
    consoleSpy.mockRestore();
  });
});