using System.Threading.Tasks;

namespace ChronosNote.Core.Interfaces
{
    public interface INotificationService
    {
        Task SendReminderAlertAsync(int noteId, string message);
    }
}