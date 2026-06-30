import { useState, useEffect, useCallback } from 'react';
import { listarSavesCombinado, exportarSaveParaArquivo } from '../../utils/storage';
import { SaveInfo } from '../../types';
import { useGame } from '../../store/GameContext';
export function ExportModal({isOpen,onClose}:{isOpen:boolean;onClose:()=>void}){
  const {state}=useGame();
  const [saves,setSaves]=useState<(SaveInfo&{isCurrent?:boolean})[]>([]);
  const refreshSaves = useCallback(async () => {
    const e = await listarSavesCombinado();
    setSaves([{nome:'autosave',data:new Date().toISOString(),ano:state.game.year,times:state.game.state?Object.keys(state.game.state.times).length:0,concluido:state.game.state?.concluido||false,key:'brsim_autosave',isCurrent:true},...e]);
  }, [state.game]);
  useEffect(()=>{if(isOpen) refreshSaves();},[isOpen, refreshSaves]);
  if(!isOpen)return null;
  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" style={{maxWidth:450}} onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button><h3>📤 Exportar Save</h3>
        <p style={{fontSize:'0.8rem',color:'var(--text-dim)',marginBottom:8}}>Exportar como .json</p>
        <div style={{maxHeight:300,overflowY:'auto'}}>
          {saves.map(s=>(
            <div key={s.nome} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 8px',borderBottom:'1px solid var(--border)',fontSize:'0.8rem'}}>
              <div><strong>{s.nome}</strong>{s.isCurrent&&<span style={{color:'var(--accent)',fontSize:'0.65rem',marginLeft:4}}>(atual)</span>}<br/><span style={{color:'var(--text-dim)',fontSize:'0.75rem'}}>Ano {s.ano}</span></div>
              <button className="btn-small" onClick={()=>exportarSaveParaArquivo(s.nome,state.game)}>📤 Exportar</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
