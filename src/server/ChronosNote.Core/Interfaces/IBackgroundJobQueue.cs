using System;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace ChronosNote.Core.Interfaces
{
    public interface IBackgroundJobQueue
    {
        void Enqueue(Expression<Func<Task>> methodCall);
        
        void Enqueue(Expression<Action> methodCall);

        void Schedule(Expression<Func<Task>> methodCall, DateTimeOffset delay);
        
        void Schedule(Expression<Action> methodCall, DateTimeOffset delay);
    }
}