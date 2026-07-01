using System;
using System.Linq;
using System.Threading.Tasks;
using Hangfire;
using Hangfire.Common;
using Xunit;

namespace ChronosNote.Tests.Infrastructure.Services
{
    public interface ITestReminderService
    {
        Task DispatchReminderAsync(int noteId, string message);
    }

    [Trait("Category", "Integration")]
    public class HangfirePipelineTests : IDisposable
    {
        public HangfirePipelineTests()
        {
            GlobalConfiguration.Configuration.UseInMemoryStorage();
        }

        [Fact]
        public void ProcessSlashCommand_ValidReminder_ShouldCorrectlyQueueBackgroundJob()
        {
            var backgroundJobClient = new BackgroundJobClient();
            var noteId = 789;

            string jobId = backgroundJobClient.Enqueue<ITestReminderService>(service => 
                service.DispatchReminderAsync(noteId, "Buy milk")
            );

            Assert.False(string.IsNullOrEmpty(jobId));

            var monitoringApi = JobStorage.Current.GetMonitoringApi();
            var enqueuedJobs = monitoringApi.EnqueuedJobs("default", 0, 10);
            var targetJobExists = enqueuedJobs.Any(j => j.Key == jobId);

            Assert.True(targetJobExists);
            
            var targetJob = enqueuedJobs.First(j => j.Key == jobId);
            Assert.Equal(nameof(ITestReminderService.DispatchReminderAsync), targetJob.Value.Job.Method.Name);
            Assert.Equal(noteId, (int)targetJob.Value.Job.Args[0]);
            Assert.Equal("Buy milk", (string)targetJob.Value.Job.Args[1]);
        }

        public void Dispose()
        {
            JobStorage.Current = null;
        }
    }
}