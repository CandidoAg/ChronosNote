import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface EditorProps {
  initialContent?: string; // Ahora sí lo usamos obligatoriamente
  onChange: (contentJson: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ initialContent, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Press enter to start writing...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    // Cargamos el JSON inicial si existe, si no, vacío
    content: initialContent ? JSON.parse(initialContent) : '', 
    editorProps: {
      attributes: {
        // Añadimos 'prose max-w-none' para activar la visualización de los estilos Markdown (títulos, listas, etc.)
        class: 'prose max-w-none focus:outline-none min-h-[300px] text-gray-800 leading-relaxed text-lg w-full',
      },
    },
    onUpdate: ({ editor }) => {
      const jsonString = JSON.stringify(editor.getJSON());
      onChange(jsonString);
    },
  });

  // EFECTO CRUCIAL: Si cambias de nota en la barra lateral, este bloque actualiza el lienzo del editor
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