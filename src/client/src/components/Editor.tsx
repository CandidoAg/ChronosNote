import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface EditorProps {
  noteId: string; 
  initialContent?: string;
  onChange: (contentJson: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ noteId, initialContent, onChange }) => {
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
        class: 'prose max-w-none focus:outline-none min-h-[300px] text-gray-800 leading-relaxed text-lg w-full',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          const { state } = view;
          const { selection } = state;
          const { $from } = selection;
          
          const currentLineText = $from.nodeBefore?.textContent || $from.parent.textContent || "";

          if (currentLineText.trim().startsWith('/remind ')) {
            event.preventDefault(); 

            console.log(`[Frontend] ¡Comando /remind interceptado!: "${currentLineText}"`);

            const parsedNoteId = parseInt(noteId) || 1; 
            fetch(`http://localhost:5155/api/Reminders/test-slash?noteId=${parsedNoteId}&text=${encodeURIComponent(currentLineText.trim())}`, {
              method: 'POST'
            }).catch(err => console.error("Error enviando recordatorio:", err));

            view.dispatch(
              state.tr.delete($from.start(), $from.end())
            );
            
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
    if (editor && initialContent) {
      const currentContent = JSON.stringify(editor.getJSON());
      if (currentContent !== initialContent) {
        editor.commands.setContent(JSON.parse(initialContent));
      }
    }
  }, [initialContent, editor]);

  return (
    <div className="w-full">
      <style>{`
        .tiptap .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #d1d5db;
          pointer-events: none;
          height: 0;
        }
      `}</style>
      <EditorContent editor={editor} />
    </div>
  );
};