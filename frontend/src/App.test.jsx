import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock fetch
global.fetch = vi.fn();

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the chat interface', () => {
    render(<App />);
    
    expect(screen.getAllByText('Thoughtful AI').length).toBeGreaterThan(0);
    expect(screen.getByText('Support Agent')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ask me about/i)).toBeInTheDocument();
  });

  it('displays the initial welcome message', () => {
    render(<App />);
    
    expect(screen.getByText(/Hello! I'm the Thoughtful AI support assistant/i)).toBeInTheDocument();
  });

  it('shows quick questions on initial load', () => {
    render(<App />);
    
    expect(screen.getByText('Try asking:')).toBeInTheDocument();
    expect(screen.getByText('What does EVA do?')).toBeInTheDocument();
    expect(screen.getByText('Tell me about CAM')).toBeInTheDocument();
  });

  it('sends a message when clicking send button', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          answer: 'Test response',
          source: 'predefined',
          confidence: 0.8
        }
      })
    });

    render(<App />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });
  });

  it('shows loading indicator while waiting for response', async () => {
    let resolvePromise;
    global.fetch.mockReturnValueOnce(
      new Promise(resolve => {
        resolvePromise = resolve;
      })
    );

    render(<App />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form'));
    
    // Check for loading indicator (typing animation)
    await waitFor(() => {
      expect(document.querySelector('.typing-indicator')).toBeInTheDocument();
    });

    // Resolve the promise to clean up
    resolvePromise({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { answer: 'Response', source: 'openai' }
      })
    });
  });

  it('displays error message on fetch failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<App />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form'));
    
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('clears input after sending message', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { answer: 'Response', source: 'openai' }
      })
    });

    render(<App />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form'));
    
    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('handles quick question clicks', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { answer: 'EVA response', source: 'predefined' }
      })
    });

    render(<App />);
    
    const quickQuestion = screen.getByText('What does EVA do?');
    fireEvent.click(quickQuestion);
    
    await waitFor(() => {
      expect(screen.getByText('EVA response')).toBeInTheDocument();
    });
  });
});

