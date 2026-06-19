namespace ChronosNote.Api.Dtos;

public class CreateNoteDto
{
    public string Title { get; set; } = string.Empty;
    public string ContentJson { get; set; } = "{}";
}