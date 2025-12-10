import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Error Handling', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  it('displays error message on network failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<App />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form'));
    
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('displays error message on server error (500)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    render(<App />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form'));
    
    await waitFor(() => {
      expect(screen.getByText(/server error: 500/i)).toBeInTheDocument();
    });
  });

  it('displays error when response success is false', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: false,
        message: 'Custom error message'
      })
    });

    render(<App />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form'));
    
    await waitFor(() => {
      expect(screen.getByText(/custom error message/i)).toBeInTheDocument();
    });
  });

  it('error banner can be dismissed', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<App />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form'));
    
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    const dismissButton = screen.getByText('×');
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
    });
  });

  it('error is cleared when sending a new message', async () => {
    global.fetch
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { answer: 'Success', source: 'openai' }
        })
      });

    render(<App />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    
    // First message fails
    fireEvent.change(input, { target: { value: 'First message' } });
    fireEvent.submit(input.closest('form'));
    
    await waitFor(() => {
      expect(screen.getByText(/first error/i)).toBeInTheDocument();
    });

    // Second message succeeds and clears error
    fireEvent.change(input, { target: { value: 'Second message' } });
    fireEvent.submit(input.closest('form'));
    
    await waitFor(() => {
      expect(screen.queryByText(/first error/i)).not.toBeInTheDocument();
    });
  });

  it('displays error banner with correct styling', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Test error'));

    render(<App />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form'));
    
    await waitFor(() => {
      const errorBanner = document.querySelector('.error-banner');
      expect(errorBanner).toBeInTheDocument();
      expect(errorBanner).toHaveClass('animate-fade-in');
    });
  });
});

