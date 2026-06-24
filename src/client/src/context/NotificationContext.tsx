import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

interface NotificationContextType {
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5155/hubs/notifications', {
        withCredentials: true 
      })
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => {
        console.log('[SignalR] Conectado con éxito al Hub de Notificaciones');
        setIsConnected(true);

        // 🔥 ESCUCHAR EL EVENTO DEL SERVIDOR
        connection.on('ReceiveReminderAlert', (data: { noteId: number; message: string; timestamp: string }) => {
          console.log('[SignalR] ¡Alerta de recordatorio recibida en tiempo real!', data);
          
          alert(`🚨 RECORDATORIO (Nota ${data.noteId}): ${data.message}`);
        });
      })
      .catch((err) => {
        console.error('[SignalR] Error al conectar con el servidor:', err);
      });

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