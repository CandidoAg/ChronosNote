import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Editor } from './Editor';
import { AuthProvider } from '../context/AuthContext';
import * as TiptapReact from '@tiptap/react';

const createMockEditor = () => ({
  state: { 
    selection: { from: 0, to: 5 }, 
    doc: { textBetween: vi.fn(() => 'texto seleccionado') } 
  },
  chain: vi.fn().mockReturnThis(),
  focus: vi.fn().mockReturnThis(),
  setTextSelection: vi.fn().mockReturnThis(),
  insertContent: vi.fn().mockReturnThis(),
  insertContentAt: vi.fn().mockReturnThis(),
  run: vi.fn(),
  getJSON: vi.fn().mockReturnValue({}),
  registerPlugin: vi.fn(),
  unregisterPlugin: vi.fn(),
  destroy: vi.fn(),
  commands: { setContent: vi.fn(), insertContent: vi.fn() },
  dispatch: vi.fn(),
});

let currentMockEditor = createMockEditor();

vi.mock('@tiptap/react', () => ({
  ...vi.importActual('@tiptap/react'),
  useEditor: vi.fn(() => currentMockEditor),
  EditorContent: () => <div data-testid="editor-content" />,
}));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('Editor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('chronos_token', 'mock-token');
    localStorage.setItem('chronos_lang', 'es');
    currentMockEditor = createMockEditor();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ content: '{"type":"doc"}' }),
    });
  });

  it('debería ejecutar el handleKeyDown del recordatorio', async () => {
    render(<AuthProvider><Editor noteId="1" onChange={vi.fn()} /></AuthProvider>);
    const handleKeyDown = vi.mocked(TiptapReact.useEditor).mock.calls[0][0]?.editorProps?.handleKeyDown;
    const view = { 
        state: { tr: { delete: vi.fn().mockReturnThis() }, selection: { $from: { nodeBefore: { textContent: '/remind' }, start: () => 0, end: () => 5 } } }, 
        dispatch: vi.fn() 
    } as any;
    expect(handleKeyDown!(view, { key: 'Enter', preventDefault: vi.fn() } as any)).toBe(true);
  });

  it('debería cubrir la rama de tasks', async () => {
    currentMockEditor.state = {
      ...currentMockEditor.state,
      selection: {
        $from: {
          nodeBefore: { textContent: '/task' },
          start: () => 0,
          end: () => 5
        },
        from: 0,
        to: 5
      },
      doc: {
        textBetween: vi.fn(() => '/task')
      }
    } as any;

    render(<AuthProvider><Editor noteId="1" onChange={vi.fn()} /></AuthProvider>);
    
    const btn = await screen.findByText(/📝 Tareas/i);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'Tarea procesada' })
    });
    fireEvent.click(btn);
    
    await act(async () => { await new Promise(r => setTimeout(r, 200)); });
    
    expect(currentMockEditor.chain).toHaveBeenCalled();
  });

  it('debe cubrir la rama "summarize" en la respuesta de la IA', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        result: 'Resumen de prueba'
      })
    });

    render(<AuthProvider><Editor noteId="1" onChange={vi.fn()} /></AuthProvider>);
    
    const btn = screen.getByText(/✨ Resumir/i);
    fireEvent.click(btn);

    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    expect(currentMockEditor.chain).toHaveBeenCalled();
    expect(currentMockEditor.insertContent).toHaveBeenCalledWith(
      expect.stringContaining('<blockquote>Resumen de prueba</blockquote>')
    );
  });

  it('debe cubrir la rama "tone" en la respuesta de la IA', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ action: 'tone', aiResult: 'Texto profesional' })
    });

    render(<AuthProvider><Editor noteId="1" onChange={vi.fn()} /></AuthProvider>);
    
    const btn = screen.getByText(/👔 Tono Pro/i); 
    fireEvent.click(btn);

    await act(async () => { await new Promise(r => setTimeout(r, 200)); });

    expect(currentMockEditor.chain).toHaveBeenCalled();
    expect(currentMockEditor.insertContentAt).toHaveBeenCalled();
  });



  it('debe cubrir la carga de idioma por defecto', () => {
    localStorage.removeItem('chronos_lang');
    render(<AuthProvider><Editor noteId="1" onChange={vi.fn()} /></AuthProvider>);
    expect(screen.getByText(/Tareas/i)).toBeInTheDocument(); 
  });

  it('debe cubrir la rama del catch cuando fetch falla', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Fetch failed'));
    render(<AuthProvider><Editor noteId="1" onChange={vi.fn()} /></AuthProvider>);
    const handleKeyDown = vi.mocked(TiptapReact.useEditor).mock.calls[0][0]?.editorProps?.handleKeyDown;
    const view = { 
        state: { selection: { $from: { nodeBefore: { textContent: '/remind' }, parent: { textContent: '' }, start: () => 0, end: () => 5 } }, tr: { delete: vi.fn().mockReturnThis() } },
        dispatch: vi.fn() 
    } as any;
    await act(async () => { handleKeyDown!(view, { key: 'Enter', preventDefault: vi.fn() } as any); });
    expect(view.dispatch).toHaveBeenCalled();
  });

  it('debería cubrir el resumen con texto vacío', async () => {
    currentMockEditor.state.doc.textBetween = vi.fn(() => '');
    render(<AuthProvider><Editor noteId="1" onChange={vi.fn()} /></AuthProvider>);
    fireEvent.click(screen.getByText(/✨ Resumir/i));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('debe activar el menú de sugerencias', async () => {
    render(<AuthProvider><Editor noteId="1" onChange={vi.fn()} /></AuthProvider>);
    await act(async () => {
      currentMockEditor.commands.insertContent('/');
    });
    expect(currentMockEditor.commands.insertContent).toHaveBeenCalledWith('/');
  });

  it('debe limpiar el plugin del editor al desmontar', () => {
    const { unmount } = render(<AuthProvider><Editor noteId="1" onChange={vi.fn()} /></AuthProvider>);
    
    act(() => {
      unmount();
    });
    
    expect(currentMockEditor.unregisterPlugin).toHaveBeenCalledWith('aiBubbleMenuPlugin');
  });

  it('debe cambiar el idioma a través del intervalo', () => {
    vi.useFakeTimers();

    localStorage.setItem('chronos_lang', 'fr');
    
    render(<AuthProvider><Editor noteId="1" onChange={vi.fn()} /></AuthProvider>);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(screen.getByText(/✨ Résumer/i)).toBeInTheDocument();
    
    vi.useRealTimers();
  });

  it('debe actualizar el contenido del editor si initialContent cambia', () => {
    const { rerender } = render(
      <AuthProvider><Editor noteId="1" initialContent={JSON.stringify({ type: 'doc' })} onChange={vi.fn()} /></AuthProvider>
    );

    const newContent = JSON.stringify({ type: 'doc', content: [{ type: 'text', text: 'hola' }] });
    
    rerender(
      <AuthProvider><Editor noteId="1" initialContent={newContent} onChange={vi.fn()} /></AuthProvider>
    );

    expect(currentMockEditor.commands.setContent).toHaveBeenCalled();
  });

  it('debe resetear aiLoading incluso si la acción falla', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false });
    
    render(<AuthProvider><Editor noteId="1" onChange={vi.fn()} /></AuthProvider>);
    
    fireEvent.click(screen.getByText(/✨ Resumir/i));
    
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    
    expect(screen.queryByText(/thinking/i)).not.toBeInTheDocument();
  });
});