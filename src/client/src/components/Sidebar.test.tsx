import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from './Sidebar';
import * as AuthHook from '../hooks/useAuth';


const mockLogout = vi.fn();

const setup = (props = {}) => {
  const defaultProps = {
    notes: [{ id: '1', title: 'Test Note', contentJson: '{}', createdAt: '', updatedAt: '', userId: '1' }],
    activeNoteId: '1',
    onSelectNote: vi.fn(),
    onCreateNote: vi.fn(),
    onDeleteNote: vi.fn(),
    onOpenSettings: vi.fn(),
    ...props,
  };
  return { ...defaultProps, renderResult: render(<Sidebar {...defaultProps} />) };
};

vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
  username: 'Candi',
  email: 'candi@chronos.com',
  logout: mockLogout,
  avatarColor: 'bg-purple-600',
  avatarUrl: '',
  language: 'en',
  token: 'mock-token',
  darkMode: false,
  login: vi.fn(),
  updatePreferences: vi.fn(),
});

describe('Sidebar Component', () => {
  it('debe renderizar el estado vacío correctamente', () => {
    setup({ notes: [] });
    expect(screen.getByText(/No pages/i)).toBeInTheDocument();
  });

  it('debe disparar las acciones al hacer clic', () => {
    const { onCreateNote, onDeleteNote, onOpenSettings, onSelectNote } = setup();
    fireEvent.click(screen.getByText(/\+/i));
    expect(onCreateNote).toHaveBeenCalled();
    fireEvent.click(screen.getByText(/Test Note/i));
    expect(onSelectNote).toHaveBeenCalledWith('1');
    fireEvent.click(screen.getByTitle(/delete page/i));
    expect(onDeleteNote).toHaveBeenCalled();
    fireEvent.click(screen.getByTitle(/settings/i));
    expect(onOpenSettings).toHaveBeenCalled();
    fireEvent.click(screen.getByTitle(/Log Out/i));
    expect(mockLogout).toHaveBeenCalled();
  });

  it('debe renderizar el fallback cuando no hay username ni email', () => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValueOnce({
      username: '', email: '', logout: mockLogout, avatarColor: '', avatarUrl: '',
      language: 'en', token: '', darkMode: false, login: vi.fn(), updatePreferences: vi.fn()
    });
    
    setup();

    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('debe renderizar la imagen del avatar si existe', () => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValueOnce({
      username: 'Candi', email: 'candi@chronos.com', logout: mockLogout, 
      avatarColor: 'bg-purple-600', avatarUrl: 'http://test.com/avatar.jpg',
      language: 'en', token: '', darkMode: false, login: vi.fn(), updatePreferences: vi.fn()
    });
    
    setup();
    const img = screen.getByAltText('Profile');
    expect(img).toBeInTheDocument();
    
    fireEvent.error(img);
    expect((img as HTMLImageElement).style.display).toBe('none');
  });

  it('debe usar el idioma por defecto si la traducción no existe', () => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValueOnce({
      username: 'Candi', email: '', logout: mockLogout, avatarColor: '', avatarUrl: '',
      language: 'idioma-inexistente', token: '', darkMode: false, login: vi.fn(), updatePreferences: vi.fn()
    });
    
    setup();

    expect(screen.getByText(/Private/i)).toBeInTheDocument();
  });
});