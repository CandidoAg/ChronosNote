import React from 'react';
import type { Note } from '../types/note.types';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { translations } from '../utils/translations';

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string, e: React.MouseEvent) => void; 
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  notes, 
  activeNoteId, 
  onSelectNote, 
  onCreateNote,
  onDeleteNote,
  onOpenSettings
}) => {
  const { username, email, logout, avatarColor, avatarUrl, language } = useAuth();
  const t = translations[language] || translations['en'];

  const initial = (username || email || 'U').charAt(0).toUpperCase();

  return (
    <aside className="w-64 h-screen bg-[#f7f7f5] dark:bg-[#191919] border-r border-[#ededeb] dark:border-[#2f2f2f] flex flex-col justify-between p-3 select-none shrink-0 transition-colors">
      <div className="flex flex-col gap-4 overflow-hidden h-full">
        {/* Workspace Brand Title */}
        <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#efefe0] dark:hover:bg-[#2c2c2c] rounded-md cursor-pointer transition-colors shrink-0">
          <Logo className="w-5 h-5 rounded" />
          <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{t.workspaceTitle}</span>
        </div>

        {/* Action Button */}
        <button 
          onClick={onCreateNote}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-[#efefe0] dark:hover:bg-[#2c2c2c] rounded-md transition-colors font-medium shrink-0"
        >
          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">+</span>
          {t.newPage}
        </button>

        {/* Dynamic Navigation Page Tree */}
        <nav className="flex flex-col gap-0.5 overflow-y-auto flex-1">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-2 mb-1 uppercase tracking-wider shrink-0">{t.privateSection}</p>
          
          {notes.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 px-2 italic">{t.noPages}</p>
          ) : (
            notes.map((note) => (
              <div 
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`group flex items-center justify-between px-2 py-1 text-sm text-gray-600 dark:text-gray-400 rounded-md cursor-pointer transition-colors truncate ${
                  activeNoteId === note.id ? 'bg-[#efefe0] dark:bg-[#2c2c2c] font-medium text-gray-900 dark:text-white' : 'hover:bg-[#efefe0] dark:hover:bg-[#202020]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span>📝</span>
                  <span className="truncate">{note.title || t.untitled}</span>
                </div>
                
                <button
                  onClick={(e) => onDeleteNote(note.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                  title={t.deletePage}
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </nav>
      </div>

      {/* User Footer Action Hub Layout */}
      <div className="flex items-center justify-between p-2 mt-auto border-t border-gray-200/60 dark:border-[#2f2f2f] shrink-0 bg-[#f7f7f5] dark:bg-[#191919] transition-colors">
        <div className="flex items-center gap-2 truncate max-w-[140px]">
          {/* Conditional Avatar Display: Image URL Link vs Color Fallback */}
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="Profile" 
              className="w-6 h-6 rounded-full object-cover shadow-sm border border-gray-200 dark:border-gray-700 animate-in fade-in duration-200" 
              onError={(e) => {
                // Safe fallback string if the hosted image link breaks or errors out
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className={`w-6 h-6 rounded-full ${avatarColor || 'bg-purple-600'} flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 shadow-sm transition-colors`}>
              {initial}
            </div>
          )}
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
            {username || 'Account'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button 
            onClick={onOpenSettings}
            className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-[#2c2c2c] transition-all"
            title={t.settingsTitle}
          >
            ⚙️
          </button>
          <button 
            onClick={logout}
            className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
            title="Log Out"
          >
            🚪
          </button>
        </div>
      </div>
    </aside>
  );
};