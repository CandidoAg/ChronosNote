using System;

namespace ChronosNote.Core.Interfaces
{
    public interface IReminderParser
    {
        bool IsReminderCommand(string text);

        (string Message, DateTimeOffset TargetDate) Parse(string text);
    }
}