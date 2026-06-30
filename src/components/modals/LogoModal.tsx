import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../store/GameContext';
import { salvarLogoDB } from '../../utils/storage';
export function LogoModal({isOpen,onClose}:{isOpen:boolean;onClose:()=>void}){
  const {state,showNotification}=useGame();
  const [selectedTime,setSelectedTime]=useState('');
  const [preview,setPreview]=useState<string|null>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{if(isOpen&&state.game.state){const t=Object.keys(state.game.state.times).sort();setSelectedTime(t[0]||'');setPreview(null);}},[isOpen,state.game.state]);
  if(!isOpen||!state.game.state)return null;
  const times=Object.keys(state.game.state.times).sort();
  function handleFile(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return;
    if(file.size>5*1024*1024){showNotification('Imagem muito grande! Max 5MB.','error');return;}
    const reader=new FileReader();reader.onload=evt=>setPreview(evt.target?.result as string);reader.readAsDataURL(file);
  }
  async function handleUpload(){
    if(!preview){showNotification('Selecione uma imagem primeiro!','error');return;}
    if(!selectedTime){showNotification('Selecione um time!','error');return;}
    if(await salvarLogoDB(selectedTime,preview)){showNotification('Logo do '+selectedTime+' atualizada!','success');onClose();}
    else showNotification('Erro ao salvar logo.','error');
  }
  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" style={{maxWidth:450}} onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button><h3>🖼️ Logo do Time</h3>
        <p style={{fontSize:'0.8rem',color:'var(--text-dim)',marginBottom:8}}>Selecione um time e uma imagem.</p>
        <select value={selectedTime} onChange={e=>setSelectedTime(e.target.value)} style={{width:'100%',background:'var(--bg-table)',border:'1px solid var(--border)',color:'var(--text)',padding:'5px 8px',borderRadius:4,fontSize:'0.8rem',marginBottom:8}}>
          {times.map(n=><option key={n} value={n}>{n}</option>)}
        </select>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{fontSize:'0.8rem',marginBottom:8,width:'100%'}}/>
        {preview&&<div style={{textAlign:'center',marginBottom:8}}><img src={preview} style={{maxWidth:120,maxHeight:120,borderRadius:'50%',border:'2px solid var(--accent)'}}/></div>}
        <button className="btn-primary" onClick={handleUpload} style={{width:'100%'}}>Enviar Logo</button>
      </div>
    </div>
  );
}
