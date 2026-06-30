import { useState } from 'react';
import { useGame } from '../../store/GameContext';
import { initGameState, setActivePrefs, clearActivePrefs } from '../../utils/gameLogic';
import { resetarJogo, exportarSaveParaArquivo, importarSaveDoArquivo, importarSave, listarSavesCombinado } from '../../utils/storage';
import { PrefsPorSerie } from '../../types';
import { TimePrefsModal } from './TimePrefsModal';
import './SettingsModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'salvar' | 'carregar' | 'exportar' | 'importar' | 'forcas' | 'logo';

export function SettingsModal({ isOpen, onClose }: Props) {
  const { state, dispatch, loadGame, showNotification } = useGame();
  const [activeTab, setActiveTab] = useState<SettingsTab>('salvar');
  const [showTimePrefs, setShowTimePrefs] = useState(false);

  if (!isOpen) return null;

  function handleReset() {
    if (confirm('TEM CERTEZA? Isso vai resetar TODO o jogo!')) {
      resetarJogo();
      clearActivePrefs();
      onClose();
      setShowTimePrefs(true);
    }
  }

  function handleNovoJogo() {
    if (confirm('Iniciar um novo jogo? O progresso atual será perdido se não for salvo.')) {
      resetarJogo();
      clearActivePrefs();
      onClose();
      setShowTimePrefs(true);
    }
  }

  function handlePrefsConfirm(prefs: PrefsPorSerie) {
    setShowTimePrefs(false);
    setActivePrefs(prefs);
    const freshGame = initGameState(prefs);
    dispatch({ type: 'SET_GAME', payload: freshGame });
    dispatch({ type: 'SET_RODADA', payload: 0 });
    showNotification('Novo jogo iniciado!', 'success');
    onClose();
  }

  function handleLogoClick() {
    const url = prompt('URL da logo do seu time (ou deixe vazio para remover):');
    if (url !== null) {
      if (url.trim()) {
        try { new URL(url.trim()); } catch { showNotification('URL inválida!', 'error'); return; }
      }
      dispatch({ type: 'SET_LOGO_URL', payload: url.trim() || null });
      showNotification(url.trim() ? 'Logo personalizada definida!' : 'Logo removida!', 'success');
    }
  }

  return (
    <>
      <div className="modal-overlay active" onClick={onClose}>
        <div className="modal settings-modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>✕</button>
          <h3>⚙️ Configurações</h3>

          <div className="settings-nav">
            <button
              className={'btn-small' + (activeTab === 'salvar' ? ' active' : '')}
              onClick={() => setActiveTab('salvar')}
            >💾 Salvar</button>
            <button
              className={'btn-small' + (activeTab === 'carregar' ? ' active' : '')}
              onClick={() => setActiveTab('carregar')}
            >📂 Carregar</button>
            <button
              className={'btn-small' + (activeTab === 'exportar' ? ' active' : '')}
              onClick={() => setActiveTab('exportar')}
            >📤 Exportar</button>
            <button
              className={'btn-small' + (activeTab === 'importar' ? ' active' : '')}
              onClick={() => setActiveTab('importar')}
            >📥 Importar</button>
            <button
              className={'btn-small' + (activeTab === 'logo' ? ' active' : '')}
              onClick={() => setActiveTab('logo')}
            >🖼 Logo</button>
            <button
              className={'btn-small' + (activeTab === 'forcas' ? ' active' : '')}
              onClick={() => setActiveTab('forcas')}
            >⚙️ Forças</button>
          </div>

          <div className="settings-content">
            {activeTab === 'salvar' && <SaveTab />}
            {activeTab === 'carregar' && <LoadTab />}
            {activeTab === 'exportar' && <ExportTab />}
            {activeTab === 'importar' && <ImportTab />}
            {activeTab === 'logo' && <LogoTab onSetLogo={handleLogoClick} />}
            {activeTab === 'forcas' && <ForcasTab onOpenPrefs={() => setShowTimePrefs(true)} />}
          </div>

          <div className="settings-footer">
            <button className="btn-secondary" onClick={handleNovoJogo}>
              🆕 Novo Jogo
            </button>
            <button className="btn-danger" onClick={handleReset}>
              🔄 Resetar Tudo
            </button>
          </div>
        </div>
      </div>

      <TimePrefsModal isOpen={showTimePrefs} onConfirm={handlePrefsConfirm} />
    </>
  );
}

/* ===== Aba Salvar ===== */
function SaveTab() {
  const { state, saveGame, showNotification } = useGame();
  const [nome, setNome] = useState('');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const nomeSave = nome.trim() || `save_${state.game.year}`;
    saveGame(nomeSave);
    setSaved(true);
    showNotification(`Jogo salvo como "${nomeSave}"!`, 'success');
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="settings-tab">
      <h4>💾 Salvar Jogo</h4>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 8 }}>
        Ano atual: {state.game.year}
      </p>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', color: 'var(--text)', fontSize: '0.85rem' }}
          placeholder={`save_${state.game.year}`}
          value={nome}
          onChange={e => setNome(e.target.value)}
        />
        <button className="btn-primary" onClick={handleSave}>💾 Salvar</button>
      </div>
      {saved && <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--accent)' }}>✓ Salvo com sucesso!</div>}
    </div>
  );
}

/* ===== Aba Carregar ===== */
function LoadTab() {
  const { state, loadGame, showNotification } = useGame();
  const [saves, setSaves] = useState<{ nome: string; ano: number | string; data: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function listarSaves() {
    setLoading(true);
    try {
      const savesInfo = await listarSavesCombinado();
      setSaves(savesInfo.map(s => ({ nome: s.nome, ano: s.ano, data: s.data })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useState(() => { listarSaves(); });

  return (
    <div className="settings-tab">
      <h4>📂 Carregar Save</h4>
      {loading && <div style={{ textAlign: 'center', padding: 8, fontSize: '0.8rem', color: 'var(--text-dim)' }}>Carregando...</div>}
      {saves.length === 0 && !loading && (
        <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>Nenhum save encontrado.</div>
      )}
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {saves.map(s => (
          <div key={s.nome} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderBottom: '1px solid var(--border)', fontSize: '0.8rem' }}>
            <div>
              <strong>{s.nome}</strong>
              <br /><span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Ano {s.ano}</span>
            </div>
            <button className="btn-small" onClick={() => { loadGame(s.nome); }}>📂 Carregar</button>
          </div>
        ))}
      </div>
      <button className="btn-small" onClick={listarSaves} style={{ marginTop: 8 }}>↻ Atualizar lista</button>
    </div>
  );
}

/* ===== Aba Exportar ===== */
function ExportTab() {
  const { state } = useGame();
  const [saves, setSaves] = useState<{ nome: string; ano: number | string; times: number; isCurrent?: boolean }[]>([]);

  async function listarSaves() {
    try {
      const savesInfo = await listarSavesCombinado();
      setSaves(savesInfo.map(s => ({ ...s, isCurrent: s.ano === state.game.year })));
    } catch (e) {
      console.error(e);
    }
  }

  useState(() => { listarSaves(); });

  return (
    <div className="settings-tab">
      <h4>📤 Exportar Save</h4>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 8 }}>Exportar como arquivo .json</p>
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {saves.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>Nenhum save para exportar.</div>}
        {saves.map(s => (
          <div key={s.nome} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderBottom: '1px solid var(--border)', fontSize: '0.8rem' }}>
            <div>
              <strong>{s.nome}</strong>{s.isCurrent && <span style={{ color: 'var(--accent)', fontSize: '0.65rem', marginLeft: 4 }}>(atual)</span>}
              <br /><span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Ano {s.ano}</span>
            </div>
            <button className="btn-small" onClick={() => exportarSaveParaArquivo(s.nome, state.game)}>📤 Exportar</button>
          </div>
        ))}
      </div>
      <button className="btn-small" onClick={listarSaves} style={{ marginTop: 8 }}>↻ Atualizar lista</button>
    </div>
  );
}

/* ===== Aba Importar ===== */
function ImportTab() {
  const { loadGame, showNotification } = useGame();
  const [nomeSave, setNomeSave] = useState('');
  const [status, setStatus] = useState('');
  const fileRef = useState<HTMLInputElement | null>(null)[1];

  async function handleImport() {
    const fileInput = document.getElementById('import-file-input') as HTMLInputElement;
    if (!fileInput?.files?.[0]) { setStatus('Selecione um arquivo!'); return; }
    if (!nomeSave.trim()) { setStatus('Digite um nome para o save!'); return; }
    setStatus('Importando...');
    try {
      const data = await importarSaveDoArquivo(fileInput.files[0]);
      if (importarSave(data, nomeSave.trim())) {
        setStatus('Salvo importado!');
        showNotification('Save importado!', 'success');
        if (confirm('Carregar agora?')) loadGame(nomeSave.trim());
        setNomeSave('');
        if (fileInput) fileInput.value = '';
      } else setStatus('Erro ao importar!');
    } catch (err) {
      setStatus(String(err));
    }
  }

  return (
    <div className="settings-tab">
      <h4>📥 Importar Save</h4>
      <input id="import-file-input" type="file" accept=".json" style={{ fontSize: '0.8rem', marginBottom: 8, width: '100%' }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', color: 'var(--text)', fontSize: '0.85rem' }}
          placeholder="Nome do save..."
          value={nomeSave}
          onChange={e => setNomeSave(e.target.value)}
        />
        <button className="btn-primary" onClick={handleImport}>Importar</button>
      </div>
      {status && <div style={{ marginTop: 6, fontSize: '0.75rem', color: status.includes('sucesso') || status.includes('importado') ? 'var(--accent)' : 'var(--red)' }}>{status}</div>}
    </div>
  );
}

/* ===== Aba Logo ===== */
function LogoTab({ onSetLogo }: { onSetLogo: () => void }) {
  return (
    <div className="settings-tab">
      <h4>🖼 Logo Personalizada</h4>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 8 }}>
        Defina uma URL de logo para aparecer no topo. A logo aparece no lugar do emoji ⚽.
      </p>
      <button className="btn-primary" onClick={onSetLogo} style={{ width: '100%' }}>
        🖼 Definir URL da Logo
      </button>
    </div>
  );
}

/* ===== Aba Forças ===== */
function ForcasTab({ onOpenPrefs }: { onOpenPrefs: () => void }) {
  return (
    <div className="settings-tab">
      <h4>⚙️ Força e Relevância dos Times</h4>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 8 }}>
        Ajuste a força geral e relevância de cada time para personalizar o campeonato.
        Use isto antes de iniciar um novo jogo para balancear as equipes.
      </p>
      <button className="btn-primary" onClick={onOpenPrefs} style={{ width: '100%' }}>
        ⚙️ Abrir Ajuste de Forças
      </button>
    </div>
  );
}
