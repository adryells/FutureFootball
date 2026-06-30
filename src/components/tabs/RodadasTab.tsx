import { useState } from 'react';
import { useGame } from '../../store/GameContext';
import { handleSimularJogo, handleConfirmarJogo } from './rodadasHelpers';
import { TimeLogo } from '../common/TimeLogo';
import { TemporadaResumoModal } from '../modals/TemporadaResumoModal';
import { SimulacaoModal } from '../modals/SimulacaoModal';
import { gerarClassificacao, getMediaJogador, simularSerieCompleta } from '../../utils/gameLogic';
import { Time, EstadoTemporada, Jogador, LastSeriesResults } from '../../types';
import './RodadasTab.css';

export function RodadasTab() {
  const {state,dispatch,simularRodadaAtual,simularTodas,simularRestantesFn,proximoAno}=useGame();
  const estado=state.game.state;
  if(!estado)return null;
  const total=estado.jogos.length;
  const currentRodada=state.currentRodada;
  const rodada=estado.jogos[currentRodada];
  if(!rodada)return null;
  const isConcluido=estado.concluido;

  const [showResumo, setShowResumo] = useState(false);
  const [showSimulacao, setShowSimulacao] = useState(false);
  const [resumoSeasonData, setResumoSeasonData] = useState<EstadoTemporada | null>(null);
  const [resumoAno, setResumoAno] = useState(0);
  const [resumoLastResults, setResumoLastResults] = useState<LastSeriesResults | null>(null);
  const s = estado as NonNullable<typeof estado>;

  function handleProximoAno() {
    // Captura os dados da temporada atual E já computa os resultados
    // das séries B e C, para que o modal exiba as informacoes corretas
    // (os promovidos/rebaixados destas temporadas, e não os do ano passado)
    const currentYear = state.game.year;
    const classifAtual = gerarClassificacao(s.times);
    const seasonData: EstadoTemporada = {
      ...JSON.parse(JSON.stringify(s)),
      _campeao: classifAtual.length > 0 ? classifAtual[0].nome : '',
      _vice: classifAtual.length > 1 ? classifAtual[1].nome : '',
      _rebaixados: classifAtual.slice(-4).map((t: Time) => t.nome),
      _concluido: true,
    };

    // Simula Série B e C agora para obter promovidos/rebaixados corretos
    const resultadoB = simularSerieCompleta(state.game.seriesB, 'B');
    const resultadoC = simularSerieCompleta(state.game.seriesC, 'C');
    const promovidosB = resultadoB.promovidos.slice();
    const rebaixadosB = resultadoB.classificacao.slice(-4).map((t: { nome: string }) => t.nome);

    const computedLastResults: LastSeriesResults = {
      B: resultadoB,
      C: resultadoC,
      rebaixadosA: seasonData._rebaixados || [],
      promovidosB,
      rebaixadosB,
    };

    setResumoLastResults(computedLastResults);
    setResumoAno(currentYear);
    setResumoSeasonData(seasonData);
    setShowResumo(true);
  }

  function handleFecharResumo() {
    setShowResumo(false);
    // Só quando fechar o modal é que avança o ano
    proximoAno();
  }

  function JogoCard({jogo,rodadaIdx,jogoIdx}:{jogo:any;rodadaIdx:number;jogoIdx:number}){
    const jogado=jogo.resultado!==null;
    const [gc,setGc]=useState(0);
    const [gf,setGf]=useState(0);
    const [expandido,setExpandido]=useState(false);

    function simular(){
      handleSimularJogo(s,rodadaIdx,jogoIdx);
      dispatch({type:'UPDATE_STATE',payload:JSON.parse(JSON.stringify(s))});
    }
    function confirmar(){
      handleConfirmarJogo(s,rodadaIdx,jogoIdx,gc,gf);
      dispatch({type:'UPDATE_STATE',payload:JSON.parse(JSON.stringify(s))});
    }

    const detalhes = jogado && jogo.golsInfo && jogo.golsInfo.length > 0;

    return (
      <div className={'jogo-card' + (expandido ? ' expanded' : '')}>
        <div className="jogo-card-main" onClick={() => detalhes && setExpandido(!expandido)} style={{cursor: detalhes ? 'pointer' : 'default'}}>
          <div className="jogo-time casa">
            <TimeLogo nome={jogo.casa} size="mini" />
            <span className="jogo-time-nome">{jogo.casa}</span>
          </div>
          <div className="jogo-placar">
            {jogado ? (
              <div className="jogo-placar-resultado" onClick={() => detalhes && setExpandido(!expandido)}>
                <span className="jogo-placar-result">{jogo.resultado.casa}</span>
                <span className="jogo-placar-separador">-</span>
                <span className="jogo-placar-result">{jogo.resultado.fora}</span>
              </div>
            ) : (
              <div className="jogo-placar-inputs">
                <div className="jogo-input-group">
                  <input type="number" className="jogo-placar-input" min={0} max={20} value={gc} onChange={e=>setGc(parseInt(e.target.value)||0)}/>
                  <span className="jogo-placar-separador">-</span>
                  <input type="number" className="jogo-placar-input" min={0} max={20} value={gf} onChange={e=>setGf(parseInt(e.target.value)||0)}/>
                </div>
              </div>
            )}
          </div>
          <div className="jogo-time fora">
            <TimeLogo nome={jogo.fora} size="mini" />
            <span className="jogo-time-nome">{jogo.fora}</span>
            {!jogado && (
              <span className="jogo-actions" style={{marginLeft:'auto',display:'inline-flex',gap:3}}>
                <button className="btn-simular" title="Confirmar placar" onClick={(e)=>{e.stopPropagation();confirmar()}}>✓</button>
                <button className="btn-simular btn-simular-random" title="Simular resultado aleatório" onClick={(e)=>{e.stopPropagation();simular()}}>🎲</button>
              </span>
            )}
            {detalhes && (
              <span className="jogo-expand-icon" style={{marginLeft:'auto'}}>
                <span style={{transform: expandido ? 'rotate(180deg)' : 'rotate(0)', display:'inline-block', transition:'transform 0.2s'}}>▼</span>
              </span>
            )}
          </div>
        </div>
        {expandido && detalhes && (
          <div className="jogo-detalhes">
            <div className="jogo-gols-lista">
              {jogo.golsInfo.map((gol: any, gi: number) => (
                <div key={gi} className="gol-item">
                  <span className="gol-minuto">{gol.minuto}'</span>
                  {gol.time === 'casa' ? (
                    <span className="gol-jogador"><TimeLogo nome={jogo.casa} size="mini" /> {gol.jogador}</span>
                  ) : (
                    <span className="gol-jogador"><TimeLogo nome={jogo.fora} size="mini" /> {gol.jogador}</span>
                  )}
                  {gol.assistencia && <span className="gol-assistencia">(ass: {gol.assistencia})</span>}
                  <span className={'gol-time-badge ' + (gol.time === 'casa' ? 'gol-casa' : 'gol-fora')}>
                    {gol.time === 'casa' ? jogo.casa : jogo.fora}
                  </span>
                </div>
              ))}
              {jogo.golsInfo.length === 0 && (
                <div className="gol-item gol-item-empty">⚽ Nenhum gol nesta partida</div>
              )}
            </div>
            {/* Médias dos jogadores */}
            {(s.times[jogo.casa]?.jogadores || s.times[jogo.fora]?.jogadores) && (
              <div className="jogo-medias">
                <div className="jogo-medias-header">
                  <span>⚽ Notas dos Jogadores</span>
                </div>
                <div className="jogo-medias-grid">
                  <div className="jogo-medias-col">
                    <div className="jogo-medias-time">
                      <TimeLogo nome={jogo.casa} size="mini" />
                      <span>{jogo.casa}</span>
                    </div>
                    <div className="jogo-medias-lista">
                      {s.times[jogo.casa]?.jogadores?.slice(0, 11).map((j: Jogador, idx: number) => {
                        const m = getMediaJogador(j);
                        return (
                          <div key={j.nome} className="jogo-media-jogador">
                            <span className="media-num">{idx + 1}</span>
                            <span className={'media-pos media-pos-' + j.posicao.toLowerCase()}>{j.posicao}</span>
                            <span className="media-nome">{j.nome}</span>
                            <span className={'media-nota ' + (m.temporada >= 7 ? 'nota-alta' : m.temporada >= 5 ? 'nota-med' : 'nota-baixa')}>
                              {m.temporada > 0 ? m.temporada.toFixed(1) : '-'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="jogo-medias-col">
                    <div className="jogo-medias-time">
                      <TimeLogo nome={jogo.fora} size="mini" />
                      <span>{jogo.fora}</span>
                    </div>
                    <div className="jogo-medias-lista">
                      {s.times[jogo.fora]?.jogadores?.slice(0, 11).map((j: Jogador, idx: number) => {
                        const m = getMediaJogador(j);
                        return (
                          <div key={j.nome} className="jogo-media-jogador">
                            <span className="media-num">{idx + 1}</span>
                            <span className={'media-pos media-pos-' + j.posicao.toLowerCase()}>{j.posicao}</span>
                            <span className="media-nome">{j.nome}</span>
                            <span className={'media-nota ' + (m.temporada >= 7 ? 'nota-alta' : m.temporada >= 5 ? 'nota-med' : 'nota-baixa')}>
                              {m.temporada > 0 ? m.temporada.toFixed(1) : '-'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="tab-content active">
      <div className="tab-header">
        <h2>📅 Rodadas</h2>
        <div className="rodada-nav">
          <button className="btn-small" onClick={()=>currentRodada>0&&dispatch({type:'SET_RODADA',payload:currentRodada-1})} style={{opacity:currentRodada<=0?0.3:1}}>◀</button>
          <div className="rodada-select-wrapper">
            <input type="number" id="rodada-input" min={1} max={total} value={currentRodada+1} onChange={e=>{const v=parseInt(e.target.value);if(v>=1&&v<=total)dispatch({type:'SET_RODADA',payload:v-1})}}/>
            <span id="rodada-indicator">/ {total}{isConcluido?' ✅':''}</span>
          </div>
          <button className="btn-small" onClick={()=>currentRodada<total-1&&dispatch({type:'SET_RODADA',payload:currentRodada+1})} style={{opacity:currentRodada>=total-1?0.3:1}}>▶</button>
        </div>
      </div>
      <div id="rodada-content">
        <div id="rodada-jogos">{rodada.map((jogo:any,idx:number)=><JogoCard key={currentRodada+'-'+idx} jogo={jogo} rodadaIdx={currentRodada} jogoIdx={idx}/>)}</div>
        <div id="rodada-actions">
          {isConcluido ? (
            <button className="btn-primary" onClick={handleProximoAno}>🏆 Próximo Ano ➜</button>
          ) : <>
            <button className="btn-primary" onClick={simularRodadaAtual}>▶ Simular Rodada Atual</button>
            <button className="btn-primary" onClick={simularTodas}>⏩ Simular Todas</button>
            <button className="btn-primary" onClick={simularRestantesFn}>⏭ Simular Restantes</button>
          </>}
          <button className="btn-secondary btn-simulacao" onClick={() => setShowSimulacao(true)}>
            ⚡ Modo Simulação
          </button>
        </div>
      </div>

      <SimulacaoModal
        isOpen={showSimulacao}
        onClose={() => setShowSimulacao(false)}
      />

      <TemporadaResumoModal
        isOpen={showResumo}
        onClose={handleFecharResumo}
        lastResults={resumoLastResults}
        ano={resumoAno}
        seasonData={resumoSeasonData}
      />
    </section>
  );
}
