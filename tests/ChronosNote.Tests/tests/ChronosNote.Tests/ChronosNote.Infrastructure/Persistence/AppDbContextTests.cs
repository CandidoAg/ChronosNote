using Xunit;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ChronosNote.Core.Entities;
using System;
using System.Threading.Tasks;

namespace ChronosNote.Infrastructure.Persistence;

public class AppDbContextTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<AppDbContext> _contextOptions;

    public AppDbContextTests()
    {
        _connection = new SqliteConnection("Filename=:memory:");
        _connection.Open();

        _contextOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        using var context = new AppDbContext(_contextOptions);
        context.Database.EnsureCreated();
    }

    [Fact]
    public async Task Should_Insert_User_And_Note_Successfully()
    {
        using var context = new AppDbContext(_contextOptions);
        var userId = Guid.NewGuid();
        var noteId = Guid.NewGuid();

        var user = new User { Id = userId, Email = "test@chronos.com", PasswordHash = "hash123" };
        var note = new Note { Id = noteId, Title = "Test Note", ContentJson = "{}", User = user };

        context.Users.Add(user);
        context.Notes.Add(note);
        await context.SaveChangesAsync();

        using var assertContext = new AppDbContext(_contextOptions);
        var savedNote = await assertContext.Notes.Include(n => n.User).FirstOrDefaultAsync(n => n.Id == noteId);
        
        savedNote.Should().NotBeNull();
        savedNote!.Title.Should().Be("Test Note");
        savedNote.User.Should().NotBeNull();
        savedNote.User!.Email.Should().Be("test@chronos.com");
    }

    [Fact]
    public async Task Should_Throw_Exception_When_Email_Is_Not_Unique()
    {
        using var context = new AppDbContext(_contextOptions);
        var user1 = new User { Id = Guid.NewGuid(), Email = "unique@chronos.com", PasswordHash = "hash" };
        var user2 = new User { Id = Guid.NewGuid(), Email = "unique@chronos.com", PasswordHash = "hash" };

        context.Users.Add(user1);
        await context.SaveChangesAsync();

        context.Users.Add(user2);
        Func<Task> act = async () => await context.SaveChangesAsync();

        var exceptionAssertion = await act.Should().ThrowAsync<DbUpdateException>();
        exceptionAssertion.WithInnerException<SqliteException>()
            .WithMessage("*UNIQUE*");
    }

    [Fact]
    public async Task Should_Cascade_Delete_Notes_When_User_Is_Deleted()
    {
        using var context = new AppDbContext(_contextOptions);
        var userId = Guid.NewGuid();
        var noteId = Guid.NewGuid();

        var user = new User { Id = userId, Email = "cascade@chronos.com", PasswordHash = "hash" };
        var note = new Note { Id = noteId, Title = "To Be Deleted", ContentJson = "{}", User = user };

        context.Users.Add(user);
        context.Notes.Add(note);
        await context.SaveChangesAsync();

        context.Users.Remove(user);
        await context.SaveChangesAsync();

        using var assertContext = new AppDbContext(_contextOptions);
        var remainingNote = await assertContext.Notes.FindAsync(noteId);
        remainingNote.Should().BeNull();
    }

    public void Dispose()
    {
        _connection.Close();
        _connection.Dispose();
    }
}