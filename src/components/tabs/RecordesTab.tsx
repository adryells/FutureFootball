import { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../store/GameContext';
import { CAMPEOES_HISTORICOS, getTimeColors } from '../../data/initialData';
import { 
  getCampeoesJogo, getBolaDeOuroHistorico, 
  getSelecoesHistorico,
  calcularRankingBolaDeOuro, calcularGoatIndex 
} from '../../utils/gameLogic';
import { carregarEstatisticasGlobais } from '../../utils/storage';
import { TimeLogo } from '../common/TimeLogo';
import { SelecaoEntry, BolaDeOuroHistorico, SelecaoHistorico, BdoRankingEntry, GoatRankingEntry, EstatisticasTemporada } from '../../types';
import './RecordesTab.css';

export function RecordesTab() {
  const {state,dispatch}=useGame();
  const mainTab=state.recordesMainTab;
  const subTab=state.recordesSubTab;
  return (
    <section className="tab-content active">
      <div className="tab-header"><h2>🏆 Recordes</h2>
        <div className="recordes-nav">
          <button className={'btn-small recordes-btn'+(mainTab==='campeoes'?' active':'')} onClick={()=>dispatch({type:'SET_RECORDES_MAIN_TAB',payload:'campeoes'})}>Campeões</button>
          <button className={'btn-small recordes-btn'+(mainTab==='bolaDeOuro'?' active':'')} onClick={()=>dispatch({type:'SET_RECORDES_MAIN_TAB',payload:'bolaDeOuro'})}>Bola de Ouro</button>
          <button className={'btn-small recordes-btn'+(mainTab==='selecaoAno'?' active':'')} onClick={()=>dispatch({type:'SET_RECORDES_MAIN_TAB',payload:'selecaoAno'})}>Seleção do Ano</button>
          <button className={'btn-small recordes-btn'+(mainTab==='artilhariaGeral'?' active':'')} onClick={()=>dispatch({type:'SET_RECORDES_MAIN_TAB',payload:'artilhariaGeral'})}>Artilharia Geral</button>
          <button className={'btn-small recordes-btn'+(mainTab==='assistenciasGeral'?' active':'')} onClick={()=>dispatch({type:'SET_RECORDES_MAIN_TAB',payload:'assistenciasGeral'})}>Assist. Gerais</button>
        </div>
      </div>
      <div id="recordes-content">
        {mainTab==='campeoes'&&<CampeoesSection subTab={subTab}/>}
        {mainTab==='bolaDeOuro'&&<BolaDeOuroHistoricoSec/>}
        {mainTab==='selecaoAno'&&<SelecaoAnoHistoricoSec/>}
        {mainTab==='artilhariaGeral'&&<ArtilhariaGeralSec/>}
        {mainTab==='assistenciasGeral'&&<AssistenciasGeraisSec/>}
      </div>
    </section>
  );
}

function CampeoesSection({subTab}:{subTab:string}){
  const {dispatch}=useGame();
  return (<div className="rec-content active">
    <div className="rec-subnav">
      <button className={'btn-small rec-sub'+(subTab==='historicos'?' active':'')} onClick={()=>dispatch({type:'SET_RECORDES_SUB_TAB',payload:'historicos'})}>Históricos (1937-2025)</button>
      <button className={'btn-small rec-sub'+(subTab==='simulados'?' active':'')} onClick={()=>dispatch({type:'SET_RECORDES_SUB_TAB',payload:'simulados'})}>Simulados (2026+)</button>
      <button className={'btn-small rec-sub'+(subTab==='ranking'?' active':'')} onClick={()=>dispatch({type:'SET_RECORDES_SUB_TAB',payload:'ranking'})}>Ranking Títulos</button>
    </div>
    <div style={{marginTop:8}}>
      {subTab==='historicos'&&<CampeoesHistoricos/>}
      {subTab==='simulados'&&<CampeoesSimulados/>}
      {subTab==='ranking'&&<RankingTitulos/>}
    </div>
  </div>);
}

function abrirPerfilTime(nome: string, id?: number) {
  window.dispatchEvent(new CustomEvent('open-time-profile', { detail: { nome, id } }));
}

function CampeoesHistoricos(){
  return (
    <div className="table-wrapper"><table><thead><tr><th>Ano</th><th>Campeão</th><th>Vice</th><th>3º Lugar</th></tr></thead>
      <tbody>{CAMPEOES_HISTORICOS.map((c,i)=>{const cores=getTimeColors(c.campeao);return(
        <tr key={i}><td>{c.ano}</td><td><span style={{background:cores[0],color:cores[1],width:20,height:20,borderRadius:'50%',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'0.5rem',fontWeight:700}}>{c.campeao.substring(0,2)}</span> <strong className="clickable" onClick={() => abrirPerfilTime(c.campeao)}>{c.campeao}</strong></td><td>{c.vice||'-'}</td><td>{c.terceiro||'-'}</td></tr>
      );})}</tbody></table></div>
  );
}

function CampeoesSimulados(){
  const {state}=useGame();
  const lista=getCampeoesJogo(state.game._campeoes);
  if(lista.length===0)return <div style={{padding:16,color:'var(--text-dim)',textAlign:'center'}}>Nenhum campeonato concluído ainda.</div>;
  return (<div className="table-wrapper"><table><thead><tr><th>Ano</th><th>Campeão</th><th>Vice</th></tr></thead>
    <tbody>{lista.map(c=>{const cores=getTimeColors(c.campeao);return(
      <tr key={c.ano}><td>{c.ano}</td><td><span style={{background:cores[0],color:cores[1],width:20,height:20,borderRadius:'50%',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'0.5rem',fontWeight:700}}>{c.campeao.substring(0,2)}</span> <strong className="clickable" onClick={() => abrirPerfilTime(c.campeao)}>{c.campeao}</strong></td><td>{c.vice||'-'}</td></tr>
    );})}</tbody></table></div>);
}

function RankingTitulos(){
  const {state}=useGame();
  const rank:Record<string,any>={};
  CAMPEOES_HISTORICOS.forEach(c=>{if(!rank[c.campeao])rank[c.campeao]={nome:c.campeao,titulos:0};rank[c.campeao].titulos++;});
  getCampeoesJogo(state.game._campeoes).forEach(c=>{if(!rank[c.campeao])rank[c.campeao]={nome:c.campeao,titulos:0};rank[c.campeao].titulos++;});
  const lista=Object.values(rank).sort((a:any,b:any)=>b.titulos-a.titulos);
  return (<div className="table-wrapper"><table><thead><tr><th>#</th><th>Time</th><th>Títulos</th></tr></thead>
    <tbody>{lista.map((t:any,i:number)=>{const cores=getTimeColors(t.nome);return(
      <tr key={t.nome}><td>{i+1}</td><td><span style={{background:cores[0],color:cores[1],width:20,height:20,borderRadius:'50%',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'0.5rem',fontWeight:700}}>{t.nome.substring(0,2)}</span> <strong className="clickable" onClick={() => abrirPerfilTime(t.nome)}>{t.nome}</strong></td><td>{t.titulos}</td></tr>
    );})}</tbody></table></div>);
}

function BolaDeOuroHistoricoSec(){
  const {state, dispatch}=useGame();
  const [bdoSubTab, setBdoSubTab] = useState<'historico' | 'ranking' | 'goat'>('historico');

  function handleClick(jogador: string, id?: number) {
    window.dispatchEvent(new CustomEvent('open-player-profile', { detail: { nome: jogador, id } }));
  }

  const historico = getBolaDeOuroHistorico(state.game);
  const ranking = useMemo(() => calcularRankingBolaDeOuro(state.game), [state.game]);
  const goatRanking = useMemo(() => calcularGoatIndex(state.game), [state.game]);

  return (
    <div>
      <div className="rec-subnav" style={{ marginBottom: 8 }}>
        <button 
          className={'btn-small rec-sub' + (bdoSubTab === 'historico' ? ' active' : '')} 
          onClick={() => setBdoSubTab('historico')}
        >📜 Histórico</button>
        <button 
          className={'btn-small rec-sub' + (bdoSubTab === 'ranking' ? ' active' : '')} 
          onClick={() => setBdoSubTab('ranking')}
        >🏆 Ranking BDO</button>
        <button 
          className={'btn-small rec-sub' + (bdoSubTab === 'goat' ? ' active' : '')} 
          onClick={() => setBdoSubTab('goat')}
        >🐐 GOAT Index</button>
      </div>

      {bdoSubTab === 'historico' && <BdoHistorico historico={historico} handleClick={handleClick} />}
      {bdoSubTab === 'ranking' && <BdoRanking ranking={ranking} handleClick={handleClick} />}
      {bdoSubTab === 'goat' && <GoatRanking ranking={goatRanking} handleClick={handleClick} />}
    </div>
  );
}

function BdoHistorico({ historico, handleClick }: { historico: BolaDeOuroHistorico[]; handleClick: (nome: string, id?: number) => void }) {
  if (historico.length === 0) return <div style={{padding:16,color:'var(--text-dim)',textAlign:'center'}}>Nenhuma premiação de Bola de Ouro registrada ainda.</div>;
  
  const sorted = [...historico].sort((a, b) => b.ano - a.ano);

  return (
    <div className="bdo-historico">
      {sorted.map((h) => (
        <div key={h.ano} className="bdo-ano-card">
          <div className="bdo-ano-titulo">⭐ Bola de Ouro {h.ano}</div>
          <div className="bdo-ano-podium">
            <div className="bdo-ano-entry ouro">
              <span className="bdo-ano-medalha">🥇</span>
              <span className="bdo-ano-jogador clickable" onClick={() => handleClick(h.ouro.jogador, h.ouro.id)}>{h.ouro.jogador}</span>
              <span className="bdo-ano-time"><TimeLogo nome={h.ouro.time} size="mini" /> {h.ouro.time}</span>
              <span className="bdo-ano-nota">{h.ouro.nota.toFixed(1)}</span>
            </div>
            <div className="bdo-ano-entry prata">
              <span className="bdo-ano-medalha">🥈</span>
              <span className="bdo-ano-jogador clickable" onClick={() => handleClick(h.prata.jogador, h.prata.id)}>{h.prata.jogador}</span>
              <span className="bdo-ano-time"><TimeLogo nome={h.prata.time} size="mini" /> {h.prata.time}</span>
              <span className="bdo-ano-nota">{h.prata.nota.toFixed(1)}</span>
            </div>
            <div className="bdo-ano-entry bronze">
              <span className="bdo-ano-medalha">🥉</span>
              <span className="bdo-ano-jogador clickable" onClick={() => handleClick(h.bronze.jogador, h.bronze.id)}>{h.bronze.jogador}</span>
              <span className="bdo-ano-time"><TimeLogo nome={h.bronze.time} size="mini" /> {h.bronze.time}</span>
              <span className="bdo-ano-nota">{h.bronze.nota.toFixed(1)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BdoRanking({ ranking, handleClick }: { ranking: BdoRankingEntry[]; handleClick: (nome: string, id?: number) => void }) {
  if (ranking.length === 0) return <div style={{padding:16,color:'var(--text-dim)',textAlign:'center'}}>Nenhuma premiação registrada ainda.</div>;

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Jogador</th>
            <th>🥇 Ouros</th>
            <th>🥈 Pratas</th>
            <th>🥉 Bronzes</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {ranking.slice(0, 50).map((j, i) => (
            <tr key={j.id ?? j.jogador}>
              <td>{i + 1}</td>
              <td><span className="clickable" onClick={() => handleClick(j.jogador, j.id)}>{j.jogador}</span></td>
              <td><strong>{j.ouros}</strong></td>
              <td>{j.pratas}</td>
              <td>{j.bronzes}</td>
              <td>{j.totalPremios}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GoatRanking({ ranking, handleClick }: { ranking: GoatRankingEntry[]; handleClick: (nome: string, id?: number) => void }) {
  if (ranking.length === 0) return <div style={{padding:16,color:'var(--text-dim)',textAlign:'center'}}>Nenhum dado disponível para o GOAT Index.</div>;

  return (
    <div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 8 }}>
        🐐 O <strong>GOAT Index</strong> é calculado com base em: Bolas de Ouro (🥇×10, 🥈×5, 🥉×2.5), 
        média histórica de notas (×3), gols (×0.5), assistências (×0.3), títulos (×4) e aparições na Seleção da Temporada (×2).
      </p>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Jogador</th>
              <th>🐐 GOAT</th>
              <th>🥇</th>
              <th>🥈</th>
              <th>🥉</th>
              <th>Média</th>
              <th>Gols</th>
              <th>Assists</th>
              <th>🏆 Títulos</th>
              <th>🌟 Sel.</th>
            </tr>
          </thead>
          <tbody>
            {ranking.slice(0, 50).map((j, i) => (
              <tr key={j.id ?? j.jogador}>
                <td>{i + 1}</td>
                <td><span className="clickable" onClick={() => handleClick(j.jogador, j.id)}>{j.jogador}</span></td>
                <td><strong>{j.goatIndex.toFixed(1)}</strong></td>
                <td>{j.ouros}</td>
                <td>{j.pratas}</td>
                <td>{j.bronzes}</td>
                <td>{j.mediaHistorica.toFixed(1)}</td>
                <td>{j.gols}</td>
                <td>{j.assistencias}</td>
                <td>{j.titulos}</td>
                <td>{j.aparicoesSelecao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SelecaoAnoHistoricoSec(){
  const {state}=useGame();
  const historico = getSelecoesHistorico(state.game);
  if (historico.length === 0) return <div style={{padding:16,color:'var(--text-dim)',textAlign:'center'}}>Nenhuma Seleção da Temporada registrada ainda.</div>;
  
  const sorted = [...historico].sort((a: SelecaoHistorico, b: SelecaoHistorico) => b.ano - a.ano);

  function handleClick(jogador: string, id?: number) {
    window.dispatchEvent(new CustomEvent('open-player-profile', { detail: { nome: jogador, id } }));
  }
  
  return (
    <div className="sel-historico">
      {sorted.map((h: SelecaoHistorico) => (
        <div key={h.ano} className="sel-ano-card">
          <div className="sel-ano-titulo">🌟 Seleção da Temporada {h.ano}</div>
          <div className="sel-ano-grid">
            <div className="sel-ano-pos"><span className="sel-ano-pos-tag">GOL</span> <strong className="clickable" onClick={() => handleClick(h.selecao.goleiro?.jogador, h.selecao.goleiro?.id)}>{h.selecao.goleiro?.jogador}</strong> <span className="sel-ano-time-label"><TimeLogo nome={h.selecao.goleiro?.time} size="mini" /> {h.selecao.goleiro?.time}</span></div>
            {h.selecao.zag?.map((e: SelecaoEntry, i: number) => (
              <div key={'zag-'+i} className="sel-ano-pos"><span className="sel-ano-pos-tag">ZAG</span> <strong className="clickable" onClick={() => handleClick(e.jogador, e.id)}>{e.jogador}</strong> <span className="sel-ano-time-label"><TimeLogo nome={e.time} size="mini" /> {e.time}</span></div>
            ))}
            {h.selecao.laterais?.map((e: SelecaoEntry, i: number) => (
              <div key={'lat-'+i} className="sel-ano-pos"><span className="sel-ano-pos-tag">{e.posicao === 'LD' ? 'LD' : 'LE'}</span> <strong className="clickable" onClick={() => handleClick(e.jogador, e.id)}>{e.jogador}</strong> <span className="sel-ano-time-label"><TimeLogo nome={e.time} size="mini" /> {e.time}</span></div>
            ))}
            {h.selecao.volantes?.map((e: SelecaoEntry, i: number) => (
              <div key={'vol-'+i} className="sel-ano-pos"><span className="sel-ano-pos-tag">VOL</span> <strong className="clickable" onClick={() => handleClick(e.jogador, e.id)}>{e.jogador}</strong> <span className="sel-ano-time-label"><TimeLogo nome={e.time} size="mini" /> {e.time}</span></div>
            ))}
            {h.selecao.meias?.map((e: SelecaoEntry, i: number) => (
              <div key={'mei-'+i} className="sel-ano-pos"><span className="sel-ano-pos-tag">MEI</span> <strong className="clickable" onClick={() => handleClick(e.jogador, e.id)}>{e.jogador}</strong> <span className="sel-ano-time-label"><TimeLogo nome={e.time} size="mini" /> {e.time}</span></div>
            ))}
            {h.selecao.atacantes?.map((e: SelecaoEntry, i: number) => (
              <div key={'ata-'+i} className="sel-ano-pos"><span className="sel-ano-pos-tag">ATA</span> <strong className="clickable" onClick={() => handleClick(e.jogador, e.id)}>{e.jogador}</strong> <span className="sel-ano-time-label"><TimeLogo nome={e.time} size="mini" /> {e.time}</span></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ArtilhariaGeralSec(){
  const {state}=useGame();
  const [est, setEst] = useState<EstatisticasTemporada>({ artilheiros: [], assistencias: [] });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const dados = await carregarEstatisticasGlobais(state.game);
      if (!cancelled) {
        setEst(dados);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [state.game]);

  function handleClick(jogador: string, id?: number) {
    window.dispatchEvent(new CustomEvent('open-player-profile', { detail: { nome: jogador, id } }));
  }
  if (loading) return <p style={{padding:16,color:'var(--text-dim)',textAlign:'center'}}>Carregando...</p>;
  return (<div className="table-wrapper"><table><thead><tr><th>#</th><th>Jogador</th><th>Time</th><th>Gols (total)</th></tr></thead>
    <tbody>{est.artilheiros.length===0?<tr><td colSpan={4} style={{padding:16,color:'var(--text-dim)'}}>Nenhum gol registrado.</td></tr>:est.artilheiros.slice(0,50).map((j,i)=><tr key={'art-'+i}><td>{i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</td><td><span className="clickable" onClick={() => handleClick(j.nome, j.id)}>{j.nome}</span></td><td>{j.time}</td><td><strong>{j.gols}</strong></td></tr>)}</tbody></table></div>);
}

function AssistenciasGeraisSec(){
  const {state}=useGame();
  const [est, setEst] = useState<EstatisticasTemporada>({ artilheiros: [], assistencias: [] });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const dados = await carregarEstatisticasGlobais(state.game);
      if (!cancelled) {
        setEst(dados);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [state.game]);

  function handleClick(jogador: string, id?: number) {
    window.dispatchEvent(new CustomEvent('open-player-profile', { detail: { nome: jogador, id } }));
  }
  if (loading) return <p style={{padding:16,color:'var(--text-dim)',textAlign:'center'}}>Carregando...</p>;
  return (<div className="table-wrapper"><table><thead><tr><th>#</th><th>Jogador</th><th>Time</th><th>Assist. (total)</th></tr></thead>
    <tbody>{est.assistencias.length===0?<tr><td colSpan={4} style={{padding:16,color:'var(--text-dim)'}}>Nenhuma assistência registrada.</td></tr>:est.assistencias.slice(0,50).map((j,i)=><tr key={'ass-'+i}><td>{i+1}</td><td><span className="clickable" onClick={() => handleClick(j.nome, j.id)}>{j.nome}</span></td><td>{j.time}</td><td><strong>{j.assists}</strong></td></tr>)}</tbody></table></div>);
}
