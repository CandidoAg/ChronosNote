import { render } from '@testing-library/react';
import { act } from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NotificationProvider, useNotifications } from './NotificationContext';
import * as Utils from './NotificationUtils';

vi.mock('./NotificationUtils', () => ({
  createNotificationConnection: vi.fn(),
}));

describe('NotificationContext', () => {
  const mockConnection = {
    start: vi.fn(),
    stop: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Utils.createNotificationConnection).mockReturnValue(mockConnection as any);
  });

  it('debe completar el ciclo de vida: conectar, recibir evento y desconectar', async () => {
    mockConnection.start.mockResolvedValueOnce(undefined);

    const { unmount } = render(
      <NotificationProvider><div>test</div></NotificationProvider>
    );

    // Esperar al useEffect inicial
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Cubrir el registro del evento
    const onCall = mockConnection.on.mock.calls.find(call => call[0] === 'ReceiveReminderAlert');
    expect(onCall).toBeDefined();
    
    if (onCall) {
      act(() => {
        onCall[1]({ noteId: 1, message: 'Test', timestamp: '2026' });
      });
    }

    // Cubrir el cleanup (return () => ...)
    unmount();
    expect(mockConnection.off).toHaveBeenCalledWith('ReceiveReminderAlert');
    expect(mockConnection.stop).toHaveBeenCalled();
  });

  it('debe cubrir la rama del catch en el bloque try-catch', async () => {
    // Forzamos el error
    const error = new Error('Connection Failed');
    mockConnection.start.mockRejectedValueOnce(error);
    
    // Espiar console.error para evitar ruido en consola
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      render(<NotificationProvider><div>fail</div></NotificationProvider>);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockConnection.start).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('[SignalR] Error al conectar:', error);
    
    consoleSpy.mockRestore();
  });

  it('debe lanzar un error si useNotifications se usa fuera del Provider', () => {
    // Necesitamos silenciar el error esperado en la consola para que el test no se vea "rojo"
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Al intentar usar el hook sin el componente NotificationProvider, debe fallar
    expect(() => {
      render(
        // Renderizamos algo que no es el Provider
        <div>test</div>
      );
      // Creamos un componente interno que llama al hook
      const TestComponent = () => {
        useNotifications();
        return null;
      };
      render(<TestComponent />);
    }).toThrow('useNotifications debe usarse dentro de un NotificationProvider');

    consoleSpy.mockRestore();
  });
});