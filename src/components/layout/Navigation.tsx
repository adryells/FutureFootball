import { TabId } from '../../types';
import { useGame } from '../../store/GameContext';
import './Navigation.css';

const TABS: { id: TabId; label: string; icon: string; desc: string }[] = [
  { id: 'classificacao', label: 'Classificação', icon: '🏆', desc: 'Classificação das séries' },
  { id: 'rodadas', label: 'Rodadas', icon: '📅', desc: 'Jogos da rodada' },
  { id: 'estatisticas', label: 'Estatísticas', icon: '📊', desc: 'Números do campeonato' },
  { id: 'times', label: 'Times', icon: '👥', desc: 'Elenco dos times' },
  { id: 'historico', label: 'Histórico', icon: '📜', desc: 'Temporadas passadas' },
  { id: 'recordes', label: 'Recordes', icon: '🏅', desc: 'Títulos e artilheiros' },
];

export function Navigation() {
  const { state, setActiveTab } = useGame();

  return (
    <nav id="main-nav">
      {TABS.map(t => {
        const isActive = state.activeTab === t.id;
        return (
          <button
            key={t.id}
            className={'nav-btn' + (isActive ? ' active' : '')}
            onClick={() => setActiveTab(t.id)}
            title={t.desc}
          >
            <span className="nav-btn-icon">{t.icon}</span>
            <span className="nav-btn-label">{t.label}</span>
            {isActive && <span className="nav-btn-active-indicator" />}
          </button>
        );
      })}
    </nav>
  );
}
