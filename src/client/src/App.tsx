import React, { useState, useEffect} from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { MainLayout } from './layouts/MainLayout';
import { Editor } from './components/Editor';
import { Sidebar } from './components/Sidebar'; 
import { SettingsModal } from './components/SettingsModal'; 
import { translations } from './utils/translations';
import type { Note } from './types/note.types'; 
import * as signalR from '@microsoft/signalr';

const API_URL = 'http://localhost:5155/api/notes';

interface ToastMessage {
  id: string;
  message: string;
  noteId: number;
}

const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    let connection: signalR.HubConnection | null = null;

    const startSignalR = async () => {
      connection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5155/hubs/notifications', {
          withCredentials: true 
        })
        .withAutomaticReconnect()
        .build();

      try {
        await connection.start();
        
        if (!isMounted) {
          await connection.stop();
          return;
        }

        console.log('[SignalR] Conectado con éxito al Hub de Notificaciones');

        connection.on('ReceiveReminderAlert', (data: { noteId: number; message: string; timestamp: string }) => {
          console.log('[SignalR] ¡Alerta de recordatorio recibida!', data);
          
          const id = Math.random().toString(36).substring(2, 9);
          const newToast: ToastMessage = {
            id,
            message: data.message,
            noteId: data.noteId
          };

          setToasts((prev) => [...prev, newToast]);

          setTimeout(() => {
            removeToast(id);
          }, 5000);
        });

      } catch (err: any) {
        if (isMounted && err?.name !== 'AbortError') {
          console.error('[SignalR] Error al conectar con SignalR:', err);
        }
      }
    };

    startSignalR();

    return () => {
      isMounted = false;
      if (connection) {
        connection.off('ReceiveReminderAlert');
        connection.stop().catch(() => {});
      }
    };
  }, [token]);

  return (
    <>
      {children}

      <div className="fixed top-4 right-4 z-9999 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 w-full p-4 rounded-xl shadow-lg border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white transform transition-all duration-300 animate-slide-in-right"
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 shrink-0 text-xl">
              ⏰
            </div>
            
            <div className="flex-1 pt-0.5">
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                Recordatorio de Chronos
              </p>
              <p className="text-sm font-medium mt-0.5 text-gray-700 dark:text-gray-300">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0 text-xs p-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
};


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
                  noteId={activeNote.id} 
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
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;