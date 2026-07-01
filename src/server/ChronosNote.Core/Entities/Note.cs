using System;

namespace ChronosNote.Core.Entities // Asegúrate de que apunte a tu namespace real
{
    public class Note
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ContentJson { get; set; } = "{\"type\":\"doc\",\"content\":[]}";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Guid UserId { get; set; }
        public User? User { get; set; }
    }
}