import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Input Area', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  it('renders input field with correct placeholder', () => {
    render(<App />);
    
    const input = screen.getByPlaceholderText(/ask me about thoughtful ai/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('chat-input');
  });

  it('renders send button', () => {
    render(<App />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeInTheDocument();
    expect(sendButton).toHaveClass('send-btn');
  });

  it('send button is disabled when input is empty', () => {
    render(<App />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('send button is enabled when input has text', () => {
    render(<App />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    fireEvent.change(input, { target: { value: 'Hello' } });
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).not.toBeDisabled();
  });

  it('send button is disabled when input only has whitespace', () => {
    render(<App />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    fireEvent.change(input, { target: { value: '   ' } });
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('input is disabled while loading', async () => {
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

    await waitFor(() => {
      expect(input).toBeDisabled();
    });

    // Clean up
    resolvePromise({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { answer: 'Response', source: 'openai' }
      })
    });
  });

  it('submits message on Enter key press', async () => {
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
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('does not submit on Shift+Enter', () => {
    render(<App />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('input value is cleared after sending message', async () => {
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

  it('does not send empty messages', () => {
    render(<App />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    fireEvent.submit(input.closest('form'));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('input is focused on initial render', () => {
    render(<App />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    expect(document.activeElement).toBe(input);
  });
});

