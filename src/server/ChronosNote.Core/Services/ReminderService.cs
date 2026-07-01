using System;
using System.Threading.Tasks;
using ChronosNote.Core.Interfaces;

namespace ChronosNote.Core.Services
{
    public class ReminderService : IReminderService
    {
        private readonly IBackgroundJobQueue _jobQueue;
        private readonly IReminderParser _parser;
        private readonly INotificationService _notificationService; 

        public ReminderService(
            IBackgroundJobQueue jobQueue, 
            IReminderParser parser,
            INotificationService notificationService)
        {
            _jobQueue = jobQueue;
            _parser = parser;
            _notificationService = notificationService;
        }

        public void CreateReminder(int noteId, string reminderText, string timeExpression)
        {
            if (!_parser.IsReminderCommand(reminderText)) return;

            var (cleanMessage, executionTime) = _parser.Parse(reminderText);

            Console.WriteLine($"[Core] Comando detectado. Mensaje limpio: '{cleanMessage}'. Programado para: {executionTime}");

            _jobQueue.Schedule(() => DispatchReminderAsync(noteId, cleanMessage), executionTime);
        }

        public async Task DispatchReminderAsync(int noteId, string reminderText)
        {
            Console.WriteLine($"[Worker] ¡ALERTA DE RECORDATORIO DISPARADA! Nota: {noteId} - Mensaje: {reminderText}");
            
            await _notificationService.SendReminderAlertAsync(noteId, reminderText);
        }
    }
}