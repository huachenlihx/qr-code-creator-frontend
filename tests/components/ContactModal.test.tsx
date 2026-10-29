// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const { getMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}));

vi.mock('@/lib/api', () => ({ api: { get: getMock, post: postMock } }));

// Mock only the external human-verification child, not the contact form itself.
// This keeps the tests independent of the live Django server and Cloudflare.
vi.mock('../../components/AntiBotVerification', async () => {
  const { forwardRef, useEffect, useImperativeHandle } = await import('react');
  return { default: forwardRef(function FakeAntiBot({ onReadyChange }: { onReadyChange?: (ready: boolean) => void }, ref) {
    useImperativeHandle(ref, () => ({
      getPayload: () => ({ token: 'test', answer: '3', website: '', turnstile_token: '' }),
      reset: async () => undefined,
    }));
    useEffect(() => { onReadyChange?.(true); return () => onReadyChange?.(false); }, [onReadyChange]);
    return <div data-testid="mock-human-verification">Human verification test double</div>;
  }) };
});

import ContactModal from '../../components/ContactModal';

function openModal() {
  render(<ContactModal />);
  fireEvent.click(screen.getByRole('button', { name: 'Hua Chen' }));
}

async function fillForm() {
  fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'Test User' } });
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('Brief description of your enquiry'), { target: { value: 'Project inquiry' } });
  fireEvent.change(screen.getByPlaceholderText('Please describe your enquiry in detail…'), { target: { value: 'Hello!' } });
  await waitFor(() => expect(screen.getByRole('button', { name: /send message/i })).toBeEnabled());
}

beforeEach(() => {
  getMock.mockReset().mockResolvedValue({ data: [{ value: 'general', label: 'General inquiry' }] });
  postMock.mockReset().mockResolvedValue({ data: { message: 'Message received' } });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  document.body.style.overflow = '';
});

describe('ContactModal', () => {
  it('opens, loads categories, and closes with Escape', async () => {
    openModal();
    expect(screen.getByRole('dialog', { name: 'Contact Us' })).toBeInTheDocument();
    await waitFor(() => expect(getMock).toHaveBeenCalledWith('/api/mail/categories/'));
    await screen.findByRole('option', { name: 'General inquiry' });
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(document.body.style.overflow).toBe(''));
  });

  it('disables submission until required fields are filled', async () => {
    openModal();
    await screen.findByRole('option', { name: 'General inquiry' });
    const submit = screen.getByRole('button', { name: /send message/i });
    expect(submit).toBeDisabled();
    await fillForm();
    expect(submit).toBeEnabled();
  });

  it('submits FormData to the contact API and shows its confirmation', async () => {
    openModal();
    await screen.findByRole('option', { name: 'General inquiry' });
    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock.mock.calls[0][0]).toBe('/api/mail/contact/');
    const body = postMock.mock.calls[0][1] as FormData;
    expect(body.get('sender_name')).toBe('Test User');
    expect(body.get('sender_email')).toBe('test@example.com');
    expect(body.get('category')).toBe('general');
    expect(body.get('anti_bot')).toContain('"token":"test"');
    expect(await screen.findByText('Message received')).toBeInTheDocument();
  });

  it('displays an error when contact category loading fails', async () => {
    getMock.mockRejectedValueOnce(new Error('offline'));
    openModal();
    expect(await screen.findByText('Could not load contact categories. Please try again later.')).toBeInTheDocument();
  });

  it('displays a generic message when submission fails', async () => {
    postMock.mockRejectedValueOnce(new Error('offline'));
    openModal();
    await screen.findByRole('option', { name: 'General inquiry' });
    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));
    expect(await screen.findByText('Your message could not be sent. Please review the form and try again.')).toBeInTheDocument();
  });

  it('rejects more than five attachments', async () => {
    openModal();
    await screen.findByRole('option', { name: 'General inquiry' });
    const upload = document.querySelector('input[type="file"]') as HTMLInputElement;
    const files = Array.from({ length: 6 }, (_, index) => new File(['x'], `file-${index}.txt`, { type: 'text/plain' }));
    fireEvent.change(upload, { target: { files } });
    expect(await screen.findByText('Please select no more than 5 files.')).toBeInTheDocument();
  });

  it('rejects attachments exceeding 5 MB in total', async () => {
    openModal();
    await screen.findByRole('option', { name: 'General inquiry' });
    const upload = document.querySelector('input[type="file"]') as HTMLInputElement;
    const bigFile = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.bin');
    fireEvent.change(upload, { target: { files: [bigFile] } });
    expect(await screen.findByText('The total attachment size must be 5 MB or less.')).toBeInTheDocument();
  });

  it('clears typed fields when Clear form is clicked', async () => {
    openModal();
    await screen.findByRole('option', { name: 'General inquiry' });
    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: /clear form/i }));
    expect(screen.getByPlaceholderText('Full name')).toHaveValue('');
    expect(screen.getByPlaceholderText('you@example.com')).toHaveValue('');
  });

  it('closes when the Close window button is clicked', () => {
    openModal();
    fireEvent.click(screen.getByRole('button', { name: 'Close window' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
