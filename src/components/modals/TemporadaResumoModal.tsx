import { useEffect, useState } from 'react';
import { TimeLogo } from '../common/TimeLogo';
import { LastSeriesResults, EstadoTemporada, Posicao, SelecaoEntry } from '../../types';
import { getEstatisticas, gerarPremiacoes } from '../../utils/gameLogic';
import './TemporadaResumoModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lastResults: LastSeriesResults | null;
  ano: number;
  seasonData: EstadoTemporada | null;
}

const POSICAO_NOME: Record<Posicao, string> = {
  GOL: 'Goleiro', ZAG: 'Zagueiro', LD: 'Lateral D', LE: 'Lateral E',
  VOL: 'Volante', MEI: 'Meia', ATA: 'Atacante'
};

export function TemporadaResumoModal({ isOpen, onClose, lastResults, ano, seasonData }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible && !isOpen) return null;
  if (!seasonData || !isOpen) return null;

  // Gerar premiações se não existirem ainda (para exibição no modal)
  if (!seasonData._bolaDeOuro) {
    gerarPremiacoes(seasonData);
  }

  const year = ano;
  
  const campeao = seasonData._campeao || 'Desconhecido';
  const vice = seasonData._vice || '';
  const rebaixadosA = seasonData._rebaixados || [];
  const bolaDeOuro = seasonData._bolaDeOuro;
  const selecao = seasonData._selecao;

  // Pega classificação pra saber pontos do campeão
  const timesList = Object.values(seasonData.times || {}) as any[];
  timesList.sort((a: any, b: any) => b.pontos - a.pontos || (b.golsPro - b.golsContra) - (a.golsPro - a.golsContra));
  const campeaoObj = timesList.find((t: any) => t.nome === campeao);
  const campeaoPontos = campeaoObj ? campeaoObj.pontos : '?';

  const estat = getEstatisticas(seasonData);
  const artilheiro = estat.artilheiros[0];
  const assistente = estat.assistencias[0];

  // Rebaixados da Série B para C
  const rebaixadosB = lastResults?.rebaixadosB || lastResults?.B?.classificacao?.slice(-4).map((t: { nome: string }) => t.nome) || [];

  // Promovidos da Série C para B
  const promovidosC = lastResults?.C?.promovidos || [];

  return (
    <div className="modal-overlay active resumo-overlay" onClick={onClose}>
      <div className="modal resumo-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* === TROFÉU / CABEÇALHO === */}
        <span className="resumo-trophy">🏆</span>
        <div className="resumo-ano">Brasileirão {year}</div>
        <div className="resumo-campeao">{campeao}</div>
        <div className="resumo-pontos">
          {campeaoPontos} pontos
          {campeaoObj && ` • ${(campeaoObj as any).vitorias}V ${(campeaoObj as any).empates}E ${(campeaoObj as any).derrotas}D`}
        </div>
        {vice && <div className="resumo-vice">Vice-campeão: {vice}</div>}

        {/* === LINHA DIVISÓRIA === */}
        <div className="resumo-divider" />

        {/* === BOLA DE OURO === */}
        {bolaDeOuro && (
          <div className="resumo-section resumo-section-premios">
            <h4>⭐ Bola de Ouro {year}</h4>
            <div className="bdo-podium">
              <BdoCard tipo="bronze" entry={bolaDeOuro.bronze} />
              <BdoCard tipo="ouro" entry={bolaDeOuro.ouro} />
              <BdoCard tipo="prata" entry={bolaDeOuro.prata} />
            </div>
          </div>
        )}

        {/* === SELEÇÃO DA TEMPORADA === */}
        {selecao && (
          <div className="resumo-section resumo-section-premios">
            <h4>🌟 Seleção da Temporada {year}</h4>
            <div className="sel-campo">
              {/* Goleiro */}
              {selecao.goleiro && selecao.goleiro.jogador !== '-' && (
                <div className="sel-linha sel-linha-gol">
                  <SelJogador entry={selecao.goleiro} pos="GOL" />
                </div>
              )}

              {/* Defesa: LD + 2 ZAG + LE */}
              <div className="sel-linha sel-linha-def">
                {selecao.laterais?.filter((e: SelecaoEntry) => e.posicao === 'LD').map((e: SelecaoEntry) => (
                  <SelJogador key="ld" entry={e} pos="LD" />
                ))}
                {selecao.zag?.map((e: SelecaoEntry, i: number) => (
                  <SelJogador key={'zag-' + i} entry={e} pos="ZAG" />
                ))}
                {selecao.laterais?.filter((e: SelecaoEntry) => e.posicao === 'LE').map((e: SelecaoEntry) => (
                  <SelJogador key="le" entry={e} pos="LE" />
                ))}
              </div>

              {/* Meio: VOL + MEI + MEI */}
              <div className="sel-linha sel-linha-mei">
                {selecao.volantes?.map((e: SelecaoEntry, i: number) => (
                  <SelJogador key={'vol-' + i} entry={e} pos="VOL" />
                ))}
                {selecao.meias?.map((e: SelecaoEntry, i: number) => (
                  <SelJogador key={'mei-' + i} entry={e} pos="MEI" />
                ))}
              </div>

              {/* Ataque: ATA + ATA + ATA */}
              <div className="sel-linha sel-linha-ata">
                {selecao.atacantes?.map((e: SelecaoEntry, i: number) => (
                  <SelJogador key={'ata-' + i} entry={e} pos="ATA" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === DESTAQUES ESTATÍSTICOS === */}
        {(artilheiro || assistente) && (
          <div className="resumo-section">
            <h4>⚽ Destaques Estatísticos</h4>
            <div className="resumo-destaques">
              {artilheiro && (
                <div className="resumo-destaque-card">
                  <span className="destaque-icon">⚽</span>
                  <div className="destaque-nome">{artilheiro.nome}</div>
                  <div className="destaque-valor">{artilheiro.time} • {artilheiro.gols} gols</div>
                </div>
              )}
              {assistente && (
                <div className="resumo-destaque-card">
                  <span className="destaque-icon">🅰</span>
                  <div className="destaque-nome">{assistente.nome}</div>
                  <div className="destaque-valor">{assistente.time} • {assistente.assists} assists</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === MOVIMENTAÇÃO SÉRIE A ↔ B === */}
        <div className="resumo-divider" />
        <h4 className="resumo-subtitle">↕ Movimentação entre Séries</h4>

        <div className="resumo-movimentacao">
          {/* Rebaixados da A para a B */}
          {rebaixadosA.length > 0 && (
            <div className="resumo-mov-col">
              <div className="mov-header mov-rebaixado">⬇ Rebaixados da Série A</div>
              <div className="resumo-time-lista vertical">
                {rebaixadosA.map(n => (
                  <span key={n} className="resumo-time-tag rebaixado">
                    <TimeLogo nome={n} size="mini" /> {n}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Promovidos da B para a A */}
          {lastResults?.promovidosB && lastResults.promovidosB.length > 0 && (
            <div className="resumo-mov-col">
              <div className="mov-header mov-promovido">⬆ Promovidos da Série B</div>
              <div className="resumo-time-lista vertical">
                {lastResults.promovidosB.map(n => (
                  <span key={n} className="resumo-time-tag promovido">
                    <TimeLogo nome={n} size="mini" /> {n}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="resumo-movimentacao">
          {/* Rebaixados da B para a C */}
          {rebaixadosB.length > 0 && (
            <div className="resumo-mov-col">
              <div className="mov-header mov-rebaixado">⬇ Rebaixados da Série B</div>
              <div className="resumo-time-lista vertical">
                {rebaixadosB.map(n => (
                  <span key={n} className="resumo-time-tag rebaixado">
                    <TimeLogo nome={n} size="mini" /> {n}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Promovidos da C para a B */}
          {promovidosC.length > 0 && (
            <div className="resumo-mov-col">
              <div className="mov-header mov-promovido">⬆ Promovidos da Série C</div>
              <div className="resumo-time-lista vertical">
                {promovidosC.map(n => (
                  <span key={n} className="resumo-time-tag promovido">
                    <TimeLogo nome={n} size="mini" /> {n}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <button className="btn-primary resumo-btn" onClick={onClose}>
          Avançar para {year + 1} ➜
        </button>
      </div>
    </div>
  );
}

/* ===== Sub-componentes ===== */

function BdoCard({ tipo, entry }: { tipo: 'ouro' | 'prata' | 'bronze'; entry: any }) {
  const medalha = tipo === 'ouro' ? '🥇' : tipo === 'prata' ? '🥈' : '🥉';
  const cor = tipo === 'ouro' ? '#ffd700' : tipo === 'prata' ? '#c0c0c0' : '#cd7f32';
  return (
    <div className={`bdo-card bdo-${tipo}`}>
      <div className="bdo-medalha">{medalha}</div>
      <div className="bdo-nota" style={{ color: cor }}>{entry.nota.toFixed(1)}</div>
      <div className="bdo-jogador">{entry.jogador}</div>
      <div className="bdo-time"><TimeLogo nome={entry.time} size="mini" /> {entry.time}</div>
      <div className="bdo-stats">
        <span>⚽ {entry.gols}</span>
        <span>🅰 {entry.assistencias}</span>
      </div>
    </div>
  );
}

function SelJogador({ entry, pos }: { entry: SelecaoEntry | null | undefined; pos: string }) {
  if (!entry || entry.jogador === '-') return null;
  const posNome = POSICAO_NOME[pos as Posicao] || pos;
  return (
    <div className={`sel-jogador sel-pos-${pos.toLowerCase()}`}>
      <div className="sel-jogador-pos-label">{posNome}</div>
      <div className="sel-jogador-nome">{entry.jogador}</div>
      <div className="sel-jogador-time"><TimeLogo nome={entry.time} size="mini" /> {entry.time}</div>
      <div className="sel-jogador-nota">{entry.nota.toFixed(1)}</div>
    </div>
  );
}
