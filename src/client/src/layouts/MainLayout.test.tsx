import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MainLayout } from './MainLayout';

describe('MainLayout', () => {
  it('debe renderizar los elementos hijos correctamente', () => {
    render(
      <MainLayout>
        <div data-testid="child">Contenido de prueba</div>
      </MainLayout>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Contenido de prueba')).toBeInTheDocument();
  });

  it('debe aplicar las clases de layout necesarias', () => {
    const { container } = render(<MainLayout><div></div></MainLayout>);
    
    const div = container.firstChild as HTMLElement;
    expect(div.classList.contains('w-screen')).toBe(true);
    expect(div.classList.contains('h-screen')).toBe(true);
  });
});