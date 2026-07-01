using Xunit;
using FluentAssertions;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ChronosNote.Api.Dtos;
using ChronosNote.Core.Entities;
using ChronosNote.Infrastructure.Persistence;

namespace ChronosNote.Api.Controllers;

public class AuthControllerTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new AppDbContext(options);
        _controller = new AuthController(_context);

        Environment.SetEnvironmentVariable("JWT_SECRET", "super_secret_key_chronos_note_long_enough_12345");
        Environment.SetEnvironmentVariable("JWT_ISSUER", "ChronosNote");
        Environment.SetEnvironmentVariable("JWT_AUDIENCE", "ChronosUsers");
    }

    private void SetupControllerUser(Guid userId)
    {
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    [Fact]
    public async Task Register_Should_Create_User_And_Return_Token()
    {
        var dto = new RegisterDto("candi", "candi@test.com", "Password123!");

        var result = await _controller.Register(dto);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        _context.Users.Should().ContainSingle(u => u.Email == "candi@test.com");
    }

    [Fact]
    public async Task Register_Should_Return_BadRequest_If_Email_Already_Exists()
    {
        var existingUser = new User { Username = "old", Email = "duplicate@test.com", PasswordHash = "hash" };
        _context.Users.Add(existingUser);
        await _context.SaveChangesAsync();

        var dto = new RegisterDto("new", "duplicate@test.com", "Password123!");

        var result = await _controller.Register(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Login_Should_Return_Token_When_Credentials_Are_Valid()
    {
        string password = "SecretPassword";
        var user = new User 
        { 
            Username = "loginUser", 
            Email = "login@test.com", 
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password) 
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var dto = new LoginDto("login@test.com", password);

        var result = await _controller.Login(dto);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Login_Should_Return_Unauthorized_When_Password_Is_Wrong()
    {
        var user = new User { Username = "loginUser", Email = "login@test.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectOne") };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var dto = new LoginDto("login@test.com", "WrongOne");

        var result = await _controller.Login(dto);

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task UpdatePreferences_Should_Modify_User_Data_Correctly()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Username = "prefs", Email = "prefs@test.com", Theme = "light", Language = "en" };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        SetupControllerUser(userId);
        var dto = new AuthController.UpdatePreferencesDto("bg-red-500", "http://avatar.url", "dark", "fr");

        var result = await _controller.UpdatePreferences(dto);

        result.Should().BeOfType<OkObjectResult>();
        var updatedUser = await _context.Users.FindAsync(userId);
        updatedUser!.Theme.Should().Be("dark");
        updatedUser.Language.Should().Be("fr");
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task UpdatePreferences_Should_Fallback_To_Default_Values_When_Inputs_Are_Invalid()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Username = "prefs", Email = "prefs@test.com", Theme = "light", Language = "en" };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        SetupControllerUser(userId);
        // Mandamos un tema inventado y un idioma no soportado
        var dto = new AuthController.UpdatePreferencesDto("bg-blue-500", "http://avatar.url", "invalid-theme", "it");

        var result = await _controller.UpdatePreferences(dto);

        result.Should().BeOfType<OkObjectResult>();
        var updatedUser = await _context.Users.FindAsync(userId);
        updatedUser!.Theme.Should().Be("light"); // Cae en el fallback de "light"
        updatedUser.Language.Should().Be("en");  // Cae en el fallback de "en"
    }
}