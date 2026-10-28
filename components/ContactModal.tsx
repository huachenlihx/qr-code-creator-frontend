'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Eraser, Paperclip, Send, X } from 'lucide-react';

import AntiBotVerification, { AntiBotHandle } from './AntiBotVerification';
import { api } from '@/lib/api';

type CategoryOption = { value: string; label: string };

type ContactForm = {
  sender_name: string;
  sender_email: string;
  category: string;
  subject: string;
  message: string;
};

const INITIAL_FORM: ContactForm = {
  sender_name: '',
  sender_email: '',
  category: '',
  subject: '',
  message: '',
};

const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.heic,.pdf,.txt,.doc,.docx,.xls,.xlsx,.zip';

export default function ContactModal() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ContactForm>(INITIAL_FORM);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [antiReady, setAntiReady] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const antiRef = useRef<AntiBotHandle>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, busy]);

  useEffect(() => {
    if (!status || busy) return;

    const timer = window.setTimeout(() => {
      setStatus('');
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [status, busy]);

  useEffect(() => {
    if (!open || categories.length) return;
    setCategoriesLoading(true);
    api.get<CategoryOption[]>('/api/mail/categories/')
      .then(({ data }) => {
        setCategories(data);
        setForm(current => ({
          ...current,
          category: current.category || data[0]?.value || '',
        }));
      })
      .catch(() => setError('Could not load contact categories. Please try again later.'))
      .finally(() => setCategoriesLoading(false));
  }, [open, categories.length]);

  function update(name: keyof ContactForm, value: string) {
    setForm(current => ({ ...current, [name]: value }));
    setError('');
    setStatus('');
  }

  function clearForm() {
    setForm({ ...INITIAL_FORM, category: categories[0]?.value || '' });
    setFiles([]);
    if (fileRef.current) fileRef.current.value = '';
    setError('');
    setStatus('');
    void antiRef.current?.reset();
  }

  function applyFiles(selected: File[]) {
    if (selected.length > MAX_FILES) {
      setFiles([]);
      if (fileRef.current) fileRef.current.value = '';
      setError(`Please select no more than ${MAX_FILES} files.`);
      return;
    }
    const total = selected.reduce((sum, file) => sum + file.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      setFiles([]);
      if (fileRef.current) fileRef.current.value = '';
      setError('The total attachment size must be 5 MB or less.');
      return;
    }
    setFiles(selected);
    setError('');
    setStatus('');
  }

  function onFilesChange(event: ChangeEvent<HTMLInputElement>) {
    applyFiles(Array.from(event.target.files || []));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const antiBot = antiRef.current?.getPayload();
    if (!antiBot) {
      setError('Please complete human verification.');
      return;
    }

    setBusy(true);
    setError('');
    setStatus('Sending your message…');

    const body = new FormData();
    body.append('sender_name', form.sender_name.trim());
    body.append('sender_email', form.sender_email.trim());
    body.append('category', form.category);
    body.append('subject', form.subject.trim());
    body.append('message', form.message.trim());
    body.append('anti_bot', JSON.stringify(antiBot));
    files.forEach(file => body.append('attachments', file));

    try {
      const { data } = await api.post<{ message?: string }>('/api/mail/contact/', body, {
        timeout: 120000,
      });
      setStatus(data.message || 'Your message has been sent.');
      setForm({ ...INITIAL_FORM, category: categories[0]?.value || '' });
      setFiles([]);
      if (fileRef.current) fileRef.current.value = '';
      await antiRef.current?.reset();
    } catch (err) {
      let message = 'Your message could not be sent. Please review the form and try again.';
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as Record<string, unknown>;
        const candidate = data.error ?? data.detail ?? data.anti_bot ?? data.attachments;
        if (typeof candidate === 'string') message = candidate;
        else if (Array.isArray(candidate)) message = candidate.join(' ');
        else if (candidate) message = JSON.stringify(candidate);
      }
      setError(message);
      setStatus('');
      await antiRef.current?.reset();
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = Boolean(
    !busy && antiReady && form.sender_name.trim() && form.sender_email.trim() &&
    form.category && form.subject.trim() && form.message.trim()
  );

  return <>
    <button
      type="button"
      className="footerContactLink"
      onClick={() => {
        setError('');
        setStatus('');
        setOpen(true);
      }}
    >
      Hua Chen
    </button>
    {open && createPortal(
      <div className="modalBackdrop contactBackdrop" onMouseDown={event => {
        if (event.target === event.currentTarget && !busy) {
          setError('');
          setStatus('');
          setOpen(false);
        }
      }}>
        <section className="modal contactModal" role="dialog" aria-modal="true" aria-labelledby="contact-title">
          <header className="modalHeader contactModalHeader">
            <div>
              <span className="eyebrow">Website development</span>
              <h2 id="contact-title">Contact Us</h2>
              <p>Fill in the form below and we&apos;ll get back to you as soon as possible.</p>
            </div>
            <button
              type="button"
              className="iconButton"
              onClick={() => {
                setError('');
                setStatus('');
                setOpen(false);
              }}
              disabled={busy}
              aria-label="Close contact window"
            >
              <X size={20}/>
            </button>
          </header>

          <form className="contactForm" onSubmit={submit}>
            <div className="contactFieldGrid">
              <label className="contactField">
                <span>Your name <b>*</b></span>
                <input value={form.sender_name} onChange={e => update('sender_name', e.target.value)} placeholder="Full name" maxLength={200} required/>
              </label>
              <label className="contactField">
                <span>Your email address <b>*</b></span>
                <input type="email" value={form.sender_email} onChange={e => update('sender_email', e.target.value)} placeholder="you@example.com" required/>
              </label>
              <label className="contactField contactWide">
                <span>Category <b>*</b></span>
                <select value={form.category} onChange={e => update('category', e.target.value)} required disabled={categoriesLoading || !categories.length}>
                  {categoriesLoading && <option value="">Loading categories…</option>}
                  {!categoriesLoading && !categories.length && <option value="">No categories configured</option>}
                  {categories.map(category => <option key={category.value} value={category.value}>{category.label}</option>)}
                </select>
              </label>
              <label className="contactField contactWide">
                <span>Subject <b>*</b></span>
                <input value={form.subject} onChange={e => update('subject', e.target.value)} placeholder="Brief description of your enquiry" maxLength={300} required/>
              </label>
              <label className="contactField contactWide">
                <span>Message <b>*</b></span>
                <textarea value={form.message} onChange={e => update('message', e.target.value)} placeholder="Please describe your enquiry in detail…" maxLength={20000} rows={7} required/>
              </label>
            </div>

            <div className="attachmentSection">
              <div className="attachmentHeading"><strong>Attachments (optional)</strong><span>Up to 5 files · images, PDF, TXT, DOCX, XLSX, ZIP · total ≤ 5 MB</span></div>
              <label className="attachmentDrop" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); applyFiles(Array.from(event.dataTransfer.files || [])); }}>
                <Paperclip size={25}/>
                <span>{files.length ? `${files.length} file${files.length === 1 ? '' : 's'} selected` : 'Click to browse or drop files here'}</span>
                <input ref={fileRef} type="file" multiple accept={ACCEPTED_EXTENSIONS} onChange={onFilesChange}/>
              </label>
              {files.length > 0 && <div className="selectedFiles">{files.map(file => <span key={`${file.name}-${file.size}`}>{file.name}</span>)}</div>}
            </div>

            <AntiBotVerification
              ref={antiRef}
              idPrefix="contact"
              description="Required for anonymous contact messages."
              onReadyChange={setAntiReady}
            />

            {error && <div className="alert error">{error}</div>}
            {status && <div className="alert success">{status}</div>}

            <div className="contactActions">
              <button
                type="button"
                className="cancelButton"
                onClick={() => {
                  setError('');
                  setStatus('');
                  setOpen(false);
                }}
                disabled={busy}
              >
                Close window
              </button>
              <button type="button" className="cancelButton" onClick={clearForm} disabled={busy}><Eraser size={17}/>Clear form</button>
              <button type="submit" className="submitButton" disabled={!canSubmit}><Send size={17}/>{busy ? 'Sending…' : 'Send Message'}</button>
            </div>
          </form>
        </section>
      </div>,
      document.body,
    )}
  </>;
}
