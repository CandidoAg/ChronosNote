import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Logo } from './Logo';

describe('Logo Component', () => {
  it('should render correctly', () => {
    const { container } = render(<Logo />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should apply the provided className', () => {
    const { container } = render(<Logo className="w-10 h-10" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveClass('w-10 h-10');
  });
});