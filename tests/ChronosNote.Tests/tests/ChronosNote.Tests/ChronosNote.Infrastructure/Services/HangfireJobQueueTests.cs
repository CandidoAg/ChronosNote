using Xunit;
using FluentAssertions;
using System;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Hangfire;
using Hangfire.InMemory;

namespace ChronosNote.Infrastructure.Services;

public class HangfireJobQueueTests
{
    private readonly HangfireJobQueue _jobQueue;

    public HangfireJobQueueTests()
    {
        JobStorage.Current = new InMemoryStorage();
        _jobQueue = new HangfireJobQueue();
    }

    [Fact]
    public void Enqueue_Async_Expression_Should_Not_Throw_Exception()
    {
        Expression<Func<Task>> call = () => HangfireTestHelper.DummyAsyncTask();
        Action act = () => _jobQueue.Enqueue(call);
        act.Should().NotThrow();
    }

    [Fact]
    public void Enqueue_Action_Expression_Should_Not_Throw_Exception()
    {
        Expression<Action> call = () => HangfireTestHelper.DummyActionTask();
        Action act = () => _jobQueue.Enqueue(call);
        act.Should().NotThrow();
    }

    [Fact]
    public void Schedule_Async_Expression_Should_Not_Throw_Exception()
    {
        Expression<Func<Task>> call = () => HangfireTestHelper.DummyAsyncTask();
        var delay = DateTimeOffset.UtcNow.AddMinutes(10);

        Action act = () => _jobQueue.Schedule(call, delay);
        act.Should().NotThrow();
    }
}

public static class HangfireTestHelper
{
    public static Task DummyAsyncTask() => Task.CompletedTask;
    public static void DummyActionTask() { }
}