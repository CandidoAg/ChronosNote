import { useState, useEffect } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { Editor } from './components/Editor';
import { Sidebar } from './components/Sidebar'; 
import type { Note } from './types/note.types'; 

const API_URL = 'http://localhost:5155/api/notes';

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
        if (data.length > 0 && !activeNote) {
          setActiveNote(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const handleCreateNote = async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '', contentJson: '{"type":"doc","content":[]}' })
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes([newNote, ...notes]); 
        setActiveNote(newNote);
      }
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const handleSelectNote = (id: string) => {
    const selected = notes.find(n => n.id === id);
    if (selected) {
      setActiveNote(selected);
    }
  };

  const handleUpdateNote = async (updatedTitle: string, updatedJson: string) => {
    if (!activeNote) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/${activeNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updatedTitle,
          contentJson: updatedJson
        })
      });

      if (response.ok) {
        const savedNote = await response.json();
        
        setNotes(notes.map(n => n.id === savedNote.id ? savedNote : n));
        setActiveNote(savedNote);
      }
    } catch (error) {
      console.error("Error updating note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que al hacer clic en borrar se seleccione la nota
    
    if (!confirm("Are you sure you want to delete this page?")) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedNotes = notes.filter(n => n.id !== id);
        setNotes(updatedNotes);
        
        // Si borramos la nota activa, limpiamos el editor o seleccionamos la primera disponible
        if (activeNote?.id === id) {
          setActiveNote(updatedNotes.length > 0 ? updatedNotes[0] : null);
        }
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

return (
    <MainLayout>
      {/* Usamos h-screen completo y quitamos los fixed innecesarios */}
      <div className="flex h-screen w-full overflow-hidden">
        
        {/* Sidebar: Se queda en su sitio de forma natural */}
        <Sidebar 
          notes={notes}
          activeNoteId={activeNote?.id || null}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onDeleteNote={handleDeleteNote}
        />

        {/* Workspace: Ocupa todo el espacio restante y tiene su propio scroll independiente */}
        <div className="flex-1 h-full overflow-y-auto px-14 py-10 bg-white">
          <div className="max-w-4xl mx-auto">
            {activeNote ? (
              <>
                {/* Estado de guardado discreto arriba a la derecha */}
                <div className="flex justify-end text-xs text-gray-400 h-6">
                  {isSaving ? 'Saving changes...' : 'Saved to SQLite'}
                </div>

                {/* Input de Título */}
                <input 
                  type="text" 
                  placeholder="Untitled" 
                  value={activeNote.title}
                  onChange={(e) => handleUpdateNote(e.target.value, activeNote.contentJson)}
                  className="w-full text-4xl font-bold text-gray-900 mb-6 bg-transparent border-none outline-none placeholder-gray-300"
                />
                
                {/* Editor de Tiptap */}
                <Editor 
                  initialContent={activeNote.contentJson} 
                  onChange={(json) => handleUpdateNote(activeNote.title, json)} 
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
                <span className="text-4xl mb-2">👋</span>
                <p>Select a page or create a new one to start writing.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </MainLayout>
  );
}

export default App;