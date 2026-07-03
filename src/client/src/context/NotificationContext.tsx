import React, { createContext, useContext, useEffect, useState } from 'react';
import { createNotificationConnection } from './NotificationUtils';

interface NotificationContextType {
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connection = createNotificationConnection();

    const startConnection = async () => {
      try {
        await connection.start();
        console.log('[SignalR] Conectado con éxito al Hub de Notificaciones');
        setIsConnected(true);

        connection.on('ReceiveReminderAlert', (data: { noteId: number; message: string; timestamp: string }) => {
          console.log('[SignalR] ¡Alerta de recordatorio!', data);
          alert(`🚨 RECORDATORIO (Nota ${data.noteId}): ${data.message}`);
        });
      } catch (err) {
        console.error('[SignalR] Error al conectar:', err);
      }
    };

    startConnection();

    return () => {
      connection.off('ReceiveReminderAlert');
      connection.stop();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ isConnected }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de un NotificationProvider');
  }
  return context;
};