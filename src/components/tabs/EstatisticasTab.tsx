import { useGame } from '../../store/GameContext';
import { getEstatisticas } from '../../utils/gameLogic';
import './EstatisticasTab.css';
export function EstatisticasTab() {
  const {state,dispatch}=useGame();
  const s=state.game.state;
  if(!s)return null;
  const est=getEstatisticas(s);
  const subTab=state.estatSubTab;
  return (
    <section className="tab-content active">
      <div className="tab-header"><h2>Estatísticas</h2>
        <div className="estat-nav">
          <button className={'btn-small estat-btn'+(subTab==='artilharia'?' active':'')} onClick={()=>dispatch({type:'SET_ESTAT_SUBTAB',payload:'artilharia'})}>Artilharia</button>
          <button className={'btn-small estat-btn'+(subTab==='assistencias'?' active':'')} onClick={()=>dispatch({type:'SET_ESTAT_SUBTAB',payload:'assistencias'})}>Assistências</button>
        </div>
      </div>
      <div id="estat-content">
        {subTab==='artilharia'?(
          <table><thead><tr><th>#</th><th>Jogador</th><th>Time</th><th>Gols</th></tr></thead>
          <tbody>{est.artilheiros.length===0?<tr><td colSpan={4} style={{padding:16,color:'var(--text-dim)'}}>Nenhum gol marcado</td></tr>:est.artilheiros.slice(0,20).map((j,i)=><tr key={'art-'+i}><td>{i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</td><td>{j.nome}</td><td>{j.time}</td><td><strong>{j.gols}</strong></td></tr>)}</tbody>
          </table>
        ):(
          <table><thead><tr><th>#</th><th>Jogador</th><th>Time</th><th>Assist.</th></tr></thead>
          <tbody>{est.assistencias.length===0?<tr><td colSpan={4} style={{padding:16,color:'var(--text-dim)'}}>Nenhuma assistência</td></tr>:est.assistencias.slice(0,20).map((j,i)=><tr key={'ass-'+i}><td>{i+1}</td><td>{j.nome}</td><td>{j.time}</td><td><strong>{j.assists}</strong></td></tr>)}</tbody>
          </table>
        )}
      </div>
    </section>
  );
}
