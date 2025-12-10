import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Quick Questions Feature', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('displays quick questions section on initial load', () => {
    render(<App />);
    
    expect(screen.getByText('Try asking:')).toBeInTheDocument();
  });

  it('displays all sample questions', () => {
    render(<App />);
    
    expect(screen.getByText('What does EVA do?')).toBeInTheDocument();
    expect(screen.getByText('Tell me about CAM')).toBeInTheDocument();
    expect(screen.getByText('How does PHIL work?')).toBeInTheDocument();
    expect(screen.getByText('What are the benefits?')).toBeInTheDocument();
  });

  it('quick questions are clickable buttons', () => {
    render(<App />);
    
    const evaButton = screen.getByText('What does EVA do?');
    expect(evaButton.tagName).toBe('BUTTON');
    expect(evaButton).toHaveClass('quick-question-btn');
  });

  it('clicking quick question sends the message', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          answer: 'EVA automates eligibility verification',
          source: 'predefined',
          confidence: 0.8
        }
      })
    });

    render(<App />);
    
    const evaButton = screen.getByText('What does EVA do?');
    fireEvent.click(evaButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('What does EVA do?')
        })
      );
    });
  });

  it('quick questions are disabled while loading', async () => {
    let resolvePromise;
    global.fetch.mockReturnValueOnce(
      new Promise(resolve => {
        resolvePromise = resolve;
      })
    );

    render(<App />);
    
    const evaButton = screen.getByText('What does EVA do?');
    fireEvent.click(evaButton);

    await waitFor(() => {
      const allButtons = screen.getAllByRole('button');
      const quickButtons = allButtons.filter(btn => btn.classList.contains('quick-question-btn'));
      quickButtons.forEach(btn => {
        expect(btn).toBeDisabled();
      });
    });

    // Clean up
    resolvePromise({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { answer: 'Response', source: 'predefined' }
      })
    });
  });
});

