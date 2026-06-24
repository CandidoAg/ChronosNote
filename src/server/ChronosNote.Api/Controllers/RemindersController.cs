using Microsoft.AspNetCore.Mvc;
using ChronosNote.Core.Interfaces;

namespace ChronosNote.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RemindersController : ControllerBase
    {
        private readonly IReminderService _reminderService;

        public RemindersController(IReminderService reminderService)
        {
            _reminderService = reminderService;
        }

        [HttpPost("test-slash")]
        public IActionResult TestSlashCommand([FromQuery] int noteId, [FromQuery] string text)
        {
            _reminderService.CreateReminder(noteId, text, "in 1 minute");
            return Accepted(new { message = "Comando recibido. Procesando recordatorio en segundo plano." });
        }
    }
}