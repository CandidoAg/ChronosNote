namespace ChronosNote.Api.Dtos;

   public class UpdateNoteDto
   {
       public string Title { get; set; } = string.Empty;
       public string ContentJson { get; set; } = "{}";
   }