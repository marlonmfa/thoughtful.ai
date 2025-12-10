import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('Message Display', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('displays welcome message on initial render', () => {
    render(<App />);
    
    expect(screen.getByText(/Hello! I'm the Thoughtful AI support assistant/i)).toBeInTheDocument();
  });

  it('shows Thoughtful AI as the sender for assistant messages', () => {
    render(<App />);
    
    const thoughtfulAIElements = screen.getAllByText('Thoughtful AI');
    expect(thoughtfulAIElements.length).toBeGreaterThan(0);
  });

  it('displays the logo and branding', () => {
    render(<App />);
    
    const logoText = screen.getAllByText('Thoughtful AI');
    expect(logoText.length).toBeGreaterThan(0);
  });

  it('shows Support Agent badge', () => {
    render(<App />);
    
    expect(screen.getByText('Support Agent')).toBeInTheDocument();
  });

  it('renders message avatars', () => {
    render(<App />);
    
    const avatars = document.querySelectorAll('.message-avatar');
    expect(avatars.length).toBeGreaterThan(0);
  });

  it('displays input placeholder text', () => {
    render(<App />);
    
    expect(screen.getByPlaceholderText(/ask me about thoughtful ai/i)).toBeInTheDocument();
  });

  it('displays input hint text', () => {
    render(<App />);
    
    expect(screen.getByText(/press enter to send/i)).toBeInTheDocument();
  });
});

