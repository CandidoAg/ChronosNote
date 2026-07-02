import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SettingsModal } from './SettingsModal';
import * as AuthHook from '../hooks/useAuth';

const mockUpdatePreferences = vi.fn();

vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
  username: 'Candi',
  email: 'candi@chronos.com',
  logout: vi.fn(),
  avatarColor: 'bg-purple-600',
  avatarUrl: '',
  language: 'en',
  token: 'mock-token',
  darkMode: false,
  login: vi.fn(),
  updatePreferences: mockUpdatePreferences,
});

describe('SettingsModal Component', () => {
  it('should render and switch tabs', () => {
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByRole('button', { name: /Profile/i })).toBeInTheDocument();
    
    const appearanceTab = screen.getByRole('button', { name: /Appearance/i });
    fireEvent.click(appearanceTab);
    
    expect(screen.getByText(/Dark Mode/i)).toBeInTheDocument();
  });

  it('should call updatePreferences when changing dark mode', () => {
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Appearance/i }));
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(mockUpdatePreferences).toHaveBeenCalled();
  });

  it('should not render anything when isOpen is false', () => {
    const { container } = render(<SettingsModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});