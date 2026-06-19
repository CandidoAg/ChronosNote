import React from 'react';
import type { Note } from '../types/note.types';

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string, e: React.MouseEvent) => void; 
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  notes, 
  activeNoteId, 
  onSelectNote, 
  onCreateNote,
  onDeleteNote
}) => {
  return (
    <aside className="w-64 h-screen bg-[#f7f7f5] border-r border-[#ededeb] flex flex-col justify-between p-3 select-none shrink-0">
      <div className="flex flex-col gap-4 overflow-hidden h-full">
        {/* Workspace Title */}
        <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#efefe0] rounded-md cursor-pointer transition-colors shrink-0">
          <span className="text-xl">🚀</span>
          <span className="font-semibold text-gray-700 text-sm">Chronos Workspace</span>
        </div>

        {/* Action Button */}
        <button 
          onClick={onCreateNote}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-left text-sm text-gray-600 hover:bg-[#efefe0] rounded-md transition-colors font-medium shrink-0"
        >
          <span className="text-lg font-bold">+</span>
          New Page
        </button>

        {/* Navigation List */}
        <nav className="flex flex-col gap-0.5 overflow-y-auto flex-1">
          <p className="text-xs font-semibold text-gray-400 px-2 mb-1 uppercase tracking-wider shrink-0">Private</p>
          
          {notes.length === 0 ? (
            <p className="text-xs text-gray-400 px-2 italic">No pages yet</p>
          ) : (
            notes.map((note) => (
              <div 
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`group flex items-center justify-between px-2 py-1 text-sm text-gray-600 rounded-md cursor-pointer transition-colors truncate ${
                  activeNoteId === note.id ? 'bg-[#efefe0] font-medium text-gray-900' : 'hover:bg-[#efefe0]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span>📝</span>
                  <span className="truncate">{note.title || "Untitled"}</span>
                </div>
                
                {/* Botón de papelera que solo aparece al hacer hover sobre la nota */}
                <button
                  onClick={(e) => onDeleteNote(note.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-opacity"
                  title="Delete page"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </nav>
      </div>

      {/* User Footer */}
      <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#efefe0] rounded-md cursor-pointer transition-colors mt-auto shrink-0">
        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
          U
        </div>
        <span className="text-sm font-medium text-gray-700">User Profile</span>
      </div>
    </aside>
  );
};