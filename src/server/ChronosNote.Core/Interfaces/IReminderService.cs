using System;
using System.Threading.Tasks;

namespace ChronosNote.Core.Interfaces
{
    public interface IReminderService
    {
        void CreateReminder(int noteId, string reminderText, string timeExpression);

        Task DispatchReminderAsync(int noteId, string reminderText);
    }
}