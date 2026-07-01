using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ChronosNote.Infrastructure.Persistence;
using ChronosNote.Core.Entities;
using Xunit;

namespace ChronosNote.Tests.Infrastructure.Persistence
{
    [Trait("Category", "Stress")]
    public class SqliteConcurrencyTests : IDisposable
    {
        private readonly string _dbName;
        private readonly string _connectionString;
        private readonly Guid _sharedUserId;

        public SqliteConcurrencyTests()
        {
            _dbName = $"stress_test_{Guid.NewGuid()}.db";
            _connectionString = $"Data Source={_dbName};Cache=Shared;";
            _sharedUserId = Guid.NewGuid();

            using var context = CreateContext();
            context.Database.EnsureDeleted();
            context.Database.EnsureCreated();
            context.Database.ExecuteSqlRaw("PRAGMA journal_mode=WAL;");

            // Crear el usuario dueño para evitar el fallo de Foreign Key
            var user = new User 
            { 
                Id = _sharedUserId,
                Email = "stress@chronos.com",
                CreatedAt = DateTime.UtcNow,
            };
            context.Users.Add(user);
            context.SaveChanges();
        }

        private AppDbContext CreateContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(_connectionString)
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task Autosave_ConcurrentWrites_ShouldNotThrowDatabaseLockedException()
        {
            int concurrentTasksCount = 10;
            var tasks = new List<Task>();

            for (int i = 0; i < concurrentTasksCount; i++)
            {
                int taskId = i;
                tasks.Add(Task.Run(async () =>
                {
                    using var context = CreateContext();

                    var note = new Note 
                    { 
                        Id = Guid.NewGuid(),
                        Title = $"Autosave Note {taskId}", 
                        ContentJson = $"{{\"type\":\"doc\",\"content\":[{{\"type\":\"paragraph\",\"content\":[{{\"type\":\"text\",\"text\":\"Estrés {taskId}\"}}]}}]}}",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        UserId = _sharedUserId
                    };

                    context.Notes.Add(note);
                    await context.SaveChangesAsync();
                }));
            }

            await Task.WhenAll(tasks).WaitAsync(TimeSpan.FromSeconds(10));

            using var verificationContext = CreateContext();
            var totalNotesSaved = await verificationContext.Notes.CountAsync();
            
            Assert.Equal(concurrentTasksCount, totalNotesSaved);
        }

        public void Dispose()
        {
            try
            {
                using var context = CreateContext();
                context.Database.EnsureDeleted();
            }
            catch
            {
                // Ignored
            }
        }
    }
}