import { useState, useEffect, useCallback } from 'react';
import { listarSavesCombinado } from '../../utils/storage';
import { SaveInfo } from '../../types';
import { useGame } from '../../store/GameContext';
export function LoadModal({isOpen,onClose}:{isOpen:boolean;onClose:()=>void}){
  const {loadGame}=useGame();
  const [saves,setSaves]=useState<SaveInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshSaves = useCallback(async () => {
    setLoading(true);
    const lista = await listarSavesCombinado();
    setSaves(lista);
    setLoading(false);
  }, []);

  useEffect(()=>{
    if(isOpen) refreshSaves();
  },[isOpen, refreshSaves]);

  if(!isOpen)return null;

  async function handleLoad(nome: string){
    setLoading(true);
    const ok = await loadGame(nome);
    if (ok) onClose();
    setLoading(false);
  }

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" style={{maxWidth:500}} onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3>📂 Carregar Save</h3>
        {loading && (
          <div style={{textAlign:'center',padding:'8px',fontSize:'0.8rem',color:'var(--text-dim)'}}>
            <span className="save-spinner" style={{marginRight:6}} /> Carregando lista...
          </div>
        )}
        {!loading && saves.length===0 ? (
          <div style={{padding:16,color:'var(--text-dim)',textAlign:'center'}}>Nenhum save encontrado.</div>
        ) : saves.filter(s=>s.nome!=='autosave').map(s=>(
          <div key={s.key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:8,borderBottom:'1px solid var(--border)',cursor:loading?'wait':'pointer',opacity:loading?0.5:1}} onClick={()=>!loading&&handleLoad(s.nome)}>
            <div>
              <strong>{s.nome}</strong>
              {s.origemDB && <span style={{marginLeft:4,fontSize:'0.6rem',padding:'1px 4px',borderRadius:3,background:'rgba(255,255,255,0.08)',color:'var(--text-dim)'}}>DB</span>}
              <br/>
              <span style={{color:'var(--text-dim)',fontSize:'0.75rem'}}>{s.data!=='desconhecido'?new Date(s.data).toLocaleString('pt-BR'):'desconhecido'} | Ano {s.ano}</span>
            </div>
            <div style={{color:'var(--accent)',fontSize:'1.2rem'}}>&gt;</div>
          </div>
        ))}
      </div>
    </div>
  );
}
