import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { MainLayout } from './layouts/MainLayout';
import { Editor } from './components/Editor';
import { Sidebar } from './components/Sidebar'; 
import { SettingsModal } from './components/SettingsModal'; 
import { translations } from './utils/translations';
import type { Note } from './types/note.types'; 

const API_URL = 'http://localhost:5155/api/notes';

function WorkspaceContent() {
  const { token, email, language } = useAuth(); 
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const t = translations[language] || translations['en'];

  useEffect(() => {
    if (token) {
      fetchNotes();
    }
  }, [token]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title: updatedTitle, contentJson: updatedJson })
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
    e.stopPropagation(); 
    if (!confirm(t.confirmDelete)) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const updatedNotes = notes.filter(n => n.id !== id);
        setNotes(updatedNotes);
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
      <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-[#191919] transition-colors">
        
        <Sidebar 
          notes={notes}
          activeNoteId={activeNote?.id || null}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onDeleteNote={handleDeleteNote}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <div className="flex-1 h-full overflow-y-auto px-14 py-10 bg-white dark:bg-[#1e1e1e] transition-colors">
          <div className="max-w-4xl mx-auto">
            {activeNote ? (
              <>
                <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500 h-6 mb-4 select-none">
                  <span className="truncate max-w-50">{t.loggedInAs} <strong className="text-gray-600 dark:text-gray-400">{email}</strong></span>
                  <div>
                    <span>{isSaving ? t.savingStatus : t.savedStatus}</span>
                  </div>
                </div>

                <input 
                  type="text" 
                  placeholder={t.untitled} 
                  value={activeNote.title}
                  onChange={(e) => handleUpdateNote(e.target.value, activeNote.contentJson)}
                  className="w-full text-4xl font-bold text-gray-900 dark:text-white mb-6 bg-transparent border-none outline-none placeholder-gray-300 dark:placeholder-gray-700"
                />
                
                <Editor 
                  initialContent={activeNote.contentJson} 
                  onChange={(json) => handleUpdateNote(activeNote.title, json)} 
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 dark:text-gray-600 select-none">
                <span className="text-4xl mb-2">👋</span>
                <p>{t.emptyState}</p>
              </div>
            )}
          </div>
        </div>

        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      </div>
    </MainLayout>
  );
}

const AppContent: React.FC = () => {
  const { token } = useAuth()
  return !token ? <AuthPage /> : <WorkspaceContent />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;