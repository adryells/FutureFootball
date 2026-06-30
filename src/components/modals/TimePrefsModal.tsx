import { useState, useMemo } from 'react';
import { PrefsPorSerie, TimePrefs } from '../../types';
import { SERIES_DATA, DEFAULT_TIME_PREFS, getDefaultPrefs } from '../../data/initialData';
import { getTimeColors } from '../../data/initialData';
import './TimePrefsModal.css';

interface Props {
  isOpen: boolean;
  onConfirm: (prefs: PrefsPorSerie) => void;
}

/** Botão para resetar um time aos valores default */
function ResetBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="prefs-reset-btn"
      onClick={onClick}
      title="Resetar para valor padrão"
    >
      ↺
    </button>
  );
}

/** Slider para força geral com valor numérico */
function ForcaSlider({
  value, onChange, label
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const cor = value >= 80 ? '#4caf50' : value >= 70 ? '#8bc34a' : value >= 60 ? '#ffc107' : value >= 50 ? '#ff9800' : '#f44336';
  return (
    <div className="prefs-slider-group">
      <span className="prefs-slider-label">{label}</span>
      <div className="prefs-slider-row">
        <input
          type="range"
          min={40}
          max={99}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="prefs-slider"
          style={{ accentColor: cor }}
        />
        <span className="prefs-slider-value" style={{ color: cor }}>
          {value}
        </span>
        <ResetBtn onClick={() => onChange(65)} />
      </div>
    </div>
  );
}

/** Seletor de relevância em estrelas */
function RelevanciaStars({
  value, onChange, label
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="prefs-slider-group">
      <span className="prefs-slider-label">{label}</span>
      <div className="prefs-stars-row">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`prefs-star ${star <= value ? 'active' : ''}`}
            onClick={() => onChange(star)}
            title={`${star} estrela(s)`}
          >
            ★
          </span>
        ))}
        <ResetBtn onClick={() => onChange(2)} />
      </div>
    </div>
  );
}

/** Card de um time individual */
function TimePrefCard({
  nome, prefs, onChange
}: {
  nome: string;
  prefs: TimePrefs;
  onChange: (p: TimePrefs) => void;
}) {
  const cores = getTimeColors(nome);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="prefs-time-card" style={{ borderLeftColor: cores[0] }}>
      <div className="prefs-time-header" onClick={() => setExpanded(!expanded)}>
        <span
          className="prefs-time-bola"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${cores[1]}, ${cores[0]})`,
            border: `2px solid ${cores[0]}`
          }}
        />
        <span className="prefs-time-nome">{nome}</span>
        <span className="prefs-time-resumo">
          {prefs.forcaGeral} · {'★'.repeat(prefs.relevancia)}
        </span>
        <span className={`prefs-expand-icon ${expanded ? 'open' : ''}`}>▾</span>
      </div>
      {expanded && (
        <div className="prefs-time-body">
          <ForcaSlider
            label="Força Geral"
            value={prefs.forcaGeral}
            onChange={v => onChange({ ...prefs, forcaGeral: v })}
          />
          <RelevanciaStars
            label="Relevância"
            value={prefs.relevancia}
            onChange={v => onChange({ ...prefs, relevancia: v })}
          />
        </div>
      )}
    </div>
  );
}

/** Aba de uma série (A, B ou C) */
function SerieTab({
  serieKey, times, prefs, setPrefs
}: {
  serieKey: 'A' | 'B' | 'C';
  times: string[];
  prefs: Record<string, TimePrefs>;
  setPrefs: (p: Record<string, TimePrefs>) => void;
}) {
  const serieNomes: Record<string, string> = { A: 'Série A', B: 'Série B', C: 'Série C' };

  const aplicarParaTodos = (forca: number, relevancia: number) => {
    const novo: Record<string, TimePrefs> = {};
    for (const nome of times) {
      novo[nome] = { forcaGeral: forca, relevancia };
    }
    setPrefs(novo);
  };

  const resetarParaDefault = () => {
    const novo: Record<string, TimePrefs> = {};
    for (const nome of times) {
      novo[nome] = DEFAULT_TIME_PREFS[nome] || getDefaultPrefs();
    }
    setPrefs(novo);
  };

  return (
    <div className="prefs-serie-tab">
      <div className="prefs-serie-actions">
        <span className="prefs-serie-title">{serieNomes[serieKey]} ({times.length} times)</span>
        <div className="prefs-serie-btns">
          <button
            className="prefs-btn-small"
            onClick={() => {
              const v = prompt('Força geral para todos os times (40-99):', '65');
              if (v) aplicarParaTodos(Number(v), 2);
            }}
          >
            Força para todos
          </button>
          <button className="prefs-btn-small" onClick={resetarParaDefault}>
            Resetar padrão
          </button>
        </div>
      </div>
      <div className="prefs-times-grid">
        {times.map(nome => (
          <TimePrefCard
            key={nome}
            nome={nome}
            prefs={prefs[nome] || getDefaultPrefs()}
            onChange={p => setPrefs({ ...prefs, [nome]: p })}
          />
        ))}
      </div>
    </div>
  );
}

export function TimePrefsModal({ isOpen, onConfirm }: Props) {
  const [activeSerie, setActiveSerie] = useState<'A' | 'B' | 'C'>('A');
  const [prefsA, setPrefsA] = useState<Record<string, TimePrefs>>(() => {
    const p: Record<string, TimePrefs> = {};
    for (const nome of SERIES_DATA.A) {
      p[nome] = DEFAULT_TIME_PREFS[nome] || getDefaultPrefs();
    }
    return p;
  });
  const [prefsB, setPrefsB] = useState<Record<string, TimePrefs>>(() => {
    const p: Record<string, TimePrefs> = {};
    for (const nome of SERIES_DATA.B) {
      p[nome] = DEFAULT_TIME_PREFS[nome] || getDefaultPrefs();
    }
    return p;
  });
  const [prefsC, setPrefsC] = useState<Record<string, TimePrefs>>(() => {
    const p: Record<string, TimePrefs> = {};
    for (const nome of SERIES_DATA.C) {
      p[nome] = DEFAULT_TIME_PREFS[nome] || getDefaultPrefs();
    }
    return p;
  });

  if (!isOpen) return null;

  const prefsMap: Record<'A' | 'B' | 'C', Record<string, TimePrefs>> = { A: prefsA, B: prefsB, C: prefsC };
  const setterMap: Record<'A' | 'B' | 'C', (p: Record<string, TimePrefs>) => void> = { A: setPrefsA, B: setPrefsB, C: setPrefsC };

  function handleConfirm() {
    const result: PrefsPorSerie = {
      A: { ...prefsA },
      B: { ...prefsB },
      C: { ...prefsC },
    };
    onConfirm(result);
  }

  return (
    <div className="prefs-overlay active">
      <div className="prefs-modal" onClick={e => e.stopPropagation()}>
        <div className="prefs-modal-header">
          <h2>⚙️ Preferências dos Times</h2>
          <p className="prefs-subtitle">
            Ajuste a <strong>força geral</strong> (média de overall dos jogadores) e a <strong>relevância</strong>
            (peso histórico/camisa) de cada time. Times mais fortes e relevantes terão melhores resultados.
          </p>
        </div>

        {/* Abas de série */}
        <div className="prefs-tabs">
          {(['A', 'B', 'C'] as const).map(s => (
            <button
              key={s}
              className={`prefs-tab ${activeSerie === s ? 'active' : ''}`}
              onClick={() => setActiveSerie(s)}
            >
              Série {s} ({SERIES_DATA[s].length})
            </button>
          ))}
        </div>

        <div className="prefs-scroll-area">
          <SerieTab
            serieKey={activeSerie}
            times={SERIES_DATA[activeSerie]}
            prefs={prefsMap[activeSerie]}
            setPrefs={setterMap[activeSerie]}
          />
        </div>

        <div className="prefs-modal-footer">
          <button className="prefs-btn-confirm" onClick={handleConfirm}>
            ✅ Confirmar e Iniciar Jogo
          </button>
        </div>
      </div>
    </div>
  );
}
