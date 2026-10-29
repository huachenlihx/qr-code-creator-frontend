'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function HelpModal() {
  const [open, setOpen] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const dialogRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || markdown) return;

    fetch('/help/qr_code_creator_help.md')
      .then((response) => response.text())
      .then(setMarkdown)
      .catch(() => setMarkdown('# Help\nHelp content could not be loaded.'));
  }, [open, markdown]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
      if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!focusable?.length) { event.preventDefault(); dialogRef.current?.focus(); return; }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = previousOverflow; triggerRef.current?.focus(); };
  }, [open]);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="secondaryButton"
        onClick={() => setOpen(true)}
      >
        <CircleHelp size={18} />
        Instructions
      </button>

      {open &&
        createPortal(
          <div
            className="modalBackdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <section
              ref={dialogRef}
              tabIndex={-1}
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="help-title"
            >
              <header className="modalHeader">
                <div>
                  <span className="eyebrow">How to use</span>
                  <h2 id="help-title">QR Code Creator Instructions</h2>
                </div>
                <button
                  type="button"
                  className="iconButton"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X />
                </button>
              </header>

              <div className="markdown" aria-live="polite">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdown || 'Loading…'}
                </ReactMarkdown>
              </div>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}
