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

public class NotesControllerTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly NotesController _controller;
    private readonly Guid _testUserId;

    public NotesControllerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new AppDbContext(options);
        _controller = new NotesController(_context);
        _testUserId = Guid.NewGuid();

        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, _testUserId.ToString()) };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    [Fact]
    public async Task CreateNote_Should_Save_Note_Associated_To_User()
    {
        var dto = new CreateNoteDto { Title = "My Travel Note", ContentJson = "{}" };

        var result = await _controller.CreateNote(dto);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedNote = okResult.Value.Should().BeOfType<Note>().Subject;
        returnedNote.UserId.Should().Be(_testUserId);
        returnedNote.Title.Should().Be("My Travel Note");
    }

    [Fact]
    public async Task GetAllNotes_Should_Only_Return_User_Notes()
    {
        var myNote = new Note { Id = Guid.NewGuid(), Title = "Mine", UserId = _testUserId };
        var otherNote = new Note { Id = Guid.NewGuid(), Title = "Other", UserId = Guid.NewGuid() };
        _context.Notes.AddRange(myNote, otherNote);
        await _context.SaveChangesAsync();

        var result = await _controller.GetAllNotes();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var list = okResult.Value.Should().BeAssignableTo<System.Collections.Generic.IEnumerable<Note>>().Subject;
        list.Should().ContainSingle().Which.Id.Should().Be(myNote.Id);
    }

    [Fact]
    public async Task GetNoteById_Should_Return_NotFound_If_Note_Belongs_To_Another_User()
    {
        var otherNote = new Note { Id = Guid.NewGuid(), Title = "Top Secret", UserId = Guid.NewGuid() };
        _context.Notes.Add(otherNote);
        await _context.SaveChangesAsync();

        var result = await _controller.GetNoteById(otherNote.Id);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task UpdateNote_Should_Modify_Note_When_Owner_Requests_It()
    {
        var myNote = new Note { Id = Guid.NewGuid(), Title = "Draft", ContentJson = "{}", UserId = _testUserId };
        _context.Notes.Add(myNote);
        await _context.SaveChangesAsync();

        var dto = new UpdateNoteDto { Title = "Published", ContentJson = "{\"v\":1}" };

        var result = await _controller.UpdateNote(myNote.Id, dto);

        result.Should().BeOfType<OkObjectResult>();
        var updated = await _context.Notes.FindAsync(myNote.Id);
        updated!.Title.Should().Be("Published");
    }

    [Fact]
    public async Task DeleteNote_Should_Remove_Note_From_Database()
    {
        var myNote = new Note { Id = Guid.NewGuid(), Title = "To Delete", UserId = _testUserId };
        _context.Notes.Add(myNote);
        await _context.SaveChangesAsync();

        var result = await _controller.DeleteNote(myNote.Id);

        result.Should().BeOfType<NoContentResult>();
        _context.Notes.Should().NotContain(n => n.Id == myNote.Id);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task CreateNote_Should_Return_BadRequest_When_Payload_Is_Null()
    {
        var result = await _controller.CreateNote(null!);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task CreateNote_Should_Fallback_To_Untitled_When_Title_Is_Empty()
    {
        var dto = new CreateNoteDto { Title = "", ContentJson = "{}" };

        var result = await _controller.CreateNote(dto);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedNote = okResult.Value.Should().BeOfType<Note>().Subject;
        returnedNote.Title.Should().Be("Untitled");
    }

    [Fact]
    public async Task UpdateNote_Should_Return_BadRequest_When_Payload_Is_Null()
    {
        var result = await _controller.UpdateNote(Guid.NewGuid(), null!);
        result.Should().BeOfType<BadRequestObjectResult>();
    }
}