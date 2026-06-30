import { useState, useCallback, useEffect, useRef } from 'react';
import { useGame } from '../../store/GameContext';
import { simularTodasRodadas, gerarPremiacoes, gerarClassificacao, simularSerieCompleta, iniciarNovoAno } from '../../utils/gameLogic';
import { GameState, LastSeriesResults, EstadoTemporada } from '../../types';
import { salvarAnoSimuladoDB } from '../../utils/storage';
import './SimulacaoModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Cria uma cópia do GameState para simulação.
 * Não copia championships pois cada ano será salvo direto no IndexedDB
 * via salvarAnoSimuladoDB(). Mantém apenas os metadados em memória.
 */
function cloneGameForSimulation(game: GameState): GameState {
  const stateClone: EstadoTemporada | null = game.state
    ? JSON.parse(JSON.stringify(game.state))
    : null;

  return {
    ...game,
    state: stateClone,
    // championships começa vazio - anos serão salvos no IndexedDB
    championships: {},
    _championshipsB: undefined,
    _championshipsC: undefined,
    _todosJogadores: game._todosJogadores,
    _timesConhecidos: game._timesConhecidos ? { ...game._timesConhecidos } : {},
    _jogadorHistoricoClubes: [...(game._jogadorHistoricoClubes ?? [])],
    _bolaDeOuroHistorico: [...(game._bolaDeOuroHistorico ?? [])],
    _selecoesHistorico: [...(game._selecoesHistorico ?? [])],
    _campeoes: { ...game._campeoes },
    // Manter lista de anos para referência
    _championshipYears: [...(game._championshipYears ?? Object.keys(game.championships))],
  };
}

/** Máximo de anos mantidos em memória no objeto championships */
const MAX_CACHED_YEARS = 100;

export function SimulacaoModal({ isOpen, onClose }: Props) {
  const { state, dispatch, showNotification } = useGame();
  const [qtd, setQtd] = useState(10);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ atual: 0, total: 0, ano: 0, campeao: '' });
  const cancelledRef = useRef(false);

  // Reset quando abre
  useEffect(() => {
    if (isOpen) {
      setQtd(10);
      setRunning(false);
      setProgress({ atual: 0, total: 0, ano: 0, campeao: '' });
      cancelledRef.current = false;
    }
  }, [isOpen]);

  const handleSimular = useCallback(async () => {
    if (!state.game.state || qtd < 1) return;

    setRunning(true);
    cancelledRef.current = false;
    setProgress({ atual: 0, total: qtd, ano: state.game.year, campeao: '' });

    // Usamos cloneGameForSimulation em vez de JSON.parse(JSON.stringify(...))
    // para evitar "Invalid string length". Cada ano simulado é salvo no IndexedDB.
    let currentGame: GameState = cloneGameForSimulation(state.game);
    // Lista completa de anos (incluindo os que estão apenas no DB)
    const allYears: Set<string> = new Set(currentGame._championshipYears ?? []);

    for (let i = 0; i < qtd; i++) {
      if (cancelledRef.current) break;

      const s = currentGame.state;
      if (!s) break;

      // Se a temporada não está concluída, simular todas as rodadas
      if (!s.concluido) {
        simularTodasRodadas(s);

        // Gerar premiações
        gerarPremiacoes(s);

        const classifAtual = gerarClassificacao(s.times);
        s._campeao = classifAtual.length > 0 ? classifAtual[0].nome : '';
        s._vice = classifAtual.length > 1 ? classifAtual[1].nome : '';
        s._rebaixados = classifAtual.slice(-4).map(t => t.nome);
        s._concluido = true;
        s.concluido = true;

        // Salvar EstadoTemporada no IndexedDB (sem golsInfo para economizar)
        const sAno = currentGame.year;
        const estadoParaDB: EstadoTemporada = JSON.parse(JSON.stringify(s));
        if (estadoParaDB.jogos) {
          for (const rodada of estadoParaDB.jogos) {
            for (const jogo of rodada) {
              jogo.golsInfo = [];
            }
          }
        }
        // Não esperamos a Promise pois a simulação continua
        salvarAnoSimuladoDB(sAno, 'A', estadoParaDB);

        // Manter em memória apenas os últimos MAX_CACHED_YEARS anos
        const anoStr = String(sAno);
        currentGame.championships[anoStr] = s as EstadoTemporada;
        allYears.add(anoStr);

        // Se excedeu o cache, remover o ano mais antigo da memória
        const anosOrdenados = Array.from(allYears).sort();
        while (currentGame.championships && Object.keys(currentGame.championships).length > MAX_CACHED_YEARS && anosOrdenados.length > 0) {
          const maisAntigo = anosOrdenados.shift()!;
          delete currentGame.championships[maisAntigo];
        }

        currentGame._campeoes[currentGame.year] = {
          campeao: s._campeao || '',
          vice: s._vice || '',
          rebaixados: s._rebaixados || [],
        };
      }

      const campeaoAtual = s._campeao || '';

      // Avançar ano
      const {
        novoState, novaSeriesB, novaSeriesC, rebaixados, promovidos,
        resultadoB, resultadoC, rebaixadosB
      } = iniciarNovoAno(
        s.times,
        currentGame.seriesB,
        currentGame.seriesC,
        currentGame.year,
        currentGame.year,
        currentGame.championships,
        currentGame._campeoes,
        currentGame  // passa o gameState para preservar o banco de jogadores
      );

      const lastSeriesResults: LastSeriesResults = {
        B: resultadoB,
        C: resultadoC,
        rebaixadosA: rebaixados,
        promovidosB: promovidos,
        rebaixadosB,
      };

      // Salvar estados B e C no IndexedDB também
      if (resultadoB._estado) {
        const estadoBDB: EstadoTemporada = JSON.parse(JSON.stringify(resultadoB._estado));
        if (estadoBDB.jogos) {
          for (const rodada of estadoBDB.jogos) {
            for (const jogo of rodada) {
              jogo.golsInfo = [];
            }
          }
        }
        salvarAnoSimuladoDB(currentGame.year, 'B', estadoBDB);
      }

      // Salvar histórico de premiações
      const bolaDeOuroHistorico = [...(currentGame._bolaDeOuroHistorico || [])];
      const selecoesHistorico = [...(currentGame._selecoesHistorico || [])];
      if (s._bolaDeOuro) {
        bolaDeOuroHistorico.push({
          ano: currentGame.year,
          ouro: s._bolaDeOuro.ouro,
          prata: s._bolaDeOuro.prata,
          bronze: s._bolaDeOuro.bronze,
        });
      }
      if (s._selecao) {
        selecoesHistorico.push({
          ano: currentGame.year,
          selecao: s._selecao,
        });
      }

      currentGame = {
        ...currentGame,
        year: currentGame.year + 1,
        state: novoState,
        seriesB: novaSeriesB,
        seriesC: novaSeriesC,
        lastSeriesResults,
        _bolaDeOuroHistorico: bolaDeOuroHistorico,
        _selecoesHistorico: selecoesHistorico,
        _jogadorHistoricoClubes: currentGame._jogadorHistoricoClubes ?? [],
        _timesConhecidos: currentGame._timesConhecidos ?? {},
        _proximoTimeId: currentGame._proximoTimeId,
        _championshipYears: Array.from(allYears).sort(),
      };

      setProgress({
        atual: i + 1,
        total: qtd,
        ano: currentGame.year - 1,
        campeao: campeaoAtual,
      });

      // Pequeno delay para permitir que o React renderize o progresso
      // e também para escutar cancelamento
      await new Promise(r => setTimeout(r, 0));
    }

    if (!cancelledRef.current) {
      // Atualizar o state global com o resultado final
      dispatch({ type: 'SET_GAME', payload: currentGame });
      dispatch({ type: 'SET_RODADA', payload: 0 });
      dispatch({ type: 'SET_ACTIVE_TAB', payload: 'classificacao' });
      showNotification(
        `✅ ${qtd} temporada(s) simulada(s)! Ano atual: ${currentGame.year}`,
        'success'
      );
    }

    setRunning(false);
  }, [state.game, qtd, dispatch, showNotification]);

  function handleCancel() {
    cancelledRef.current = true;
    setRunning(false);
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={running ? undefined : onClose}>
      <div className="modal simulacao-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={running ? undefined : onClose}>
          {running ? '' : '✕'}
        </button>

        <div className="simulacao-header">
          <span className="simulacao-icon">⚡</span>
          <h2>Modo Simulação</h2>
        </div>

        <p className="simulacao-desc">
          Simule múltiplas temporadas automaticamente. O campeonato será totalmente
          simulado (todas as rodadas), premiações serão geradas, e os times
          envelhecerão a cada ano.
        </p>

        {!running ? (
          <>
            <div className="simulacao-input-group">
              <label htmlFor="sim-qtd">Quantidade de temporadas:</label>
              <div className="simulacao-input-row">
                <button
                  className="btn-small"
                  onClick={() => setQtd(Math.max(1, qtd - 5))}
                  disabled={qtd <= 1}
                >
                  -5
                </button>
                <input
                  id="sim-qtd"
                  type="number"
                  min={1}
                  max={5000}
                  value={qtd}
                  onChange={e => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && v >= 1 && v <= 5000) setQtd(v);
                  }}
                />
                <button
                  className="btn-small"
                  onClick={() => setQtd(Math.min(5000, qtd + 5))}
                  disabled={qtd >= 5000}
                >
                  +5
                </button>
              </div>
            </div>

            <div className="simulacao-presets">
              <button className="btn-small" onClick={() => setQtd(1)}>1</button>
              <button className="btn-small" onClick={() => setQtd(5)}>5</button>
              <button className="btn-small" onClick={() => setQtd(10)}>10</button>
              <button className="btn-small" onClick={() => setQtd(25)}>25</button>
              <button className="btn-small" onClick={() => setQtd(50)}>50</button>
              <button className="btn-small" onClick={() => setQtd(100)}>100</button>
              <button className="btn-small" onClick={() => setQtd(500)}>500</button>
              <button className="btn-small" onClick={() => setQtd(1000)}>1000</button>
              <button className="btn-small" onClick={() => setQtd(5000)}>5000</button>
            </div>

            <div className="simulacao-info">
              <span>Ano atual: <strong>{state.game.year}</strong></span>
              <span>→ Após simulação: <strong>{state.game.year + qtd}</strong></span>
            </div>

            <button className="btn-primary simulacao-btn" onClick={handleSimular}>
              ⚡ Simular {qtd} Temporada{qtd > 1 ? 's' : ''}
            </button>
          </>
        ) : (
          <div className="simulacao-progresso">
            <div className="simulacao-progresso-header">
              <span className="simulacao-spinner">⏳</span>
              <span>
                Simulando... {progress.atual}/{progress.total}
              </span>
            </div>

            <div className="simulacao-bar-wrapper">
              <div
                className="simulacao-bar"
                style={{ width: `${(progress.atual / progress.total) * 100}%` }}
              />
            </div>

            <div className="simulacao-progresso-info">
              {progress.campeao && (
                <span>🏆 {progress.ano}: <strong>{progress.campeao}</strong> campeão</span>
              )}
              <span>Ano atual: {progress.ano + 1}</span>
            </div>

            <button className="btn-danger simulacao-cancelar" onClick={handleCancel}>
              🛑 Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
