using ChronosNote.Api.Dtos;
using ChronosNote.Core.Entities;
using ChronosNote.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChronosNote.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotesController : ControllerBase
{
    private readonly AppDbContext _context;

    public NotesController(AppDbContext context)
    {
        _context = context;
    }

    // 1. CREATE (POST: api/notes)
    [HttpPost]
    public async Task<IActionResult> CreateNote([FromBody] CreateNoteDto dto)
    {
        if (dto == null)
            return BadRequest("Payload cannot be null");

        var note = new Note
        {
            Title = string.IsNullOrEmpty(dto.Title) ? "Untitled" : dto.Title,
            ContentJson = dto.ContentJson,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Notes.Add(note);
        await _context.SaveChangesAsync();

        return Ok(note);
    }

    // 2. READ ALL (GET: api/notes)
    [HttpGet]
    public async Task<IActionResult> GetAllNotes()
    {
        var notes = await _context.Notes
            .OrderByDescending(n => n.UpdatedAt)
            .ToListAsync();
            
        return Ok(notes);
    }

    // 3. READ ONE (GET: api/notes/{id})
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetNoteById(Guid id)
    {
        var note = await _context.Notes.FindAsync(id);
        if (note == null)
            return NotFound($"Note with ID {id} not found.");

        return Ok(note);
    }

    // 4. UPDATE (PUT: api/notes/{id})
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateNote(Guid id, [FromBody] UpdateNoteDto dto)
    {
        if (dto == null)
            return BadRequest("Payload cannot be null");

        var note = await _context.Notes.FindAsync(id);
        if (note == null)
            return NotFound($"Note with ID {id} not found.");

        // Mapeamos los datos del DTO de actualización
        note.Title = string.IsNullOrEmpty(dto.Title) ? "Untitled" : dto.Title;
        note.ContentJson = dto.ContentJson;
        note.UpdatedAt = DateTime.UtcNow; // Registramos cuándo se editó

        await _context.SaveChangesAsync();
        return Ok(note);
    }
    
    // 5. DELETE (DELETE: api/notes/{id})
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteNote(Guid id)
    {
        var note = await _context.Notes.FindAsync(id);
        if (note == null)
            return NotFound($"Note with ID {id} not found.");

        _context.Notes.Remove(note);
        await _context.SaveChangesAsync();

        return NoContent(); // Retorna 204 sin contenido, estándar para DELETE exitosos
    }
}