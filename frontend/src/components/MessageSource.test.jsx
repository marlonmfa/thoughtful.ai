import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Message Source Indicator', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  it('shows Knowledge Base badge for predefined responses', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          answer: 'EVA automates eligibility verification',
          source: 'predefined',
          confidence: 0.9
        }
      })
    });

    render(<App />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    fireEvent.change(input, { target: { value: 'What is EVA?' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByText('📚 Knowledge Base')).toBeInTheDocument();
    });
  });

  it('shows AI Generated badge for OpenAI responses', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          answer: 'AI generated response',
          source: 'openai',
          confidence: null
        }
      })
    });

    render(<App />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    fireEvent.change(input, { target: { value: 'What is the weather?' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByText('🤖 AI Generated')).toBeInTheDocument();
    });
  });

  it('does not show source badge for system welcome message', () => {
    render(<App />);
    
    // The welcome message should not have a source badge
    expect(screen.queryByText('📚 Knowledge Base')).not.toBeInTheDocument();
    expect(screen.queryByText('🤖 AI Generated')).not.toBeInTheDocument();
  });

  it('source badge has correct CSS class', async () => {
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
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      const sourceBadge = document.querySelector('.message-source');
      expect(sourceBadge).toBeInTheDocument();
      expect(sourceBadge).toHaveClass('predefined');
    });
  });

  it('user messages do not have source badges', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          answer: 'Response',
          source: 'openai'
        }
      })
    });

    render(<App />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    fireEvent.change(input, { target: { value: 'User message' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      const userMessages = document.querySelectorAll('.message.user');
      userMessages.forEach(msg => {
        expect(msg.querySelector('.message-source')).toBeNull();
      });
    });
  });
});

