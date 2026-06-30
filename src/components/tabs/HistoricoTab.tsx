import { useState, useEffect } from 'react';
import { useGame } from '../../store/GameContext';
import { gerarClassificacao, getEstatisticas } from '../../utils/gameLogic';
import { carregarAnoSimuladoDB, listarAnosSimuladosDB } from '../../utils/storage';
import './HistoricoTab.css';
export function HistoricoTab() {
  const {state,dispatch}=useGame();
  // Lista de anos: combina os que estão em memória com os do IndexedDB
  const anosMemoria = state.game._championshipYears ?? Object.keys(state.game.championships);
  const [anosDB, setAnosDB] = useState<string[]>([]);
  useEffect(() => {
    listarAnosSimuladosDB('A').then(anos => {
      setAnosDB(anos.map(String));
    });
  }, []);
  // Unir anos da memória com anos do DB (sem duplicatas)
  const todosAnos = [...new Set([...anosMemoria, ...anosDB])].sort();
  const [anoSelecionado, setAnoSelecionado] = useState<string>(
    state.historicoAnoSelecionado && todosAnos.includes(state.historicoAnoSelecionado) 
      ? state.historicoAnoSelecionado 
      : (todosAnos[todosAnos.length - 1] || '')
  );
  const [seasonData, setSeasonData] = useState<any>(null);
  const [loadingAno, setLoadingAno] = useState(false);

  // Carregar dados do ano selecionado
  useEffect(() => {
    if (!anoSelecionado) { setSeasonData(null); return; }
    
    // Primeiro tenta da memória
    const daMemoria = state.game.championships[anoSelecionado];
    if (daMemoria) {
      setSeasonData(daMemoria);
      return;
    }

    // Se não está em memória, carrega do IndexedDB
    setLoadingAno(true);
    carregarAnoSimuladoDB(parseInt(anoSelecionado), 'A').then(dados => {
      setSeasonData(dados);
      setLoadingAno(false);
    });
  }, [anoSelecionado, state.game.championships]);

  function handleAnoChange(ano: string) {
    setAnoSelecionado(ano);
    dispatch({ type: 'SET_HISTORICO_ANO', payload: ano });
  }
  return (
    <section className="tab-content active">
      <div className="tab-header"><h2>Histórico de Temporadas</h2>
        <div className="historico-nav">
          <select id="historico-select" value={anoSelecionado} onChange={e=>handleAnoChange(e.target.value)}>
            {todosAnos.map(a=><option key={a} value={a}>Brasileirão {a}</option>)}
          </select>
        </div>
      </div>
      <div id="historico-content">
        {loadingAno?<p style={{padding:16,color:'var(--text-dim)'}}>Carregando...</p>:seasonData?<HistoricoAnoDetail ano={anoSelecionado} data={seasonData}/>:<p style={{padding:16,color:'var(--text-dim)'}}>Sem dados desta temporada.</p>}
      </div>
    </section>
  );
}
function HistoricoAnoDetail({ano,data}:{ano:string;data:any}){
  const s=JSON.parse(JSON.stringify(data));
  if(!s.times||Object.keys(s.times).length===0)return <p style={{padding:16,color:'var(--text-dim)'}}>Temporada sem dados.</p>;
  const c=gerarClassificacao(s.times);
  if(!c||c.length===0)return <p style={{padding:16,color:'var(--text-dim)'}}>Temporada sem dados.</p>;
  const campeaoNome=s._campeao||c[0].nome;
  const viceNome=s._vice||(c.length>1?c[1].nome:'');
  const rebaixadosLista=s._rebaixados||(c.length>=4?c.slice(-4).map((t:any)=>t.nome):[]);
  const campeaoObj=c.find((t:any)=>t.nome===campeaoNome)||c[0];
  const estat=getEstatisticas(s);
  return (
    <>
      <div id="historico-sumario">
        <strong style={{color:'var(--gold)'}}>🏆 {campeaoNome}</strong> - {campeaoObj.pontos}pts ({campeaoObj.vitorias}V {campeaoObj.empates}E {campeaoObj.derrotas}D)<br/>
        <span style={{color:'var(--text-dim)'}}>{s._concluido||s.concluido?'✅ Completa':'⏳ Em andamento'}</span>
        {(s._concluido||s.concluido)&&rebaixadosLista.length>0&&<><br/><span style={{color:'var(--red)'}}>⬇ Rebaixados: {rebaixadosLista.join(', ')}</span></>}
      </div>
      <h3 style={{padding:8,color:'var(--accent)',fontSize:'0.9rem'}}>Classificação Final</h3>
      <div className="table-wrapper"><table>
        <thead><tr><th>#</th><th>Time</th><th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th></tr></thead>
        <tbody>{c.map((time:any,i:number)=>{const sg=time.golsPro-time.golsContra;return(
          <tr key={time.nome} style={time.nome===campeaoNome?{background:'rgba(255,215,0,0.08)'}:{}}>
            <td>{i+1}</td><td>{time.nome}</td><td><strong>{time.pontos}</strong></td><td>{time.jogos}</td><td>{time.vitorias}</td><td>{time.empates}</td><td>{time.derrotas}</td><td>{time.golsPro}</td><td>{time.golsContra}</td><td>{sg>0?'+':''}{sg}</td>
          </tr>
        );})}</tbody>
      </table></div>
      <div style={{marginTop:10}}>
        <h3 style={{padding:8,color:'var(--accent)',fontSize:'0.9rem'}}>Destaques</h3>
        <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
          <div style={{flex:1,minWidth:140}}>
            <strong style={{color:'var(--gold)',fontSize:'0.8rem'}}>⚽ Artilheiro</strong><br/>
            {estat.artilheiros.length>0?<><span style={{fontSize:'0.85rem'}}>{estat.artilheiros[0].nome}</span><br/><span style={{color:'var(--text-dim)',fontSize:'0.7rem'}}>{estat.artilheiros[0].gols} gols</span></>:<span style={{color:'var(--text-dim)',fontSize:'0.7rem'}}>Nenhum</span>}
          </div>
          <div style={{flex:1,minWidth:140}}>
            <strong style={{color:'var(--accent2)',fontSize:'0.8rem'}}>🅰 Assistências</strong><br/>
            {estat.assistencias.length>0?<><span style={{fontSize:'0.85rem'}}>{estat.assistencias[0].nome}</span><br/><span style={{color:'var(--text-dim)',fontSize:'0.7rem'}}>{estat.assistencias[0].assists} assists</span></>:<span style={{color:'var(--text-dim)',fontSize:'0.7rem'}}>Nenhum</span>}
          </div>
        </div>
      </div>
    </>
  );
}
