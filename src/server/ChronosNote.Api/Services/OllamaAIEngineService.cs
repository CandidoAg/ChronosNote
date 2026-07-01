using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using ChronosNote.Core.Interfaces;

namespace ChronosNote.Api.Services
{
    public class OllamaAIEngineService : IAIEngineService
    {
        private readonly HttpClient _httpClient;
        private const string OllamaUrl = "http://localhost:11434/api/generate";
        private const string ModelName = "llama3.2:3b";

        public OllamaAIEngineService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<string> ProcessTextAsync(string text, string action)
        {
            string systemPrompt = action.ToLower() switch
            {
                "summarize" => "Eres un asistente experto en resumir. Analiza el texto proporcionado y devuelve un JSON con la estructura exacta: { \"result\": \"Tu resumen conciso aquí en español\" }.",
                "tasks" => "Eres un extractor de tareas pendientes. Analiza el texto y extrae elementos accionables en una lista limpia. Devuelve un JSON con la estructura exacta: { \"result\": \"- Tarea 1\\n- Tarea 2\" }.",
                "tone" => "Eres un editor profesional de estilo. Reescribe el texto para mejorar su claridad, fluidez y profesionalismo sin cambiar su significado central. Devuelve un JSON con la estructura exacta: { \"result\": \"Tu texto mejorado aquí en español\" }.",
                _ => "Devuelve un JSON con la estructura exacta: { \"result\": \"Acción no reconocida\" }."
            };

            var requestBody = new
            {
                model = ModelName,
                prompt = $"Contexto/Texto:\n{text}\n\nInstrucción: Procesa el texto de acuerdo a tu rol del sistema.",
                system = systemPrompt,
                stream = false,
                format = "json"
            };

            var jsonPayload = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.PostAsync(OllamaUrl, content);
                response.EnsureSuccessStatusCode();

                var responseString = await response.Content.ReadAsStringAsync();
                
                using var doc = JsonDocument.Parse(responseString);
                if (doc.RootElement.TryGetProperty("response", out var aiResponseElement))
                {
                    return aiResponseElement.GetString() ?? "{ \"result\": \"\" }";
                }

                return "{ \"result\": \"Error parseando la estructura de Ollama.\" }";
            }
            catch (Exception ex)
            {
                return $"{{ \"result\": \"Error de conexión con el motor IA local: {ex.Message}\" }}";
            }
        }
    }
}