using System.Threading.Tasks;

namespace ChronosNote.Core.Interfaces
{
    public interface IAIEngineService
    {
        Task<string> ProcessTextAsync(string text, string action);
    }
}