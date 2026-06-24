using System;
using System.Linq.Expressions;
using System.Threading.Tasks;
using ChronosNote.Core.Interfaces;
using Hangfire;

namespace ChronosNote.Infrastructure.Services
{
    public class HangfireJobQueue : IBackgroundJobQueue
    {
        public void Enqueue(Expression<Func<Task>> methodCall)
        {
            BackgroundJob.Enqueue(methodCall);
        }

        public void Enqueue(Expression<Action> methodCall)
        {
            BackgroundJob.Enqueue(methodCall);
        }

        public void Schedule(Expression<Func<Task>> methodCall, DateTimeOffset delay)
        {
            BackgroundJob.Schedule(methodCall, delay);
        }

        public void Schedule(Expression<Action> methodCall, DateTimeOffset delay)
        {
            BackgroundJob.Schedule(methodCall, delay);
        }
    }
}