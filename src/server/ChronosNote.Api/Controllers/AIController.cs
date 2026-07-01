using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ChronosNote.Core.Interfaces;

namespace ChronosNote.Api.Controllers
{
    [Authorize] 
    [ApiController]
    [Route("api/[controller]")]
    public class AIController : ControllerBase
    {
        private readonly IAIEngineService _aiEngineService;

        public AIController(IAIEngineService aiEngineService)
        {
            _aiEngineService = aiEngineService;
        }

        [HttpPost("process")]
        public async Task<IActionResult> ProcessText([FromBody] AIProcessRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Text))
            {
                return BadRequest(new { result = "El texto no puede estar vacío." });
            }

            string normalizedAction = request.Action?.ToLower() ?? "";
            if (normalizedAction != "summarize" && normalizedAction != "tasks" && normalizedAction != "tone")
            {
                return BadRequest(new { result = "Acción no válida. Use: 'summarize', 'tasks' o 'tone'." });
            }

            string targetLanguage = string.IsNullOrWhiteSpace(request.Language) ? "es" : request.Language.ToLower();

            try
            {

                string languageInstruction = targetLanguage switch
                {
                    "fr" => "Instructions: Vous devez répondre impérativement en Français. Ne traduisez pas les commandes, traitez le texte directement en français.\n",
                    "en" => "Instructions: You must strictly respond in English.\n",
                    _ => "Instrucciones: Debes responder imperativamente en Español.\n"
                };

                string localizedPrompt = languageInstruction + request.Text;

                string aiJsonResult = await _aiEngineService.ProcessTextAsync(localizedPrompt, normalizedAction);
                
                return Content(aiJsonResult, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { result = $"Error procesando la solicitud de IA: {ex.Message}" });
            }
        }
    }

    public class AIProcessRequest
    {
        public string Text { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Language { get; set; } = "es"; 
    }
}