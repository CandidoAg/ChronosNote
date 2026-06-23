using System;
using System.Collections.Generic;

namespace ChronosNote.Core.Entities
{
    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public string Username { get; set; } = string.Empty;
        
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string AvatarColor { get; set; } = "bg-purple-600";
        public string AvatarUrl { get; set; } = string.Empty;
        public string Theme { get; set; } = "light";
        public string Language { get; set; } = "en";

        // Relación: Un usuario tiene muchas notas
        public ICollection<Note> Notes { get; set; } = new List<Note>();
    }
}