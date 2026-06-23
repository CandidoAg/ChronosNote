namespace ChronosNote.Api.Dtos
{
    public record RegisterDto(string Username, string Email, string Password);
    public record LoginDto(string Email, string Password);
    public record AuthResponseDto(string Token, string Email, string Username, object Preferences);
}