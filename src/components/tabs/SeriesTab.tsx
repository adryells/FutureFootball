import { useState } from 'react';
import { useGame } from '../../store/GameContext';
import { gerarClassificacao, criarTimes, gerarRodadas, simularTodasRodadas } from '../../utils/gameLogic';
import { TimeLogo } from '../common/TimeLogo';

export function SeriesTab({ serie }: { serie: 'B' | 'C' }) {
  const { state } = useGame();
  const seriesLista = serie === 'B' ? state.game.seriesB : state.game.seriesC;
  const [classificacao, setClassificacao] = useState<{ nome: string; pontos: number; vitorias: number; empates: number; derrotas: number; golsPro: number; golsContra: number; jogos: number }[] | null>(null);

  function handleSimular() {
    const times = criarTimes(seriesLista);
    const jogos = gerarRodadas(seriesLista);
    const estadoTemp = { times, jogos } as any;
    simularTodasRodadas(estadoTemp);
    const classif = Object.values(times).sort((a: any, b: any) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      const sgA = a.golsPro - a.golsContra;
      const sgB = b.golsPro - b.golsContra;
      if (sgB !== sgA) return sgB - sgA;
      return b.golsPro - a.golsPro;
    });
    setClassificacao(classif.map((t: any) => ({
      nome: t.nome, pontos: t.pontos, vitorias: t.vitorias,
      empates: t.empates, derrotas: t.derrotas,
      golsPro: t.golsPro, golsContra: t.golsContra, jogos: t.jogos
    })));
  }

  function getZona(idx: number): string {
    if (!classificacao) return '';
    if (idx < 4) return 'zona-liberta';       // promoção
    if (idx >= seriesLista.length - 4) return 'zona-rebaixamento';  // rebaixamento
    return '';
  }

  return (
    <section className="tab-content active">
      <div className="tab-header">
        <h2>Série {serie}</h2>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {classificacao && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {classificacao.length} times
            </span>
          )}
          <button className="btn-primary" onClick={handleSimular}>
            Simular Série {serie}
          </button>
        </div>
      </div>
      {!classificacao ? (
        <div style={{ padding: 16, color: 'var(--text-dim)', textAlign: 'center' }}>
          Clique em "Simular Série {serie}" para ver a classificação.
        </div>
      ) : (
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
              </tr>
            </thead>
            <tbody>
              {classificacao.map((item, idx) => {
                const sg = item.golsPro - item.golsContra;
                return (
                  <tr key={item.nome} className={getZona(idx)}>
                    <td>{idx + 1}</td>
                    <td><TimeLogo nome={item.nome} size="mini" /> {item.nome}</td>
                    <td><strong>{item.pontos}</strong></td>
                    <td>{item.jogos}</td>
                    <td>{item.vitorias}</td>
                    <td>{item.empates}</td>
                    <td>{item.derrotas}</td>
                    <td>{item.golsPro}</td>
                    <td>{item.golsContra}</td>
                    <td>{sg > 0 ? '+' : ''}{sg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="legenda">
        <span className="leg-item zona-liberta">
          {serie === 'B' ? 'Acesso à Série A' : 'Acesso à Série B'}
        </span>
        <span className="leg-item zona-rebaixamento">
          {serie === 'B' ? 'Rebaixamento à Série C' : 'Rebaixamento'}
        </span>
      </div>
    </section>
  );
}
