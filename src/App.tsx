import { useState, useCallback, useEffect } from 'react';
import { GameProvider, useGame } from './store/GameContext';
import { initGameState, setActivePrefs, clearActivePrefs, getJogadorPorId } from './utils/gameLogic';
import { resetarJogo, carregarAutosave } from './utils/storage';
import { PrefsPorSerie, Jogador } from './types';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { ClassificationTab } from './components/tabs/ClassificacaoTab';
import { RodadasTab } from './components/tabs/RodadasTab';
import { EstatisticasTab } from './components/tabs/EstatisticasTab';
import { TimesTab } from './components/tabs/TimesTab';
import { HistoricoTab } from './components/tabs/HistoricoTab';
import { RecordesTab } from './components/tabs/RecordesTab';
import { SettingsModal } from './components/modals/SettingsModal';
import { TimePrefsModal } from './components/modals/TimePrefsModal';
import { PlayerProfileModal } from './components/modals/PlayerProfileModal';
import { TimeProfileModal } from './components/modals/TimeProfileModal';
import { Notification } from './components/common/Notification';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function AppContent() {
  const { state, dispatch } = useGame();
  const [showSettings, setShowSettings] = useState(false);

  // Modais globais (acessiveis de qualquer aba)
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [playerModalName, setPlayerModalName] = useState('');
  const [playerModalId, setPlayerModalId] = useState<number | undefined>(undefined);
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [timeModalId, setTimeModalId] = useState<number | undefined>(undefined);
  const [timeModalName, setTimeModalName] = useState('');

  // Listeners globais para eventos de profile
  useEffect(() => {
    function playerHandler(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.nome) {
        setPlayerModalName(detail.nome);
        setPlayerModalId(detail.id);
        setPlayerModalOpen(true);
      }
    }
    function timeHandler(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.nome) {
        setTimeModalName(detail.nome);
        setTimeModalId(detail.id);
        setTimeModalOpen(true);
      }
    }
    window.addEventListener('open-player-profile', playerHandler);
    window.addEventListener('open-time-profile', timeHandler);
    return () => {
      window.removeEventListener('open-player-profile', playerHandler);
      window.removeEventListener('open-time-profile', timeHandler);
    };
  }, []);

  // Info atual do jogador no modal
  const infoAtual = (() => {
    if (playerModalId !== undefined) {
      const j = getJogadorPorId(state.game, playerModalId);
      if (j && !j.aposentado) {
        const s = state.game.state;
        if (s?.times) {
          for (const [timeNome, time] of Object.entries(s.times)) {
            if (time.jogadores?.some((jog: Jogador) => jog.id === playerModalId)) {
              return { jogador: j, time: timeNome };
            }
          }
        }
      }
    }
    // Fallback: busca por nome
    const s = state.game.state;
    if (!s?.times) return null;
    for (const [timeNome, time] of Object.entries(s.times)) {
      const j = time.jogadores?.find((jog: Jogador) => jog.nome === playerModalName);
      if (j) return { jogador: j, time: timeNome };
    }
    return null;
  })();

  // So mostra o modal de preferencias se NAO houver autosave
  const [showTimePrefs, setShowTimePrefs] = useState(() => {
    return !carregarAutosave();
  });

  const handlePrefsConfirm = useCallback((prefs: PrefsPorSerie) => {
    setShowTimePrefs(false);
    setActivePrefs(prefs);
    const freshGame = initGameState(prefs);
    dispatch({ type: 'SET_GAME', payload: freshGame });
    dispatch({ type: 'SET_RODADA', payload: 0 });
  }, [dispatch]);

  return (
    <div id="app">
      <Header onSettings={() => setShowSettings(true)} />
      <Navigation />

      <main>
        <ErrorBoundary>
          {state.activeTab === 'classificacao' && <ClassificationTab />}
          {state.activeTab === 'rodadas' && <RodadasTab />}
          {state.activeTab === 'estatisticas' && <EstatisticasTab />}
          {state.activeTab === 'times' && <TimesTab />}
          {state.activeTab === 'historico' && <HistoricoTab />}
          {state.activeTab === 'recordes' && <RecordesTab />}
        </ErrorBoundary>
      </main>

      <footer>
        <p>Brasileirao Simulator (c) {state.game.year}</p>
      </footer>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Modais globais */}
      <PlayerProfileModal
        isOpen={playerModalOpen}
        onClose={() => setPlayerModalOpen(false)}
        jogadorNome={playerModalName}
        jogadorId={playerModalId}
        championships={state.game.championships}
        campeoes={state.game._campeoes}
        bolaDeOuroHistorico={state.game._bolaDeOuroHistorico}
        selecoesHistorico={state.game._selecoesHistorico}
        jogadorAtual={infoAtual?.jogador || null}
        timeAtual={infoAtual?.time || undefined}
        todosJogadores={state.game._todosJogadores}
        jogadorHistoricoClubes={state.game._jogadorHistoricoClubes}
      />
      <TimeProfileModal
        isOpen={timeModalOpen}
        onClose={() => setTimeModalOpen(false)}
        timeId={timeModalId}
        timeNome={timeModalName}
        game={state.game}
      />

      {/* Modal de preferencias (abre antes de iniciar ou no reset) */}
      <TimePrefsModal isOpen={showTimePrefs} onConfirm={handlePrefsConfirm} />

      <Notification />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
