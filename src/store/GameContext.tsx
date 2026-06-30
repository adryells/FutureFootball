import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { GameState, EstadoTemporada, TabId, EstatSubTab, RecordesMainTab, RecordesSubTab, SortState, LastSeriesResults } from '../types';
import { initGameState, simularRodada, simularTodasRodadas, simularRestantes, iniciarNovoAno, gerarPremiacoes } from '../utils/gameLogic';
import { salvarAutosave, carregarAutosave, carregarSave, carregarAutosaveDB, carregarSaveDB, salvarSave, salvarAnoSimuladoDB } from '../utils/storage';

interface AppState {
  game: GameState;
  activeTab: TabId;
  currentRodada: number;
  jogadoresSort: SortState;
  historicoAnoSelecionado: string | null;
  estatSubTab: EstatSubTab;
  recordesMainTab: RecordesMainTab;
  recordesSubTab: RecordesSubTab;
  loading: boolean;
  notification: { message: string; type: 'success'|'error'|'info' } | null;
}

type Action =
  | { type: 'SET_GAME'; payload: GameState }
  | { type: 'UPDATE_GAME'; payload: Partial<GameState> }
  | { type: 'SET_ACTIVE_TAB'; payload: TabId }
  | { type: 'SET_RODADA'; payload: number }
  | { type: 'SET_JOGADORES_SORT'; payload: SortState }
  | { type: 'SET_HISTORICO_ANO'; payload: string }
  | { type: 'SET_ESTAT_SUBTAB'; payload: EstatSubTab }
  | { type: 'SET_RECORDES_MAIN_TAB'; payload: RecordesMainTab }
  | { type: 'SET_RECORDES_SUB_TAB'; payload: RecordesSubTab }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_NOTIFICATION'; payload: { message: string; type: 'success'|'error'|'info' } | null }
  | { type: 'UPDATE_STATE'; payload: EstadoTemporada }
  | { type: 'NEXT_YEAR'; payload: { game: GameState; rodada: number } }
  | { type: 'SET_LOGO_URL'; payload: string | null };

function createInitialState(): AppState {
  const autosave = carregarAutosave();
  const game = autosave || initGameState();
  return { game, activeTab: 'classificacao', currentRodada: 0, jogadoresSort: { col: 'num', asc: true }, historicoAnoSelecionado: null, estatSubTab: 'artilharia', recordesMainTab: 'campeoes', recordesSubTab: 'historicos', loading: false, notification: null };
}

function gameReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_GAME': return { ...state, game: action.payload };
    case 'UPDATE_GAME': return { ...state, game: { ...state.game, ...action.payload } };
    case 'SET_ACTIVE_TAB': return { ...state, activeTab: action.payload };
    case 'SET_RODADA': return { ...state, currentRodada: action.payload };
    case 'SET_JOGADORES_SORT': return { ...state, jogadoresSort: action.payload };
    case 'SET_HISTORICO_ANO': return { ...state, historicoAnoSelecionado: action.payload };
    case 'SET_ESTAT_SUBTAB': return { ...state, estatSubTab: action.payload };
    case 'SET_RECORDES_MAIN_TAB': return { ...state, recordesMainTab: action.payload };
    case 'SET_RECORDES_SUB_TAB': return { ...state, recordesSubTab: action.payload };
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_NOTIFICATION': return { ...state, notification: action.payload };
    case 'UPDATE_STATE': return { ...state, game: { ...state.game, state: action.payload } };
    case 'NEXT_YEAR': return { ...state, game: action.payload.game, currentRodada: action.payload.rodada };
    case 'SET_LOGO_URL': return { ...state, game: { ...state.game, _logoUrl: action.payload } };
    default: return state;
  }
}

interface GameContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  proximoAno: () => void;
  simularRodadaAtual: () => void;
  simularTodas: () => void;
  simularRestantesFn: () => void;
  setActiveTab: (tab: TabId) => void;
  showNotification: (message: string, type: 'success'|'error'|'info') => void;
  loadGame: (nome: string) => Promise<boolean>;
  saveGame: (nome: string) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const prevGameRef = useRef(state.game);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autosave com debounce de 2s
  useEffect(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      if (prevGameRef.current !== state.game) {
        salvarAutosave(state.game);
        prevGameRef.current = state.game;
      }
    }, 2000);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [state.game]);

  const showNotification = useCallback((message: string, type: 'success'|'error'|'info') => {
    dispatch({ type: 'SET_NOTIFICATION', payload: { message, type } });
    setTimeout(() => dispatch({ type: 'SET_NOTIFICATION', payload: null }), 3000);
  }, []);

  const proximoAno = useCallback(() => {
    const s = state.game.state;
    if (!s || !s.concluido) {
      showNotification('Complete a temporada atual primeiro!', 'error');
      return;
    }

    const currentYear = state.game.year;
    const { novoState, novaSeriesB, novaSeriesC, rebaixados, promovidos, resultadoB, resultadoC, campeao, rebaixadosB, estadoB, estadoC } =
      iniciarNovoAno(
        s.times,
        state.game.seriesB,
        state.game.seriesC,
        currentYear,
        currentYear,
        state.game.championships,
        state.game._campeoes,
        state.game  // passa o gameState para preservar o banco de jogadores
      );

    const lastSeriesResults: LastSeriesResults = {
      B: resultadoB,
      C: resultadoC,
      rebaixadosA: rebaixados,
      promovidosB: promovidos,
      rebaixadosB,
    };

    // Gerar premiações da temporada encerrada (bola de ouro, seleção)
    gerarPremiacoes(s);

    // Salvar histórico de premiações
    const bolaDeOuroHistorico = [...(state.game._bolaDeOuroHistorico || [])];
    const selecoesHistorico = [...(state.game._selecoesHistorico || [])];
    if (s._bolaDeOuro) {
      bolaDeOuroHistorico.push({
        ano: currentYear,
        ouro: s._bolaDeOuro.ouro,
        prata: s._bolaDeOuro.prata,
        bronze: s._bolaDeOuro.bronze,
      });
    }
    if (s._selecao) {
      selecoesHistorico.push({
        ano: currentYear,
        selecao: s._selecao,
      });
    }

    // Salvar a temporada que está sendo encerrada no IndexedDB
    const estadoParaDB: EstadoTemporada = JSON.parse(JSON.stringify(s));
    if (estadoParaDB.jogos) {
      for (const rodada of estadoParaDB.jogos) {
        for (const jogo of rodada) {
          jogo.golsInfo = [];
        }
      }
    }
    salvarAnoSimuladoDB(currentYear, 'A', estadoParaDB);
    if (estadoB) {
      const estadoBDB: EstadoTemporada = JSON.parse(JSON.stringify(estadoB));
      if (estadoBDB.jogos) {
        for (const rodada of estadoBDB.jogos) {
          for (const jogo of rodada) {
            jogo.golsInfo = [];
          }
        }
      }
      salvarAnoSimuladoDB(currentYear, 'B', estadoBDB);
    }
    if (estadoC) {
      const estadoCDB: EstadoTemporada = JSON.parse(JSON.stringify(estadoC));
      if (estadoCDB.jogos) {
        for (const rodada of estadoCDB.jogos) {
          for (const jogo of rodada) {
            jogo.golsInfo = [];
          }
        }
      }
      salvarAnoSimuladoDB(currentYear, 'C', estadoCDB);
    }

    const newGame: GameState = {
      ...state.game,
      year: currentYear + 1,
      state: novoState,
      seriesB: novaSeriesB,
      seriesC: novaSeriesC,
      lastSeriesResults,
      _bolaDeOuroHistorico: bolaDeOuroHistorico,
      _selecoesHistorico: selecoesHistorico,
      _jogadorHistoricoClubes: state.game._jogadorHistoricoClubes ?? [],
      _timesConhecidos: state.game._timesConhecidos ?? {},
      _proximoTimeId: state.game._proximoTimeId,
      _estadoB: estadoB,
      _estadoC: estadoC,
      _championshipsB: state.game._championshipsB ?? {},
      _championshipsC: state.game._championshipsC ?? {},
    };

    dispatch({ type: 'NEXT_YEAR', payload: { game: newGame, rodada: 0 } });
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'classificacao' });
    showNotification(`🏆 ${campeao} campeão! Avançando para ${currentYear + 1}`, 'success');
  }, [state.game, dispatch, showNotification]);

  const simularRodadaAtual = useCallback(() => {
    const s = state.game.state;
    if (!s || s.concluido) { showNotification('Campeonato já concluído!', 'error'); return; }
    simularRodada(s, state.currentRodada);
    dispatch({ type: 'UPDATE_STATE', payload: JSON.parse(JSON.stringify(s)) });
    showNotification('Rodada ' + (state.currentRodada + 1) + ' simulada!', 'success');
  }, [state.game.state, state.currentRodada, showNotification]);

  const simularTodas = useCallback(() => {
    const s = state.game.state;
    if (!s) return;
    simularTodasRodadas(s);
    dispatch({ type: 'UPDATE_STATE', payload: JSON.parse(JSON.stringify(s)) });
    showNotification('Todas as rodadas foram simuladas!', 'success');
  }, [state.game.state, showNotification]);

  const simularRestantesFn = useCallback(() => {
    const s = state.game.state;
    if (!s) return;
    simularRestantes(s);
    dispatch({ type: 'UPDATE_STATE', payload: JSON.parse(JSON.stringify(s)) });
    showNotification('Rodadas restantes simuladas!', 'success');
  }, [state.game.state, showNotification]);

  const setActiveTab = useCallback((tab: TabId) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab }), []);

  const loadGame = useCallback(async (nome: string): Promise<boolean> => {
    let data = carregarSave(nome);
    // Se não achou no localStorage, tenta IndexedDB
    if (!data) {
      data = await carregarSaveDB(nome);
    }
    if (data) { dispatch({ type: 'SET_GAME', payload: data }); dispatch({ type: 'SET_RODADA', payload: 0 }); showNotification('Save "' + nome + '" carregado!', 'success'); return true; }
    showNotification('Erro ao carregar save "' + nome + '"', 'error'); return false;
  }, [showNotification]);

  const saveGame = useCallback((nome: string) => {
    const result = salvarSave(nome, state.game);
    if (result.fallback) {
      showNotification('Jogo salvo em localStorage (IndexedDB não disponível)', 'info');
    } else {
      showNotification(`Jogo salvo como "${nome}"!`, 'success');
    }
  }, [state.game, showNotification]);

  return (
    <GameContext.Provider value={{ state, dispatch, proximoAno, simularRodadaAtual, simularTodas, simularRestantesFn, setActiveTab, showNotification, loadGame, saveGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame deve ser usado dentro de GameProvider');
  return ctx;
}
