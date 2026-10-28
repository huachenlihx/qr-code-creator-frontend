'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { CalendarDays, ContactRound, Download, Eraser, ExternalLink, Link2, MessageSquareText, QrCode, Smartphone, Wifi } from 'lucide-react';
import AntiBotVerification, { AntiBotHandle } from './AntiBotVerification';
import HelpModal from './HelpModal';
import CoffeeCard from './CoffeeCard';
import ContactModal from './ContactModal';
import { api } from '@/lib/api';
import { downloadBlob, filenameFromDisposition, validateZipResponse } from '@/lib/download';

type QRType='url'|'plain_text'|'wifi'|'vcard'|'calendar'|'app_action';
const types=[
  {id:'url' as QRType,label:'URL',desc:'Website or web page',icon:Link2},
  {id:'plain_text' as QRType,label:'Plain Text',desc:'Message, code or serial number',icon:MessageSquareText},
  {id:'wifi' as QRType,label:'Wi-Fi',desc:'Network name and password',icon:Wifi},
  {id:'vcard' as QRType,label:'Contact Card',desc:'vCard contact details',icon:ContactRound},
  {id:'calendar' as QRType,label:'Calendar Event',desc:'Appointment or meeting',icon:CalendarDays},
  {id:'app_action' as QRType,label:'App Action',desc:'Call, SMS, email or deep link',icon:Smartphone},
];

const initial={url:'',text:'',ssid:'',security:'WPA',password:'',hidden:false,full_name:'',organization:'',title:'',phone:'',email:'',contact_url:'',address:'',note:'',event_title:'',start:'',end:'',location:'',description:'',action:'phone',action_phone:'',action_email:'',subject:'',message:'',uri:''};

export default function QRCodeCreator(){
  const [type,setType]=useState<QRType>('url'); const [form,setForm]=useState({...initial}); const [outputName,setOutputName]=useState(''); const [quality,setQuality]=useState('full'); const [antiReady,setAntiReady]=useState(false); const antiRef=useRef<AntiBotHandle>(null); const [busy,setBusy]=useState(false); const [status,setStatus]=useState(''); const [error,setError]=useState('');
  const [paymentNotice,setPaymentNotice]=useState<{kind:'success'|'cancelled';text:string}|null>(null);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const coffee=params.get('coffee');

    if(coffee==='success'){
      setPaymentNotice({
        kind:'success',
        text:'Thank you! Your support payment was successful.',
      });
    }else if(coffee==='cancelled'){
      setPaymentNotice({
        kind:'cancelled',
        text:'Stripe Checkout was cancelled. No support payment was completed.',
      });
    }else{
      return;
    }

    // Remove Stripe return parameters from the address bar so the notice
    // does not reappear on refresh or a later visit.
    const cleanUrl=new URL(window.location.href);
    cleanUrl.searchParams.delete('coffee');
    cleanUrl.searchParams.delete('session_id');
    window.history.replaceState(
      {},
      '',
      `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`,
    );

    const timer=window.setTimeout(()=>setPaymentNotice(null),10000);
    return ()=>window.clearTimeout(timer);
  },[]);
  const active=types.find(x=>x.id===type)!;
  const canSubmit=useMemo(()=>{ if(busy||!antiReady)return false; if(type==='url')return Boolean(form.url.trim()); if(type==='plain_text')return Boolean(form.text.trim()); if(type==='wifi')return Boolean(form.ssid.trim()&&(form.security==='NOPASS'||form.password)); if(type==='vcard')return Boolean(form.full_name.trim()); if(type==='calendar')return Boolean(form.event_title.trim()&&form.start&&form.end); if(type==='app_action'){if(form.action==='phone'||form.action==='sms')return Boolean(form.action_phone.trim());if(form.action==='email')return Boolean(form.action_email.trim());return Boolean(form.uri.trim());} return false;},[antiReady,busy,form,type]);
  function update(name:string,value:string|boolean){setForm(p=>({...p,[name]:value}));setError('');setStatus('');}
  function payload(){switch(type){case'url':return{url:form.url};case'plain_text':return{text:form.text};case'wifi':return{ssid:form.ssid,security:form.security,password:form.password,hidden:form.hidden};case'vcard':return{full_name:form.full_name,organization:form.organization,title:form.title,phone:form.phone,email:form.email,url:form.contact_url,address:form.address,note:form.note};case'calendar':return{title:form.event_title,start:form.start,end:form.end,location:form.location,description:form.description};case'app_action':if(form.action==='phone')return{action:'phone',phone:form.action_phone};if(form.action==='sms')return{action:'sms',phone:form.action_phone,message:form.message};if(form.action==='email')return{action:'email',email:form.action_email,subject:form.subject,message:form.message};return{action:'app_uri',uri:form.uri};}}
  async function submit(e:React.FormEvent){e.preventDefault();const anti=antiRef.current?.getPayload();if(!anti){setError('Please complete human verification.');return;}setBusy(true);setError('');setStatus('Creating your ZIP package…');try{const response=await api.post('/api/qr/create-package/',{qr_type:type,payload:payload(),output_name:outputName,quality,export_all:true,source_site:'qrcode',anti_bot:anti},{responseType:'blob',timeout:180000});const rawContentType=response.headers['content-type'];const contentType=typeof rawContentType==='string'?rawContentType:undefined;await validateZipResponse(response.data, response.status, contentType);const filename=filenameFromDisposition(response.headers['content-disposition'])||'qr_code_complete_package.zip';downloadBlob(response.data,filename);setStatus(`Created and downloaded ${filename}.`);await antiRef.current?.reset();}catch(err){let msg='QR code creation failed. Please review the form and try again.';if(axios.isAxiosError(err)&&err.response?.data instanceof Blob){try{const text=await err.response.data.text();const data=JSON.parse(text);msg=data.detail||data.payload||data.anti_bot||Object.values(data).flat().join(' ')||msg;if(typeof msg!=='string')msg=JSON.stringify(msg);}catch{}}else if(err instanceof Error){msg=err.message;}setError(msg);setStatus('');await antiRef.current?.reset();}finally{setBusy(false);}}
  function reset(){setForm({...initial});setOutputName('');setQuality('full');setError('');setStatus('');void antiRef.current?.reset();}

  return <main className="pageShell">
    <header className="siteHeader"><a href="https://founderdesigngroup.ca" className="brand" aria-label="Founder Design Group home"><span className="brandMark"><QrCode size={25}/></span><span><strong>Founder Design Group</strong><small>QR Code Creator</small></span></a><div className="headerActions"><HelpModal/><a className="homeLink" href="https://founderdesigngroup.ca">Main website <ExternalLink size={15}/></a></div></header>
    <section className="hero"><span className="eyebrow">Simple · private transport · reusable API</span><h1>Create a QR code package in seconds.</h1><p>Choose what the QR code should do, complete the form, pass human verification, and your browser downloads a ZIP generated by our Django backend.</p></section>
    {paymentNotice&&<div className={`paymentReturnNotice ${paymentNotice.kind==='success'?'success':'cancelled'}`} role="status" aria-live="polite">
      <div>
        <strong>{paymentNotice.kind==='success'?'Payment successful':'Payment cancelled'}</strong>
        <span>{paymentNotice.text}</span>
      </div>
      <button type="button" aria-label="Dismiss payment message" onClick={()=>setPaymentNotice(null)}>×</button>
    </div>}
    <div className="contentGrid"><section className="creatorCard"><div className="sectionHeading"><div><span className="stepBadge">1</span><div><h2>Choose a QR code type</h2><p>Use one request at a time; each request downloads a complete ZIP package.</p></div></div></div>
      <div className="typeGrid">{types.map(item=>{const Icon=item.icon;return <button type="button" key={item.id} className={type===item.id?'typeButton active':'typeButton'} onClick={()=>{setType(item.id);setError('');setStatus('')}}><Icon size={21}/><span><strong>{item.label}</strong><small>{item.desc}</small></span></button>})}</div>
      <form onSubmit={submit} className="creatorForm"><div className="sectionHeading compact"><div><span className="stepBadge">2</span><div><h2>{active.label} details</h2><p>Fields marked * are required.</p></div></div></div>
        {type==='url'&&<Field label="Website URL *"><input type="url" placeholder="https://example.com" value={form.url} onChange={e=>update('url',e.target.value)} required/></Field>}
        {type==='plain_text'&&<Field label="Plain text *"><textarea rows={6} maxLength={4000} placeholder="Enter a message, coupon code, serial number, or other text." value={form.text} onChange={e=>update('text',e.target.value)} required/><span className="counter">{form.text.length}/4000</span></Field>}
        {type==='wifi'&&<div className="fieldGrid"><Field label="Network name (SSID) *"><input value={form.ssid} onChange={e=>update('ssid',e.target.value)}/></Field><Field label="Security"><select value={form.security} onChange={e=>update('security',e.target.value)}><option value="WPA">WPA/WPA2/WPA3</option><option value="WEP">WEP</option><option value="NOPASS">No password</option></select></Field>{form.security!=='NOPASS'&&<Field label="Wi-Fi password *"><input type="password" value={form.password} onChange={e=>update('password',e.target.value)}/></Field>}<label className="checkboxField"><input type="checkbox" checked={form.hidden} onChange={e=>update('hidden',e.target.checked)}/><span>Hidden network</span></label></div>}
        {type==='vcard'&&<div className="fieldGrid"><Field label="Full name *"><input value={form.full_name} onChange={e=>update('full_name',e.target.value)}/></Field><Field label="Organization"><input value={form.organization} onChange={e=>update('organization',e.target.value)}/></Field><Field label="Job title"><input value={form.title} onChange={e=>update('title',e.target.value)}/></Field><Field label="Phone"><input value={form.phone} onChange={e=>update('phone',e.target.value)}/></Field><Field label="Email"><input type="email" value={form.email} onChange={e=>update('email',e.target.value)}/></Field><Field label="Website"><input type="url" value={form.contact_url} onChange={e=>update('contact_url',e.target.value)}/></Field><Field label="Address" wide><input value={form.address} onChange={e=>update('address',e.target.value)}/></Field><Field label="Note" wide><textarea rows={3} value={form.note} onChange={e=>update('note',e.target.value)}/></Field></div>}
        {type==='calendar'&&<div className="fieldGrid"><Field label="Event title *" wide><input value={form.event_title} onChange={e=>update('event_title',e.target.value)}/></Field><Field label="Start *"><input type="datetime-local" value={form.start} onChange={e=>update('start',e.target.value)}/></Field><Field label="End *"><input type="datetime-local" value={form.end} onChange={e=>update('end',e.target.value)}/></Field><Field label="Location" wide><input value={form.location} onChange={e=>update('location',e.target.value)}/></Field><Field label="Description" wide><textarea rows={4} value={form.description} onChange={e=>update('description',e.target.value)}/></Field></div>}
        {type==='app_action'&&<><Field label="Action *"><select value={form.action} onChange={e=>update('action',e.target.value)}><option value="phone">Phone call</option><option value="sms">Pre-written text message (SMS)</option><option value="email">Pre-written email</option><option value="app_uri">App / deep-link URI</option></select></Field>{(form.action==='phone'||form.action==='sms')&&<Field label="Phone number *"><input placeholder="+1 519 555 0123" value={form.action_phone} onChange={e=>update('action_phone',e.target.value)}/></Field>}{form.action==='sms'&&<Field label="Message"><textarea rows={4} value={form.message} onChange={e=>update('message',e.target.value)}/></Field>}{form.action==='email'&&<div className="fieldGrid"><Field label="Email address *"><input type="email" value={form.action_email} onChange={e=>update('action_email',e.target.value)}/></Field><Field label="Subject"><input value={form.subject} onChange={e=>update('subject',e.target.value)}/></Field><Field label="Message" wide><textarea rows={4} value={form.message} onChange={e=>update('message',e.target.value)}/></Field></div>}{form.action==='app_uri'&&<Field label="App / deep-link URI *"><input placeholder="myapp://open/item/123" value={form.uri} onChange={e=>update('uri',e.target.value)}/></Field>}</>}
        <div className="packageOptions"><div className="sectionHeading compact"><div><span className="stepBadge">3</span><div><h2>Package options</h2><p>Full is recommended when you want both web and print assets.</p></div></div></div><div className="fieldGrid"><Field label="ZIP / folder name (optional)"><input placeholder="my_qr_code" value={outputName} maxLength={100} onChange={e=>setOutputName(e.target.value)}/></Field><Field label="Quality profile"><select value={quality} onChange={e=>setQuality(e.target.value)}><option value="full">Full — web + print</option><option value="web">Web — smaller ZIP</option><option value="print">Print — high resolution</option></select></Field></div></div>
        <div className="privacyNotice"><ShieldIcon/><p><strong>Abuse-prevention logging:</strong> your submitted QR data and IP address are stored by the backend. Submitted data is encrypted at rest. Wi-Fi QR codes contain the password you provide, so only create them for networks you are authorized to share.</p></div>
        <AntiBotVerification ref={antiRef} idPrefix="qr" onReadyChange={setAntiReady}/>
        {error&&<div className="alert error">{error}</div>}{status&&<div className="alert success">{status}</div>}
        <div className="formActions"><button type="button" className="cancelButton" onClick={reset} disabled={busy}><Eraser size={18}/>Cancel / Clear</button><button type="submit" className="submitButton" disabled={!canSubmit}><Download size={18}/>{busy?'Creating ZIP…':'Create & Download ZIP'}</button></div>
      </form></section>
      <div className="sideColumn"><section className="packageCard howItWorksCard"><h2>How it works</h2><ol><li>Choose your QR code type.</li><li>Enter the information you want to encode.</li><li>Select your output options.</li><li>Complete human verification.</li><li>Download your QR code package.</li></ol><p className="noRegistration">No registration is required.</p></section><section className="packageCard"><span className="eyebrow">What you receive</span><h2>One ZIP, multiple ready-to-use formats</h2><ul><li>PNG sizes for web and/or print</li><li>Scalable SVG master</li><li>Print-ready PDF files</li><li>Website, flyer, poster, card, sticker, table-tent and social assets</li><li>Metadata and usage notes</li></ul><p>The QR matrix is generated with a standards-based QR library on the Django server.</p></section><CoffeeCard/></div>
    </div>
    <footer><span className="footerCredit">Founder Design Group QR Code Creator <span className="footerDivider">·</span> Website Development by <ContactModal/></span><a href="https://founderdesigngroup.ca">founderdesigngroup.ca</a></footer>
  </main>;
}

function Field({label,children,wide=false}:{label:string;children:React.ReactNode;wide?:boolean}){return <label className={wide?'field wide':'field'}><span>{label}</span>{children}</label>}
function ShieldIcon(){return <span className="privacyIcon">i</span>}
