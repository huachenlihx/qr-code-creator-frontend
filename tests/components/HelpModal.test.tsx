// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import HelpModal from '../../components/HelpModal';

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    text: async () => '# How to create a QR code',
  }));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  globalThis.fetch = originalFetch;
});

describe('HelpModal', () => {
  it('starts closed and opens from the Instructions button', async () => {
    render(<HelpModal />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /instructions/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'How to create a QR code' })).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith('/help/qr_code_creator_help.md');
  });

  it('shows an error message if help Markdown cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<HelpModal />);
    fireEvent.click(screen.getByRole('button', { name: /instructions/i }));
    expect(await screen.findByText('Help content could not be loaded.')).toBeInTheDocument();
  });

  it('closes with the close button', () => {
    render(<HelpModal />);
    fireEvent.click(screen.getByRole('button', { name: /instructions/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes when Escape is pressed', () => {
    render(<HelpModal />);
    fireEvent.click(screen.getByRole('button', { name: /instructions/i }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('allows keyboard focus on the scrollable instructions region', async () => {
    render(<HelpModal />);
    fireEvent.click(screen.getByRole('button', { name: /instructions/i }));

    const content = await screen.findByRole('region', {
      name: 'QR Code Creator instructions content',
    });

    expect(content).toHaveAttribute('tabindex', '0');
    content.focus();
    expect(content).toHaveFocus();
  });

  it('closes on backdrop click, not on an inside click', async () => {
    render(<HelpModal />);
    fireEvent.click(screen.getByRole('button', { name: /instructions/i }));
    const modal = screen.getByRole('dialog');
    fireEvent.mouseDown(modal);
    expect(modal).toBeInTheDocument();
    const backdrop = modal.parentElement;
    expect(backdrop).not.toBeNull();
    fireEvent.mouseDown(backdrop!);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
