using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using ChronosNote.Api.Dtos;
using ChronosNote.Core.Entities;
using ChronosNote.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace ChronosNote.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        public record UpdatePreferencesDto(string AvatarColor, string AvatarUrl, string Theme, string Language);

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest(new { message = "All fields (Username, Email, Password) are required." });

            if (await _context.Users.AnyAsync(u => u.Email == dto.Email.ToLower()))
                return BadRequest(new { message = "A user with this email already exists." });

            var user = new User
            {
                Username = dto.Username.Trim(), 
                Email = dto.Email.ToLower(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);
            
            return Ok(new {
                token,
                email = user.Email,
                username = user.Username,
                preferences = new {
                    avatarColor = user.AvatarColor,
                    avatarUrl = user.AvatarUrl,
                    theme = user.Theme,
                    language = user.Language
                }
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower());

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return Unauthorized(new { message = "Invalid email or password." });

            var token = GenerateJwtToken(user);
            
            return Ok(new {
                token,
                email = user.Email,
                username = user.Username,
                preferences = new {
                    avatarColor = user.AvatarColor,
                    avatarUrl = user.AvatarUrl,
                    theme = user.Theme,
                    language = user.Language
                }
            });
        }

        [Authorize]
        [HttpPut("preferences")]
        public async Task<IActionResult> UpdatePreferences([FromBody] UpdatePreferencesDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "User account not found." });

            // 🔑 Updates security attributes cleanly
            user.AvatarColor = string.IsNullOrWhiteSpace(dto.AvatarColor) ? user.AvatarColor : dto.AvatarColor;
            user.AvatarUrl = dto.AvatarUrl ?? string.Empty; // Safely save custom URL image links
            user.Theme = dto.Theme == "dark" ? "dark" : "light";
            user.Language = (dto.Language == "es" || dto.Language == "fr") ? dto.Language : "en";

            await _context.SaveChangesAsync();
            return Ok(new { message = "Preferences synchronized successfully." });
        }

        private string GenerateJwtToken(User user)
        {
            var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET");
            var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER");
            var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE");

            if (string.IsNullOrEmpty(secretKey))
                throw new InvalidOperationException("JWT_SECRET environment variable is not set.");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}