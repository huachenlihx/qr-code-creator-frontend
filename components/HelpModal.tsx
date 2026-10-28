'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function HelpModal() {
  const [open, setOpen] = useState(false); const [markdown, setMarkdown] = useState('');
  useEffect(() => { if (!open || markdown) return; fetch('/help/qr_code_creator_help.md').then(r=>r.text()).then(setMarkdown).catch(()=>setMarkdown('# Help\nHelp content could not be loaded.')); }, [open, markdown]);
  useEffect(() => { if (!open) return; const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)}; document.addEventListener('keydown',onKey); return()=>document.removeEventListener('keydown',onKey); },[open]);
  return <><button type="button" className="secondaryButton" onClick={()=>setOpen(true)}><CircleHelp size={18}/> Instructions</button>{open && createPortal(<div className="modalBackdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="help-title"><header className="modalHeader"><div><span className="eyebrow">How to use</span><h2 id="help-title">QR Code Creator Instructions</h2></div><button className="iconButton" onClick={()=>setOpen(false)} aria-label="Close"><X/></button></header><div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown || 'Loading…'}</ReactMarkdown></div></section></div>, document.body)}</>;
}
