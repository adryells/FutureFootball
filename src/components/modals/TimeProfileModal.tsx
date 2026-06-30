import { useEffect, useState, useMemo } from 'react';
import { TimeLogo } from '../common/TimeLogo';
import { GameState, Jogador, CampeaoAno, JogadorHistoricoClube, Time } from '../../types';
import { getMediaJogador } from '../../utils/gameLogic';
import { carregarAnoSimuladoDB, listarAnosSimuladosDB } from '../../utils/storage';
import './TimeProfileModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  timeId?: number;
  timeNome: string;
  game: GameState;
}

interface TimeHistoricoEntry {
  ano: number;
  divisao: 'A' | 'B' | 'C';
  posicao?: number;
  titulo?: 'campeao' | 'vice';
}

interface TimeIdolo {
  jogadorId: number;
  nome: string;
  gols: number;
  assistencias: number;
  partidas: number;
  media: number;
  overall: number;
}

export function TimeProfileModal({ isOpen, onClose, timeId, timeNome, game }: Props) {
  const [visible, setVisible] = useState(false);
  const [dbAnos, setDbAnos] = useState<number[]>([]);
  const [dbJogadores, setDbJogadores] = useState<any[]>([]);
  const [dbIdolos, setDbIdolos] = useState<TimeIdolo[]>([]);

  useEffect(() => {
    if (isOpen) setVisible(true);
    else {
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Carregar anos do DB
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const anos = await listarAnosSimuladosDB('A');
        if (!cancelled) setDbAnos(anos);
        
        // Buscar jogadores do time em anos do DB (não em memória)
        const anosMemoria = new Set(Object.keys(game.championships));
        const anosFaltando = anos.filter(a => !anosMemoria.has(String(a)));
        const todosJogadores: any[] = [];
        const todosIdolos: TimeIdolo[] = [];
        
        for (const ano of anosFaltando) {
          const estado = await carregarAnoSimuladoDB(ano, 'A') as any;
          if (!estado?.times?.[timeNome]) continue;
          const t = estado.times[timeNome] as Time;
          for (const j of t.jogadores) {
            todosJogadores.push({ ...j, ano, time: timeNome });
            // Ídolo: jogador com muitos gols/assistências na carreira
            const existente = todosIdolos.find(id => id.jogadorId === j.id);
            if (existente) {
              existente.gols += j.gols;
              existente.assistencias += j.assistencias;
              existente.partidas += j.partidas || 0;
            } else {
              const media = getMediaJogador(j);
              todosIdolos.push({
                jogadorId: j.id,
                nome: j.nome,
                gols: j.gols,
                assistencias: j.assistencias,
                partidas: j.partidas || 0,
                media: media.carreira,
                overall: j.overall,
              });
            }
          }
        }
        if (!cancelled) {
          setDbJogadores(todosJogadores);
          setDbIdolos(todosIdolos);
        }
      } catch(e) { console.warn('Erro carregar time do DB:', e); }
    }
    if (isOpen && timeNome) load();
    return () => { cancelled = true; };
  }, [isOpen, timeNome, game.championships]);

  // Informações básicas do time
  const timeInfo = useMemo(() => {
    // Procurar o time em championships (temporadas passadas) e no state atual
    const campAno = game.year;
    const estadoAtual = game.state;

    // Time atual
    let timeAtual = estadoAtual?.times?.[timeNome] ?? null;

    // Cores do time
    const cores = getTimeColors(timeNome);

    // Série atual
    let serieAtual: 'A' | 'B' | 'C' = 'A';
    if (game.seriesB?.includes(timeNome)) serieAtual = 'B';
    else if (game.seriesC?.includes(timeNome)) serieAtual = 'C';

    // Força
    const forca = timeAtual?.forca ?? 0;

    return { timeAtual, cores, serieAtual, forca };
  }, [game, timeNome]);

  // Histórico do time por ano (divisão, posição, títulos)
  const historico = useMemo(() => {
    const list: TimeHistoricoEntry[] = [];

    // Percorrer championships em memória para ver em quais anos o time apareceu
    for (const anoStr of Object.keys(game.championships)) {
      const ano = parseInt(anoStr);
      const s = game.championships[anoStr];
      if (!s?.times) continue;

      // Em qual divisão o time estava neste ano?
      if (s.times[timeNome]) {
        // Estava na Série A
        const posicao = calcularPosicao(s.times, timeNome);
        const c = game._campeoes?.[ano];
        let titulo: 'campeao' | 'vice' | undefined;
        if (c?.campeao === timeNome) titulo = 'campeao';
        else if (c?.vice === timeNome) titulo = 'vice';

        list.push({
          ano,
          divisao: 'A',
          posicao,
          titulo,
        });
      }
    }

    // Ver séries B e C nos lastSeriesResults
    // Também podemos ver pelos anos em _timesConhecidos
    // Para séries B e C, não temos dados completos de campeonato, 
    // mas sabemos quando o time esteve nelas

    list.sort((a, b) => b.ano - a.ano);
    return list;
  }, [game, timeNome]);

  // Títulos
  const titulos = useMemo(() => {
    const lista: { ano: number; tipo: string }[] = [];
    const campeoes = game._campeoes ?? {};
    for (const anoStr of Object.keys(campeoes)) {
      const ano = parseInt(anoStr);
      const c = campeoes[ano];
      if (c.campeao === timeNome) {
        lista.push({ ano, tipo: '🏆 Série A' });
      }
      if (c.vice === timeNome) {
        lista.push({ ano, tipo: '🥈 Vice Série A' });
      }
    }
    // Títulos de B e C (por promocao)
    // Podemos extrair dos resultados de série B e C
    lista.sort((a, b) => b.ano - a.ano);
    return lista;
  }, [game, timeNome]);

  // Principais jogadores da história do time (ídolos)
  const idolos = useMemo(() => {
    const mapa = new Map<number, TimeIdolo>();
    const clubes = game._jogadorHistoricoClubes ?? [];

    for (const hc of clubes) {
      if (hc.time !== timeNome) continue;

      const existente = mapa.get(hc.jogadorId);
      if (existente) {
        existente.gols += hc.gols;
        existente.assistencias += hc.assistencias;
        existente.partidas += hc.partidas;
        existente.media = Math.max(existente.media, hc.media);
        existente.overall = Math.max(existente.overall, hc.overall);
      } else {
        mapa.set(hc.jogadorId, {
          jogadorId: hc.jogadorId,
          nome: hc.jogadorNome,
          gols: hc.gols,
          assistencias: hc.assistencias,
          partidas: hc.partidas,
          media: hc.media,
          overall: hc.overall,
        });
      }
    }

    // Ordenar por gols (depois partidas como desempate)
    return Array.from(mapa.values())
      .sort((a, b) => {
        if (b.gols !== a.gols) return b.gols - a.gols;
        if (b.partidas !== a.partidas) return b.partidas - a.partidas;
        return b.media - a.media;
      })
      .slice(0, 30);
  }, [game, timeNome]);

  // Estatísticas gerais
  const estatisticas = useMemo(() => {
    let totalGols = 0, totalAssists = 0, totalPartidas = 0;
    let totalVitorias = 0, totalEmpates = 0, totalDerrotas = 0;

    // Percorrer championships em memória
    for (const anoStr of Object.keys(game.championships)) {
      const s = game.championships[anoStr];
      if (!s?.times?.[timeNome]) continue;
      const t = s.times[timeNome];
      totalVitorias += t.vitorias || 0;
      totalEmpates += t.empates || 0;
      totalDerrotas += t.derrotas || 0;
      totalGols += t.golsPro || 0;
      totalGols += t.golsContra || 0; // não, isso seria gols sofridos
    }

    // Gols a partir do histórico de jogadores
    for (const hc of game._jogadorHistoricoClubes ?? []) {
      if (hc.time !== timeNome) continue;
      totalGols += hc.gols;
      totalAssists += hc.assistencias;
      totalPartidas += hc.partidas;
    }

    // Temporada atual
    if (game.state?.times?.[timeNome]) {
      const t = game.state.times[timeNome];
      totalVitorias += t.vitorias || 0;
      totalEmpates += t.empates || 0;
      totalDerrotas += t.derrotas || 0;
    }

    return { totalGols, totalAssists, totalPartidas, totalVitorias, totalEmpates, totalDerrotas };
  }, [game, timeNome]);

  // Formação do time atual
  const formacaoAtual = timeInfo.timeAtual?.formacao;
  const formacaoMap = useMemo(() => {
    if (!timeInfo.timeAtual) return null;
    const formacoes: Record<string, string[]> = {
      '4-4-2': ['GOL', 'LD', 'ZAG', 'ZAG', 'LE', 'VOL', 'MEI', 'MEI', 'ATA', 'ATA'],
      '4-3-3': ['GOL', 'LD', 'ZAG', 'ZAG', 'LE', 'VOL', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA'],
      '3-5-2': ['GOL', 'ZAG', 'ZAG', 'ZAG', 'LD', 'VOL', 'MEI', 'MEI', 'LE', 'ATA', 'ATA'],
      '4-2-3-1': ['GOL', 'LD', 'ZAG', 'ZAG', 'LE', 'VOL', 'VOL', 'MEI', 'MEI', 'MEI', 'ATA'],
      '4-1-4-1': ['GOL', 'LD', 'ZAG', 'ZAG', 'LE', 'VOL', 'MEI', 'MEI', 'MEI', 'MEI', 'ATA'],
      '3-4-3': ['GOL', 'ZAG', 'ZAG', 'ZAG', 'LD', 'VOL', 'MEI', 'LE', 'ATA', 'ATA', 'ATA'],
    };
    return formacoes[formacaoAtual ?? ''] || null;
  }, [formacaoAtual]);

  if (!visible && !isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal time-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Cabeçalho */}
        <div className="time-header">
          <div
            className="time-avatar"
            style={{
              background: `linear-gradient(135deg, ${timeInfo.cores[0]}, ${timeInfo.cores[1]})`,
            }}
          >
            {timeNome.substring(0, 2).toUpperCase()}
          </div>
          <div className="time-info">
            <h2 className="time-nome">
              <TimeLogo nome={timeNome} size="normal" /> {timeNome}
            </h2>
            <div className="time-meta">
              <span>🆔 {timeId ?? '?'}</span>
              <span
                className={
                  timeInfo.serieAtual === 'A' ? 'time-divisao-A' :
                  timeInfo.serieAtual === 'B' ? 'time-divisao-B' :
                  'time-divisao-C'
                }
              >
                Série {timeInfo.serieAtual}
              </span>
              <span>💪 {timeInfo.forca} OVR</span>
              <span>🏆 {titulos.length} títulos</span>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="time-section">
          <h3>📊 Estatísticas</h3>
          <div className="time-stats-grid">
            <div className="time-stat-card">
              <span className="time-stat-valor">{estatisticas.totalVitorias}</span>
              <span className="time-stat-label">Vitórias</span>
            </div>
            <div className="time-stat-card">
              <span className="time-stat-valor">{estatisticas.totalEmpates}</span>
              <span className="time-stat-label">Empates</span>
            </div>
            <div className="time-stat-card">
              <span className="time-stat-valor">{estatisticas.totalDerrotas}</span>
              <span className="time-stat-label">Derrotas</span>
            </div>
            <div className="time-stat-card">
              <span className="time-stat-valor">{estatisticas.totalGols}</span>
              <span className="time-stat-label">⚽ Gols</span>
            </div>
            <div className="time-stat-card">
              <span className="time-stat-valor">{estatisticas.totalAssists}</span>
              <span className="time-stat-label">🅰 Assists</span>
            </div>
            <div className="time-stat-card">
              <span className="time-stat-valor">{estatisticas.totalPartidas}</span>
              <span className="time-stat-label">📋 Partidas</span>
            </div>
          </div>
        </div>

        {/* Títulos */}
        {titulos.length > 0 && (
          <div className="time-section">
            <h3>🏆 Títulos</h3>
            <div className="time-titulos-lista">
              {titulos.map((t, i) => (
                <div key={i} className="time-titulo-item">
                  <span className="time-titulo-ano">{t.ano}</span>
                  <span className="time-titulo-nome">{t.tipo}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time atual no campo */}
        {timeInfo.timeAtual && formacaoMap && (
          <div className="time-section">
            <h3>⚽ Time Atual ({formacaoAtual})</h3>
            <div className="time-campo">
              {/* Goleiro */}
              <div className="time-campo-linha">
                {timeInfo.timeAtual.jogadores
                  .filter(j => j.posicao === 'GOL')
                  .slice(0, 1)
                  .map(j => (
                    <div
                      key={j.id}
                      className="time-campo-jogador"
                      onClick={() => abrirPerfilJogador(j.id, j.nome)}
                    >
                      <span className="time-campo-jogador-pos">GOL</span>
                      <span className="time-campo-jogador-nome">{j.nome.split(' ')[0]}</span>
                    </div>
                  ))}
              </div>

              <div className="time-campo-divisoria" />

              {/* Linhas defensivas: ZAG, LD, LE */}
              <div className="time-campo-linha">
                {timeInfo.timeAtual.jogadores
                  .filter(j => ['LD', 'ZAG', 'LE'].includes(j.posicao))
                  .slice(0, 4)
                  .map(j => (
                    <div
                      key={j.id}
                      className="time-campo-jogador"
                      onClick={() => abrirPerfilJogador(j.id, j.nome)}
                    >
                      <span className="time-campo-jogador-pos">{j.posicao}</span>
                      <span className="time-campo-jogador-nome">{j.nome.split(' ')[0]}</span>
                    </div>
                  ))}
              </div>

              <div className="time-campo-divisoria" />

              {/* Meio-campo: VOL, MEI */}
              <div className="time-campo-linha">
                {timeInfo.timeAtual.jogadores
                  .filter(j => ['VOL', 'MEI'].includes(j.posicao))
                  .slice(0, 4)
                  .map(j => (
                    <div
                      key={j.id}
                      className="time-campo-jogador"
                      onClick={() => abrirPerfilJogador(j.id, j.nome)}
                    >
                      <span className="time-campo-jogador-pos">{j.posicao}</span>
                      <span className="time-campo-jogador-nome">{j.nome.split(' ')[0]}</span>
                    </div>
                  ))}
              </div>

              <div className="time-campo-divisoria" />

              {/* Ataque */}
              <div className="time-campo-linha">
                {timeInfo.timeAtual.jogadores
                  .filter(j => j.posicao === 'ATA')
                  .slice(0, 3)
                  .map(j => (
                    <div
                      key={j.id}
                      className="time-campo-jogador"
                      onClick={() => abrirPerfilJogador(j.id, j.nome)}
                    >
                      <span className="time-campo-jogador-pos">ATA</span>
                      <span className="time-campo-jogador-nome">{j.nome.split(' ')[0]}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Histórico por temporada */}
        {historico.length > 0 && (
          <div className="time-section">
            <h3>📅 Histórico na Série A</h3>
            <div className="time-historico">
              <div className="th-header">
                <span className="th-ano">Ano</span>
                <span className="th-divisao">Div</span>
                <span className="th-pos">Pos</span>
                <span className="th-titulo">Título</span>
              </div>
              {historico.map((h) => (
                <div key={h.ano} className="th-row">
                  <span className="th-ano">{h.ano}</span>
                  <span className={`th-divisao time-divisao-${h.divisao}`}>
                    Série {h.divisao}
                  </span>
                  <span className="th-pos">{h.posicao != null ? `${h.posicao}º` : '-'}</span>
                  <span className="th-titulo">
                    {h.titulo === 'campeao' ? '🏆' : h.titulo === 'vice' ? '🥈' : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ídolos / Principais Jogadores */}
        {idolos.length > 0 && (
          <div className="time-section">
            <h3>⭐ Principais Jogadores da História</h3>
            <div className="time-idolos">
              {idolos.slice(0, 15).map((idolo, i) => (
                <div
                  key={idolo.jogadorId}
                  className="time-idolo-item"
                  onClick={() => abrirPerfilJogador(idolo.jogadorId, idolo.nome)}
                >
                  <span style={{ fontWeight: 700, color: 'var(--text-dim)', minWidth: 24 }}>
                    {i + 1}º
                  </span>
                  <div className="time-idolo-info">
                    <div className="time-idolo-nome">{idolo.nome}</div>
                    <div className="time-idolo-stats">
                      <span>⚽ {idolo.gols}</span>
                      <span>🅰 {idolo.assistencias}</span>
                      <span>📋 {idolo.partidas} jogos</span>
                      <span className="time-idolo-nota">{idolo.media.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão para abrir perfil de jogador - será implementado via evento */}
        <button className="btn-primary" onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}

function getTimeColors(nome: string): [string, string] {
  // Cores baseadas no time (simplificado)
  const cores: Record<string, [string, string]> = {
    'Flamengo': ['#cc0000', '#000000'],
    'Palmeiras': ['#006635', '#ffffff'],
    'Santos': ['#000000', '#ffffff'],
    'Corinthians': ['#000000', '#ffffff'],
    'São Paulo': ['#cc0000', '#000000'],
    'Grêmio': ['#0066b3', '#ffffff'],
    'Internacional': ['#cc0000', '#ffffff'],
    'Cruzeiro': ['#003da5', '#ffffff'],
    'Atlético-MG': ['#000000', '#ffffff'],
    'Botafogo': ['#000000', '#ffffff'],
    'Fluminense': ['#8b0000', '#005522'],
    'Vasco': ['#000000', '#ffffff'],
    'Bahia': ['#0033cc', '#ffffff'],
    'Athletico-PR': ['#cc0000', '#000000'],
    'Goiás': ['#006633', '#ffffff'],
    'Coritiba': ['#006633', '#ffffff'],
    'Sport': ['#cc0000', '#000000'],
    'Fortaleza': ['#0033cc', '#ffffff'],
    'Ceará': ['#000000', '#cccccc'],
    'Chapecoense': ['#006633', '#ffffff'],
    'Atlético-GO': ['#cc0000', '#ffffff'],
    'Cuiabá': ['#005522', '#ffff00'],
    'Juventude': ['#006633', '#ffffff'],
    'Red Bull Bragantino': ['#cc0000', '#ffffff'],
    'Vitória': ['#cc0000', '#000000'],
    'América-MG': ['#006633', '#ffffff'],
    'Ponte Preta': ['#000000', '#ffffff'],
    'Guarani': ['#006633', '#ffffff'],
    'Brusque': ['#ffff00', '#000000'],
    'Náutico': ['#cc0000', '#ffffff'],
    'Santa Cruz': ['#cc0000', '#000000'],
    'Avaí': ['#0033cc', '#ffffff'],
    'Criciúma': ['#ffff00', '#000000'],
    'Vila Nova': ['#cc0000', '#ffffff'],
    'Novorizontino': ['#ff6600', '#ffffff'],
    'Mirassol': ['#006633', '#ffffff'],
    'Sampaio Corrêa': ['#006633', '#ffffff'],
    'CRB': ['#cc0000', '#ffffff'],
    'CSA': ['#0033cc', '#ffffff'],
    'Remo': ['#003da5', '#ffffff'],
    'Paysandu': ['#003da5', '#ffffff'],
    'Londrina': ['#0033cc', '#ffffff'],
    'Operário': ['#000000', '#ffffff'],
    'Tombense': ['#cc0000', '#ffffff'],
    'Volta Redonda': ['#006633', '#ffffff'],
    'ABC': ['#cc0000', '#ffffff'],
    'Botafogo-PB': ['#006633', '#ffffff'],
    'Confiança': ['#cc0000', '#ffffff'],
    'Ituano': ['#cc0000', '#000000'],
    'São Bernardo': ['#0033cc', '#ffffff'],
    'Ferroviário': ['#cc0000', '#ffffff'],
    'Floresta': ['#0033cc', '#ffffff'],
    'Manaus': ['#003da5', '#ffffff'],
    'Ypiranga': ['#006633', '#ffffff'],
    'Figueirense': ['#000000', '#ffffff'],
    'Joinville': ['#cc0000', '#ffffff'],
    'Brasil de Pelotas': ['#ffff00', '#000000'],
    'EC São José': ['#0033cc', '#ffffff'],
  };
  return cores[nome] || ['#333333', '#ffffff'];
}

function calcularPosicao(times: Record<string, Time>, timeNome: string): number {
  const sorted = Object.values(times).sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
    return (b.golsPro - b.golsContra) - (a.golsPro - a.golsContra);
  });
  const idx = sorted.findIndex(t => t.nome === timeNome);
  return idx >= 0 ? idx + 1 : 0;
}

function abrirPerfilJogador(id: number, nome: string) {
  window.dispatchEvent(new CustomEvent('open-player-profile', {
    detail: { nome, id },
  }));
}
