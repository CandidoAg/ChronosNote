import * as signalR from '@microsoft/signalr';

export const createNotificationConnection = () => {
  return new signalR.HubConnectionBuilder()
    .withUrl('http://localhost:5155/hubs/notifications', {
      withCredentials: true 
    })
    .withAutomaticReconnect()
    .build();
};