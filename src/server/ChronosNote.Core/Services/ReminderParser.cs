using System;
using System.Text.RegularExpressions;
using ChronosNote.Core.Interfaces;

namespace ChronosNote.Core.Services
{
    public class ReminderParser : IReminderParser
    {
        public bool IsReminderCommand(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return false;
            return text.Trim().StartsWith("/remind ", StringComparison.OrdinalIgnoreCase);
        }

        public (string Message, DateTimeOffset TargetDate) Parse(string text)
        {
            if (!IsReminderCommand(text))
                throw new ArgumentException("El texto no es un comando /remind válido.");

            var cleanInput = text["/remind ".Length..].Trim();

            var relativeRegex = new Regex(@"(.*)\s+in\s+(\d+)\s+(second|minute|hour|day)s?", RegexOptions.IgnoreCase);
            var match = relativeRegex.Match(cleanInput);

            if (match.Success)
            {
                string message = match.Groups[1].Value.Trim();
                int value = int.Parse(match.Groups[2].Value);
                string unit = match.Groups[3].Value.ToLower();

                DateTimeOffset targetDate = DateTimeOffset.Now;

                targetDate = unit switch
                {
                    "second" => targetDate.AddSeconds(value),
                    "minute" => targetDate.AddMinutes(value),
                    "hour" => targetDate.AddHours(value),
                    "day" => targetDate.AddDays(value),
                    _ => targetDate
                };

                return (message, targetDate);
            }

            return (cleanInput, DateTimeOffset.Now.AddHours(1));
        }
    }
}