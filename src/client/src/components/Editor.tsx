import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { BubbleMenuPlugin } from '@tiptap/extension-bubble-menu';
import { useAuth } from '../context/AuthContext';

interface EditorProps {
  noteId: string; 
  initialContent?: string;
  onChange: (contentJson: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ noteId, initialContent, onChange }) => {
  const { token } = useAuth();
  const [aiLoading, setAiLoading] = useState(false);
  
  const [currentLang, setCurrentLang] = useState('es');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getChronosLang = (): string => {
      const storageLang = localStorage.getItem('chronos_lang') || sessionStorage.getItem('chronos_lang');
      if (storageLang) return storageLang.toLowerCase().substring(0, 2);

      const match = document.cookie.match(new RegExp('(^| )chronos_lang=([^;]+)'));
      if (match) return match[2].toLowerCase().substring(0, 2);

      return 'es'; 
    };

    setCurrentLang(getChronosLang());

    const interval = setInterval(() => {
      const activeLang = getChronosLang();
      setCurrentLang((prev) => (prev !== activeLang ? activeLang : prev));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const translations: Record<string, { 
    btnSummarize: string; 
    btnTasks: string; 
    btnTone: string; 
    labelTasks: string; 
    labelSummary: string;
    loading: string;
  }> = {
    es: { 
      btnSummarize: "✨ Resumir", 
      btnTasks: "📝 Tareas", 
      btnTone: "👔 Tono Pro",
      labelTasks: "📋 Tareas sugeridas por IA:", 
      labelSummary: "✨ Resumen IA:",
      loading: "Llama 3.2 pensando..."
    },
    fr: { 
      btnSummarize: "✨ Résumer", 
      btnTasks: "📝 Tâches", 
      btnTone: "👔 Ton Pro",
      labelTasks: "📋 Tâches suggérées par l'IA :", 
      labelSummary: "✨ Résumé de l'IA :",
      loading: "Llama 3.2 en cours de réflexion..."
    },
    en: { 
      btnSummarize: "✨ Summarize", 
      btnTasks: "📝 Tasks", 
      btnTone: "👔 Pro Tone",
      labelTasks: "📋 AI Suggested Tasks:", 
      labelSummary: "✨ AI Summary:",
      loading: "Llama 3.2 thinking..."
    }
  };

  const i18n = translations[currentLang] || translations['es'];

  const handleAILogic = async (action: 'summarize' | 'tasks' | 'tone') => {
    if (!editor || !token || aiLoading) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');

    if (!selectedText.trim()) return;

    setAiLoading(true);

    try {
      const response = await fetch('http://localhost:5155/api/AI/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          text: selectedText, 
          action,
          language: currentLang
        })
      });

      if (!response.ok) throw new Error('Error en la respuesta de la IA');

      const data = await response.json();
      const aiResult = data.result;

      if (action === 'tasks') {
        const lines = aiResult.split('\n').filter((l: string) => l.trim().length > 0);
        let htmlList = `<p><strong>${i18n.labelTasks}</strong></p><ul>`;
        
        lines.forEach((line: string) => {
          const cleanLine = line.replace(/^[-*•\s\d.]+|===/g, '').trim();
          if (cleanLine) {
            htmlList += `<li>${cleanLine}</li>`;
          }
        });
        htmlList += `</ul><p></p>`;
        
        editor.chain().focus().setTextSelection(to).insertContent(htmlList).run();

      } else if (action === 'summarize') {
        const cleanSummary = aiResult.replace(/===/g, '').trim();
        const htmlSummary = `<p><strong>${i18n.labelSummary}</strong></p><blockquote>${cleanSummary}</blockquote><p></p>`;
        
        editor.chain().focus().setTextSelection(to).insertContent(htmlSummary).run();

      } else if (action === 'tone') {
        editor.chain().focus().insertContentAt({ from, to }, aiResult).run();
      }

    } catch (err) {
      console.error("Error procesando IA local:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Press enter to start writing...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: initialContent ? JSON.parse(initialContent) : '', 
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[300px] text-gray-800 leading-relaxed text-lg w-full dark:text-zinc-200 custom-editor',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          const { state } = view;
          const { selection } = state;
          const { $from } = selection;
          
          const currentLineText = $from.nodeBefore?.textContent || $from.parent.textContent || "";

          if (currentLineText.trim().startsWith('/remind')) {
            event.preventDefault(); 
            const parsedNoteId = parseInt(noteId) || 1; 
            fetch(`http://localhost:5155/api/Reminders/test-slash?noteId=${parsedNoteId}&text=${encodeURIComponent(currentLineText.trim())}`, {
              method: 'POST'
            }).catch(err => console.error("Error enviando recordatorio:", err));

            view.dispatch(state.tr.delete($from.start(), $from.end()));
            editor?.commands.insertContent('<p></p>');
            return true;
          }
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
      const jsonString = JSON.stringify(editor.getJSON());
      onChange(jsonString);
    },
  });

  useEffect(() => {
    if (!editor || !menuRef.current) return;

    const plugin = BubbleMenuPlugin({
      pluginKey: 'aiBubbleMenuPlugin',
      editor: editor,
      element: menuRef.current,
    });

    editor.registerPlugin(plugin);

    return () => {
      editor.unregisterPlugin('aiBubbleMenuPlugin');
    };
  }, [editor]);

  useEffect(() => {
    if (editor && initialContent) {
      const currentContent = JSON.stringify(editor.getJSON());
      if (currentContent !== initialContent) {
        editor.commands.setContent(JSON.parse(initialContent));
      }
    }
  }, [initialContent, editor]);

  return (
    <div className="w-full relative">
      <style>{`
        .tiptap .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #4b5563;
          pointer-events: none;
          height: 0;
        }
        .prose blockquote {
          border-left-color: #a855f7 !important;
          background-color: rgba(168, 85, 247, 0.05);
          padding: 0.75rem 1rem;
          border-radius: 0 0.5rem 0.5rem 0;
          font-style: italic;
        }
        .prose ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .prose li {
          margin-top: 0.25rem !important;
          margin-bottom: 0.25rem !important;
        }
      `}</style>

      {/* Menú Burbuja Flotante Traducido */}
      <div 
        ref={menuRef} 
        className="flex items-center gap-1 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-1.5 rounded-xl shadow-xl backdrop-blur-md select-none pointer-events-auto"
      >
        {aiLoading ? (
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400">
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {i18n.loading}
          </div>
        ) : (
          <>
            <button
              type="button"
              disabled={aiLoading}
              onClick={() => handleAILogic('summarize')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-zinc-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-400 transition-colors disabled:opacity-50"
            >
              {i18n.btnSummarize}
            </button>
            <div className="w-px h-4 bg-gray-200 dark:bg-zinc-800" />
            <button
              type="button"
              disabled={aiLoading}
              onClick={() => handleAILogic('tasks')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-zinc-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-400 transition-colors disabled:opacity-50"
            >
              {i18n.btnTasks}
            </button>
            <div className="w-px h-4 bg-gray-200 dark:bg-zinc-800" />
            <button
              type="button"
              disabled={aiLoading}
              onClick={() => handleAILogic('tone')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-zinc-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-400 transition-colors disabled:opacity-50"
            >
              {i18n.btnTone}
            </button>
          </>
        )}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
};