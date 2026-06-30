import { useEffect, useState, useMemo } from 'react';
import { TimeLogo } from '../common/TimeLogo';
import { EstadoTemporada, Jogador, Time, MediaJogador, BolaDeOuroHistorico, SelecaoHistorico, CampeaoAno, JogadorHistoricoClube } from '../../types';
import { getMediaJogador } from '../../utils/gameLogic';
import { carregarAnoSimuladoDB, listarAnosSimuladosDB } from '../../utils/storage';
import './PlayerProfileModal.css';

interface PlayerSeason {
  ano: number;
  time: string;
  gols: number;
  assistencias: number;
  partidas: number;
  media: number;
  titulo?: 'campeao' | 'vice' | 'rebaixado';
  overall: number;
  idade: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  jogadorNome: string;
  /** ID unico do jogador no banco global (se conhecido) */
  jogadorId?: number;
  /** Dados do jogador da temporada atual (se disponivel) */
  jogadorAtual?: Jogador | null;
  timeAtual?: string;
  championships: Record<string, EstadoTemporada>;
  campeoes: Record<number, CampeaoAno>;
  bolaDeOuroHistorico?: BolaDeOuroHistorico[];
  selecoesHistorico?: SelecaoHistorico[];
  /** Banco global de todos os jogadores que ja existiram */
  todosJogadores?: Record<number, Jogador>;
  /** Historico completo de clubes por temporada */
  jogadorHistoricoClubes?: JogadorHistoricoClube[];
}

export function PlayerProfileModal({ isOpen, onClose, jogadorNome, jogadorId, jogadorAtual, timeAtual, championships, campeoes, bolaDeOuroHistorico, selecoesHistorico, todosJogadores, jogadorHistoricoClubes }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) setVisible(true);
    else {
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Escanear temporadas do jogador
  const temporadas = useMemo(() => {
    const list: PlayerSeason[] = [];
    const seen = new Set<string>(); // evitar duplicatas

    if (jogadorId !== undefined) {
      // === MODO COM ID: usa historico de clubes e championships somento para idade ===
      
      // Fonte 1: historico completo de clubes (cobre series A, B e C) - filtrado por ID
      if (jogadorHistoricoClubes) {
        for (const hc of jogadorHistoricoClubes) {
          if (hc.jogadorId !== jogadorId) continue;
          const key = `${hc.ano}-${hc.time}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const titulo = definirTitulo(hc.ano, hc.time, campeoes);
          list.push({
            ano: hc.ano,
            time: hc.time,
            gols: hc.gols,
            assistencias: hc.assistencias,
            partidas: hc.partidas,
            media: hc.media,
            titulo,
            overall: hc.overall,
            idade: 0, // preenchido abaixo via championships
          });
        }
      }

      // Fonte 2: championships - APENAS para preencher idade (nunca adiciona novos registros)
      for (const anoStr of Object.keys(championships)) {
        const ano = parseInt(anoStr);
        const s = championships[anoStr];
        if (!s?.times) continue;
        for (const [timeNome, time] of Object.entries(s.times)) {
          const j = time.jogadores?.find((jog: Jogador) => jog.id === jogadorId);
          if (j) {
            const existente = list.find(l => l.ano === ano && l.time === timeNome);
            if (existente) {
              existente.idade = j.idade;
            }
          }
        }
      }
    } else {
      // === MODO SEM ID (fallback): busca por nome em championships e DB ===
      for (const anoStr of Object.keys(championships)) {
        const ano = parseInt(anoStr);
        const s = championships[anoStr];
        if (!s?.times) continue;
        for (const [timeNome, time] of Object.entries(s.times)) {
          const j = time.jogadores?.find((jog: Jogador) => jog.nome === jogadorNome);
          if (j) {
            const key = `${ano}-${timeNome}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const media = getMediaJogador(j);
            const titulo = definirTitulo(ano, timeNome, campeoes);
            list.push({
              ano,
              time: timeNome,
              gols: j.gols,
              assistencias: j.assistencias,
              partidas: j.partidas || 0,
              media: media.temporada,
              titulo,
              overall: j.overall,
              idade: j.idade,
            });
          }
        }
      }
      // TODO: Carregar anos do DB que não estão em memória (modo sem ID)
      // Isso seria feito de forma assíncrona, mas para manter sincronia,
      // anos do DB para modo sem ID serão carregados via useEffect separado
    }

    // Ordenar do mais recente para o mais antigo
    list.sort((a, b) => b.ano - a.ano);
    return list;
  }, [championships, jogadorNome, jogadorId, campeoes, jogadorHistoricoClubes]);

  // Carregar temporadas do DB para modo sem ID (fallback)
  const [dbTemporadas, setDbTemporadas] = useState<PlayerSeason[]>([]);
  useEffect(() => {
    if (jogadorId !== undefined) {
      setDbTemporadas([]);
      return;
    }
    let cancelled = false;
    async function load() {
      const novas: PlayerSeason[] = [];
      try {
        const anos = await listarAnosSimuladosDB('A');
        for (const ano of anos) {
          const anoStr = String(ano);
          if (championships[anoStr]) continue;
          const estado = await carregarAnoSimuladoDB(ano, 'A') as any;
          if (!estado?.times) continue;
          for (const [timeNome, time] of Object.entries(estado.times)) {
            const t = time as Time;
            const j = t.jogadores?.find((jog: Jogador) => jog.nome === jogadorNome);
            if (j) {
              if (novas.some(n => n.ano === ano && n.time === timeNome)) continue;
              const media = getMediaJogador(j);
              const titulo = definirTitulo(ano, timeNome, campeoes);
              novas.push({
                ano, time: timeNome, gols: j.gols, assistencias: j.assistencias,
                partidas: j.partidas || 0, media: media.temporada,
                titulo, overall: j.overall, idade: j.idade,
              });
            }
          }
        }
      } catch(e) { console.warn('Erro ao carregar temporadas do DB:', e); }
      if (!cancelled) setDbTemporadas(novas);
    }
    load();
    return () => { cancelled = true; };
  }, [championships, jogadorNome, jogadorId, campeoes]);

  // Combinar temporadas da memória com as do DB
  const temporadasCombinadas = useMemo(() => {
    const map = new Map<string, PlayerSeason>();
    for (const t of temporadas) map.set(`${t.ano}-${t.time}`, t);
    for (const t of dbTemporadas) {
      const key = `${t.ano}-${t.time}`;
      if (!map.has(key)) map.set(key, t);
    }
    return Array.from(map.values()).sort((a, b) => b.ano - a.ano);
  }, [temporadas, dbTemporadas]);

  // Verificar se o jogador esta na temporada atual
  const infoAtual = jogadorAtual ? {
    time: timeAtual || '',
    overall: jogadorAtual.overall,
    idade: jogadorAtual.idade,
    posicao: jogadorAtual.posicao,
    gols: jogadorAtual.gols,
    assistencias: jogadorAtual.assistencias,
    partidas: jogadorAtual.partidas || 0,
    media: getMediaJogador(jogadorAtual).temporada,
    golsHist: jogadorAtual.golsHistorico,
    assistsHist: jogadorAtual.assistenciasHistorico,
  } : null;

  // Totais de carreira
  const totais = useMemo(() => {
    let gols = 0, ast = 0, part = 0;
    const seasons = jogadorId !== undefined ? temporadas : temporadasCombinadas;
    for (const t of seasons) {
      gols += t.gols;
      ast += t.assistencias;
      part += t.partidas;
    }
    // Se tem info atual (jogador no state atual), incluir gols historicos totais
    if (jogadorAtual) {
      gols = jogadorAtual.golsHistorico || gols;
      ast = jogadorAtual.assistenciasHistorico || ast;
    }
    return { gols, ast, part };
  }, [temporadas, temporadasCombinadas, jogadorAtual, jogadorId]);

  // Premiacoes - filtra por ID quando disponivel, senao por nome
  const premiacoes = useMemo(() => {
    const entries: { ano: number; tipo: string; detalhe: string }[] = [];
    (bolaDeOuroHistorico || []).forEach(h => {
      const matchId = (entry: { jogador: string; id?: number }) =>
        jogadorId !== undefined ? entry.id === jogadorId : entry.jogador === jogadorNome;
      if (matchId(h.ouro)) entries.push({ ano: h.ano, tipo: '🥇 Bola de Ouro', detalhe: `Nota ${h.ouro.nota.toFixed(1)} • ${h.ouro.time}` });
      if (matchId(h.prata)) entries.push({ ano: h.ano, tipo: '🥈 Bola de Ouro', detalhe: `Nota ${h.prata.nota.toFixed(1)} • ${h.prata.time}` });
      if (matchId(h.bronze)) entries.push({ ano: h.ano, tipo: '🥉 Bola de Ouro', detalhe: `Nota ${h.bronze.nota.toFixed(1)} • ${h.bronze.time}` });
    });
    (selecoesHistorico || []).forEach(h => {
      const sel = h.selecao;
      const todos = [
        sel.goleiro, ...sel.laterais, ...sel.zag,
        ...sel.volantes, ...sel.meias, ...sel.atacantes,
      ];
      const matchId = (e: { jogador: string; id?: number }) =>
        jogadorId !== undefined ? e.id === jogadorId : e.jogador === jogadorNome;
      const achou = todos.find(e => e && matchId(e));
      if (achou) {
        entries.push({ ano: h.ano, tipo: '🌟 Seleção da Temporada', detalhe: `${achou.posicao} • ${achou.time}` });
      }
    });
    entries.sort((a, b) => b.ano - a.ano);
    return entries;
  }, [bolaDeOuroHistorico, selecoesHistorico, jogadorNome, jogadorId]);

  if (!visible && !isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal player-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Cabecalho */}
        <div className="player-header">
          <div className="player-avatar">
            {infoAtual?.posicao ? (
              <span className="player-pos-badge">{infoAtual.posicao}</span>
            ) : (
              <span className="player-pos-badge">?</span>
            )}
          </div>
          <div className="player-info">
            <h2 className="player-nome">{jogadorNome}</h2>
            {infoAtual && (
              <div className="player-meta">
                <span>#{infoAtual.posicao}</span>
                <span>• {infoAtual.overall} OVR</span>
                <span>• {infoAtual.idade} anos</span>
                <span>• {infoAtual.time}</span>
              </div>
            )}
          </div>
        </div>

        {/* Totais de Carreira */}
        <div className="player-totais">
          <div className="total-card">
            <span className="total-valor">{totais.gols}</span>
            <span className="total-label">⚽ Gols</span>
          </div>
          <div className="total-card">
            <span className="total-valor">{totais.ast}</span>
            <span className="total-label">🅰 Assists</span>
          </div>
          <div className="total-card">
            <span className="total-valor">{totais.part}</span>
            <span className="total-label">📋 Partidas</span>
          </div>
          {infoAtual && (
            <div className="total-card">
              <span className="total-valor">{infoAtual.golsHist}</span>
              <span className="total-label">⚽ G. Hist.</span>
            </div>
          )}
        </div>

        {/* Premiacoes */}
        {premiacoes.length > 0 && (
          <div className="player-section">
            <h3>🏅 Premiações</h3>
            <div className="player-premios-lista">
              {premiacoes.map((p, i) => (
                <div key={i} className="player-premio-item">
                  <span className="premio-ano">{p.ano}</span>
                  <span className="premio-tipo">{p.tipo}</span>
                  <span className="premio-detalhe">{p.detalhe}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Temporadas */}
        <div className="player-section">
          <h3>📅 Histórico por Temporada</h3>
          {(jogadorId !== undefined ? temporadas : temporadasCombinadas).length === 0 ? (
            <div className="player-empty">Nenhum registro de temporadas anteriores.</div>
          ) : (
            <div className="player-seasons">
              <div className="ps-header">
                <span className="ps-ano">Ano</span>
                <span className="ps-id">ID</span>
                <span className="ps-time">Time</span>
                <span className="ps-gols">⚽</span>
                <span className="ps-ast">🅰</span>
                <span className="ps-jogos">📋</span>
                <span className="ps-media">Média</span>
                <span className="ps-ovr">OVR</span>
                <span className="ps-titulo">Título</span>
              </div>
              {(jogadorId !== undefined ? temporadas : temporadasCombinadas).map((t) => (
                <div key={`${t.ano}-${t.time}`} className="ps-row">
                  <span className="ps-ano">{t.ano}</span>
                  <span className="ps-id">{jogadorId ?? '?'}</span>
                  <span className="ps-time"><TimeLogo nome={t.time} size="mini" /> {t.time}</span>
                  <span className="ps-gols">{t.gols}</span>
                  <span className="ps-ast">{t.assistencias}</span>
                  <span className="ps-jogos">{t.partidas}</span>
                  <span className="ps-media">{t.media > 0 ? t.media.toFixed(1) : '-'}</span>
                  <span className="ps-ovr">{t.overall}</span>
                  <span className={`ps-titulo ${t.titulo ? 'ps-titulo-' + t.titulo : ''}`}>
                    {t.titulo === 'campeao' ? '🏆' : t.titulo === 'vice' ? '🥈' : t.titulo === 'rebaixado' ? '⬇' : '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="btn-primary" onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}

function definirTitulo(ano: number, timeNome: string, campeoes: Record<number, CampeaoAno>): 'campeao' | 'vice' | 'rebaixado' | undefined {
  const c = campeoes[ano];
  if (!c) return undefined;
  if (c.campeao === timeNome) return 'campeao';
  if (c.vice === timeNome) return 'vice';
  if (c.rebaixados?.includes(timeNome)) return 'rebaixado';
  return undefined;
}
