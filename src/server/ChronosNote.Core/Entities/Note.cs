namespace ChronosNote.Core.Entities;

public class Note
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    
    // This will store the rich-text JSON structure from TipTap/Notion editor
    public string ContentJson { get; set; } = "{}";
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Constructor to clean up initialization and enforce baseline dates
    public Note()
    {
        Id = Guid.NewGuid();
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}