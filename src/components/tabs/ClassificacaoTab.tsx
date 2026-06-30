import { useState, useMemo } from 'react';
import { useGame } from '../../store/GameContext';
import { gerarClassificacao } from '../../utils/gameLogic';
import { TimeLogo } from '../common/TimeLogo';
import { Time } from '../../types';
import './ClassificacaoTab.css';

function abrirPerfilTime(nome: string, id?: number) {
  window.dispatchEvent(new CustomEvent('open-time-profile', { detail: { nome, id } }));
}

type Serie = 'A' | 'B' | 'C';

export function ClassificationTab() {
  const { state } = useGame();
  const [serieSelecionada, setSerieSelecionada] = useState<Serie>('A');

  const s = state.game.state;
  const estadoB = state.game._estadoB;
  const estadoC = state.game._estadoC;

  // Para Série A: dados reais do state
  const classificacaoA = s ? gerarClassificacao(s.times) : [];
  const totalJogosA = s ? s.jogos.reduce((a, r) => a + r.length, 0) : 0;
  const jogosFeitosA = s ? s.jogos.reduce((a, r) => a + r.filter(j => j.resultado !== null).length, 0) : 0;

  // Para Séries B e C: usar estados persistidos
  const classificacaoB = useMemo(() => {
    if (estadoB?.times) return gerarClassificacao(estadoB.times);
    return null;
  }, [estadoB]);

  const classificacaoC = useMemo(() => {
    if (estadoC?.times) return gerarClassificacao(estadoC.times);
    return null;
  }, [estadoC]);

  function getClassificacaoSerie(serie: Serie): Time[] | null {
    if (serie === 'A') return classificacaoA;
    if (serie === 'B') return classificacaoB;
    return classificacaoC;
  }

  function getZonaClass(idx: number, serie: Serie): string {
    if (serie === 'A') {
      if (idx < 4) return 'zona-liberta';
      if (idx < 6) return 'zona-pre-liberta';
      if (idx < 12) return 'zona-sulamericana';
      if (idx >= 16) return 'zona-rebaixamento';
      return '';
    }
    if (serie === 'B') {
      if (idx < 4) return 'zona-liberta';
      if (idx >= 16) return 'zona-rebaixamento';
      return '';
    }
    if (idx < 4) return 'zona-liberta';
    return '';
  }

  function getLegenda(serie: Serie) {
    if (serie === 'A') {
      return (
        <div className="legenda">
          <span className="leg-item zona-liberta">Zona Libertadores</span>
          <span className="leg-item zona-pre-liberta">Pré-Libertadores</span>
          <span className="leg-item zona-sulamericana">Sul-Americana</span>
          <span className="leg-item zona-rebaixamento">Zona Rebaixamento</span>
        </div>
      );
    }
    if (serie === 'B') {
      return (
        <div className="legenda">
          <span className="leg-item zona-liberta">Acesso à Série A</span>
          <span className="leg-item zona-rebaixamento">Rebaixamento à Série C</span>
        </div>
      );
    }
    return (
      <div className="legenda">
        <span className="leg-item zona-liberta">Acesso à Série B</span>
      </div>
    );
  }

  // Últimos 5 resultados de cada time (para Série A)
  function getUltimosResultados(timeNome: string): { resultado: 'V' | 'E' | 'D'; info: string }[] {
    if (!s || serieSelecionada !== 'A') return [];
    const resultados: { resultado: 'V' | 'E' | 'D'; info: string }[] = [];
    for (let r = s.jogos.length - 1; r >= 0; r--) {
      const rodada = s.jogos[r];
      for (let j = rodada.length - 1; j >= 0; j--) {
        const jogo = rodada[j];
        if (!jogo.resultado) continue;
        if (jogo.casa === timeNome || jogo.fora === timeNome) {
          const golsTime = jogo.casa === timeNome ? jogo.resultado.casa : jogo.resultado.fora;
          const golsAdv = jogo.casa === timeNome ? jogo.resultado.fora : jogo.resultado.casa;
          const adv = jogo.casa === timeNome ? jogo.fora : jogo.casa;
          let resultado: 'V' | 'E' | 'D';
          if (golsTime > golsAdv) resultado = 'V';
          else if (golsTime < golsAdv) resultado = 'D';
          else resultado = 'E';
          resultados.push({
            resultado,
            info: `${jogo.casa} ${jogo.resultado.casa}-${jogo.resultado.fora} ${jogo.fora}`,
          });
          if (resultados.length >= 5) break;
        }
      }
      if (resultados.length >= 5) break;
    }
    return resultados;
  }

  const classifAtual = getClassificacaoSerie(serieSelecionada);

  return (
    <section className="tab-content active">
      <div className="tab-header">
        <h2>Classificação</h2>
        <div className="series-selector">
          <button
            className={'btn-small serie-btn' + (serieSelecionada === 'A' ? ' active' : '')}
            onClick={() => setSerieSelecionada('A')}
          >
            Série A
          </button>
          <button
            className={'btn-small serie-btn' + (serieSelecionada === 'B' ? ' active' : '')}
            onClick={() => setSerieSelecionada('B')}
          >
            Série B
          </button>
          <button
            className={'btn-small serie-btn' + (serieSelecionada === 'C' ? ' active' : '')}
            onClick={() => setSerieSelecionada('C')}
          >
            Série C
          </button>
        </div>
      </div>

      <div id="serie-status">
        {serieSelecionada === 'A' && s && (
          s.concluido
            ? <span style={{ color: 'var(--gold)' }}>✅ Campeonato Concluído!</span>
            : `${jogosFeitosA}/${totalJogosA} jogos realizados`
        )}
        {serieSelecionada !== 'A' && (
          classifAtual && classifAtual.length > 0 ? (
            <span style={{ color: 'var(--text-dim)' }}>
              {classifAtual.length} times {estadoB?.concluido || estadoC?.concluido ? '✅' : ''}
            </span>
          ) : (
            <span style={{ color: 'var(--text-dim)' }}>
              Dados disponíveis após simular temporada
            </span>
          )
        )}
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Time</th>
              <th>P</th>
              <th>J</th>
              <th>V</th>
              <th>E</th>
              <th>D</th>
              <th>GP</th>
              <th>GC</th>
              <th>SG</th>
              {serieSelecionada === 'A' && <th className="th-ultimos-jogos">Últimos Jogos</th>}
            </tr>
          </thead>
          <tbody>
            {serieSelecionada === 'A' ? (
              classificacaoA.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)' }}>
                    Nenhum time na Série A
                  </td>
                </tr>
              ) : (
                classificacaoA.map((time, idx) => {
                  const zona = getZonaClass(idx, 'A');
                  const sg = time.golsPro - time.golsContra;
                  const ultimos = getUltimosResultados(time.nome);
                  return (
                    <tr key={time.nome} className={zona}>
                      <td>{idx + 1}</td>
                      <td>
                        <span className="clickable" onClick={() => abrirPerfilTime(time.nome, (time as any).timeId)}>
                          <TimeLogo nome={time.nome} size="mini" /> {time.nome}
                        </span>
                      </td>
                      <td><strong>{time.pontos}</strong></td>
                      <td>{time.jogos}</td>
                      <td>{time.vitorias}</td>
                      <td>{time.empates}</td>
                      <td>{time.derrotas}</td>
                      <td>{time.golsPro}</td>
                      <td>{time.golsContra}</td>
                      <td>{sg > 0 ? '+' : ''}{sg}</td>
                      <td className="td-ultimos-jogos">
                        {ultimos.length > 0 && (
                          <div className="ultimos-jogos">
                            {ultimos.map((u, i) => (
                              <span
                                key={i}
                                className={'ultimo-jogo-bola ' + (
                                  u.resultado === 'V' ? 'bola-vitoria' :
                                  u.resultado === 'E' ? 'bola-empate' : 'bola-derrota'
                                )}
                                title={u.info}
                              >
                                {u.resultado}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )
            ) : (
              !classifAtual || classifAtual.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)' }}>
                    Nenhum dado disponível para Série {serieSelecionada}. Avance a temporada para gerar os resultados.
                  </td>
                </tr>
              ) : (
                classifAtual.map((time, idx) => {
                  const zona = getZonaClass(idx, serieSelecionada);
                  const sg = time.golsPro - time.golsContra;
                  return (
                    <tr key={time.nome} className={zona}>
                      <td>{idx + 1}</td>
                      <td>
                        <span className="clickable" onClick={() => abrirPerfilTime(time.nome, (time as any).timeId)}>
                          <TimeLogo nome={time.nome} size="mini" /> {time.nome}
                        </span>
                      </td>
                      <td><strong>{time.pontos}</strong></td>
                      <td>{time.jogos}</td>
                      <td>{time.vitorias}</td>
                      <td>{time.empates}</td>
                      <td>{time.derrotas}</td>
                      <td>{time.golsPro}</td>
                      <td>{time.golsContra}</td>
                      <td>{sg > 0 ? '+' : ''}{sg}</td>
                    </tr>
                  );
                })
              )
            )}
          </tbody>
        </table>
      </div>

      {getLegenda(serieSelecionada)}
    </section>
  );
}
