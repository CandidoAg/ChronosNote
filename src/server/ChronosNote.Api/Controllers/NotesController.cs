using System.Security.Claims;
using ChronosNote.Api.Dtos;
using ChronosNote.Core.Entities;
using ChronosNote.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChronosNote.Api.Controllers;

[Authorize] 
[ApiController]
[Route("api/[controller]")]
public class NotesController : ControllerBase
{
    private readonly AppDbContext _context;

    public NotesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CreateNote([FromBody] CreateNoteDto dto)
    {
        if (dto == null)
            return BadRequest("Payload cannot be null");

        var userId = GetUserId();

        var note = new Note
        {
            Title = string.IsNullOrEmpty(dto.Title) ? "Untitled" : dto.Title,
            ContentJson = dto.ContentJson,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            UserId = userId 
        };

        _context.Notes.Add(note);
        await _context.SaveChangesAsync();

        return Ok(note);
    }

    [HttpGet]
    public async Task<IActionResult> GetAllNotes()
    {
        var userId = GetUserId();

        var notes = await _context.Notes
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.UpdatedAt)
            .ToListAsync();
            
        return Ok(notes);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetNoteById(Guid id)
    {
        var userId = GetUserId();

        var note = await _context.Notes
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (note == null)
            return NotFound($"Note not found or you don't have access.");

        return Ok(note);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateNote(Guid id, [FromBody] UpdateNoteDto dto)
    {
        if (dto == null)
            return BadRequest("Payload cannot be null");

        var userId = GetUserId();

        // 🔑 Ensure the user can only modify their own notes
        var note = await _context.Notes
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (note == null)
            return NotFound($"Note not found or you don't have access.");

        note.Title = string.IsNullOrEmpty(dto.Title) ? "Untitled" : dto.Title;
        note.ContentJson = dto.ContentJson;
        note.UpdatedAt = DateTime.UtcNow; 

        await _context.SaveChangesAsync();
        return Ok(note);
    }
    
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteNote(Guid id)
    {
        var userId = GetUserId();

        // 🔑 Ensure the user can only delete their own notes
        var note = await _context.Notes
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (note == null)
            return NotFound($"Note not found or you don't have access.");

        _context.Notes.Remove(note);
        await _context.SaveChangesAsync();

        return NoContent(); 
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new InvalidOperationException("User ID claim is missing or invalid in the current security context.");
        }
        return userId;
    }
}