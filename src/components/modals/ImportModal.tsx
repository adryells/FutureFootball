import { useState, useRef } from 'react';
import { importarSaveDoArquivo, importarSave } from '../../utils/storage';
import { useGame } from '../../store/GameContext';
export function ImportModal({isOpen,onClose}:{isOpen:boolean;onClose:()=>void}){
  const {loadGame,showNotification}=useGame();
  const [nomeSave,setNomeSave]=useState('');
  const [status,setStatus]=useState('');
  const fileRef=useRef<HTMLInputElement>(null);
  if(!isOpen)return null;
  function reset(){if(fileRef.current)fileRef.current.value='';setNomeSave('');setStatus('');}
  async function handleImport(){
    const file=fileRef.current?.files?.[0];if(!file){setStatus('Selecione um arquivo!');return;}
    if(!nomeSave.trim()){setStatus('Digite um nome para o save!');return;}
    setStatus('Importando...');
    try{const data=await importarSaveDoArquivo(file);if(importarSave(data,nomeSave.trim())){setStatus('Salvo importado!');showNotification('Save importado!','success');if(confirm('Carregar agora?')){loadGame(nomeSave.trim())}onClose();reset();}else setStatus('Erro!');}
    catch(err){setStatus(String(err));}
  }
  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" style={{maxWidth:450}} onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button><h3>📥 Importar Save</h3>
        <input ref={fileRef} type="file" accept=".json" style={{fontSize:'0.8rem',marginBottom:8,width:'100%'}}/>
        <div style={{display:'flex',gap:6}}>
          <input type="text" style={{flex:1,background:'var(--bg)',border:'1px solid var(--border)',borderRadius:4,padding:'6px 8px',color:'var(--text)',fontSize:'0.85rem'}} placeholder="Nome do save..." value={nomeSave} onChange={e=>setNomeSave(e.target.value)}/>
          <button className="btn-primary" onClick={handleImport}>Importar</button>
        </div>
        {status&&<div style={{marginTop:6,fontSize:'0.75rem',color:status.includes('sucesso')?'var(--accent)':'var(--red)'}}>{status}</div>}
      </div>
    </div>
  );
}
