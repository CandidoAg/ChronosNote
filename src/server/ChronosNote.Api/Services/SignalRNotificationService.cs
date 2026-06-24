using System;
using System.Threading.Tasks;
using ChronosNote.Core.Interfaces;
using ChronosNote.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace ChronosNote.Api.Services
{
    public class SignalRNotificationService : INotificationService
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public SignalRNotificationService(IHubContext<NotificationHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task SendReminderAlertAsync(int noteId, string message)
        {
            await _hubContext.Clients.All.SendAsync("ReceiveReminderAlert", new 
            {
                NoteId = noteId,
                Message = message,
                Timestamp = DateTimeOffset.Now
            });
        }
    }
}