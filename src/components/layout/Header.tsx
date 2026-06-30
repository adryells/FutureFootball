import { useGame } from '../../store/GameContext';
export function Header({onSettings}:{onSettings:()=>void}) {
  const {state}=useGame();
  return (
    <header>
      <div id="header-top"><h1>⚽ Brasileirão Simulator</h1><div id="header-controls">
        <button className="btn-small" onClick={onSettings}>⚙️ Configurações</button>
      </div></div>
      <div id="year-display">Brasileirão {state.game.year}</div>
    </header>
  );
}
