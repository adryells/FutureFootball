import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../store/GameContext';
import { salvarSave, deletarSave, listarSavesCombinado } from '../../utils/storage';
import { SaveInfo } from '../../types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'saved-fallback' | 'error';

export function SaveModal({isOpen,onClose}:{isOpen:boolean;onClose:()=>void}){
  const {state,showNotification}=useGame();
  const [saveName,setSaveName]=useState('');
  const [saves,setSaves]=useState<SaveInfo[]>([]);
  const [status, setStatus] = useState<SaveStatus>('idle');

  const refreshSaves = useCallback(async () => {
    const lista = await listarSavesCombinado();
    setSaves(lista);
  }, []);

  useEffect(()=>{
    if(isOpen){
      refreshSaves();
      setSaveName('');
      setStatus('idle');
    }
  },[isOpen, refreshSaves]);

  if(!isOpen)return null;

  async function handleSave(){
    if(!saveName.trim()){
      showNotification('Digite um nome!','error');
      return;
    }
    setStatus('saving');

    const result = salvarSave(saveName, state.game);

    if (result.fallback) {
      // Salvando no IndexedDB async - esperar confirmacao
      showNotification('💾 localStorage cheio! Salvando no banco de dados...','info');
      const dbOk = await result.dbPromise;
      if (dbOk) {
        await refreshSaves();
        setStatus('saved-fallback');
        showNotification('✅ Salvo "'+saveName+'" no banco de dados!','success');
      } else {
        setStatus('error');
        showNotification('❌ Erro: não foi possível salvar (localStorage e DB cheios)!','error');
      }
    } else {
      // Salvou no localStorage normal
      await refreshSaves();
      setStatus('saved');
      showNotification('✅ Salvo como "'+saveName+'"!','success');
    }
  }

  async function handleDelete(nome: string) {
    deletarSave(nome);
    await refreshSaves();
  }

  const statusMsg = status === 'saving' ? 'Salvando...' :
    status === 'saved' ? '✔ Salvo!' :
    status === 'saved-fallback' ? '✔ Salvo (DB)' :
    status === 'error' ? '✖ Erro' : '';

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" style={{maxWidth:500}} onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3>💾 Salvar Jogo</h3>
        <div style={{marginBottom:12}}>
          <label style={{display:'block',marginBottom:4,fontSize:'0.8rem',color:'var(--text-dim)'}}>Nome:</label>
          <div style={{display:'flex',gap:6}}>
            <input
              type="text"
              style={{flex:1,background:'var(--bg)',border:'1px solid var(--border)',borderRadius:4,padding:'6px 8px',color:'var(--text)',fontSize:'0.85rem'}}
              placeholder="Meu save..."
              value={saveName}
              onChange={e=>setSaveName(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleSave()}
              disabled={status === 'saving'}
            />
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={status === 'saving'}
              style={status === 'saving' ? {opacity:0.6,cursor:'wait'} : {}}
            >
              {status === 'saving' ? '⏳' : 'Salvar'}
            </button>
          </div>
          {status !== 'idle' && (
            <div style={{
              marginTop: 6,
              fontSize: '0.75rem',
              padding: '4px 8px',
              borderRadius: 4,
              background: status === 'error' ? 'rgba(239,68,68,0.15)' :
                          status === 'saving' ? 'rgba(234,179,8,0.15)' :
                          'rgba(34,197,94,0.15)',
              color: status === 'error' ? '#ef4444' :
                     status === 'saving' ? '#eab308' :
                     '#22c55e',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              {status === 'saving' && <span className="save-spinner" />}
              <span>{statusMsg}</span>
              {status === 'saved-fallback' && (
                <span style={{fontSize:'0.7rem',opacity:0.7,marginLeft:4}}>
                  (usando IndexedDB - maior capacidade)
                </span>
              )}
            </div>
          )}
        </div>
        <div>
          <h4 style={{fontSize:'0.8rem',color:'var(--text-dim)',marginBottom:6}}>Saves existentes:</h4>
          {saves.length===0?(
            <div style={{padding:8,color:'var(--text-dim)',fontSize:'0.8rem'}}>Nenhum save.</div>
          ):saves.filter(s=>s.nome!=='autosave').map(s=>(
            <div key={s.key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 8px',borderBottom:'1px solid var(--border)',fontSize:'0.8rem'}}>
              <div>
                <strong>{s.nome}</strong>
                {s.origemDB && <span style={{marginLeft:4,fontSize:'0.6rem',padding:'1px 4px',borderRadius:3,background:'rgba(255,255,255,0.08)',color:'var(--text-dim)'}}>DB</span>}
                <br/>
                <span style={{color:'var(--text-dim)',fontSize:'0.75rem'}}>
                  {s.data!=='desconhecido'?new Date(s.data).toLocaleString('pt-BR'):'desconhecido'} - Ano {s.ano}
                </span>
              </div>
              <button className="btn-small" style={{background:'var(--red)',color:'#fff'}} onClick={()=>handleDelete(s.nome)}>Del</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
