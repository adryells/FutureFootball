import { useState } from 'react';
import { Jogador } from '../../types';

interface Props {
  jogador: Jogador;
  isOpen: boolean;
  onClose: () => void;
  onSave: (jogador: Jogador) => void;
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 4, padding: '4px 8px', color: 'var(--text)',
  width: '100%', marginTop: 2, fontSize: '0.85rem'
};

export function EditJogadorModal({ jogador, isOpen, onClose, onSave }: Props) {
  const [nome, setNome] = useState(jogador.nome);
  const [idade, setIdade] = useState(String(jogador.idade));
  const [overall, setOverall] = useState(String(jogador.overall));
  const [altura, setAltura] = useState(jogador.altura);
  const [peso, setPeso] = useState(jogador.peso);

  if (!isOpen) return null;

  function handleSave() {
    const idadeNum = parseInt(idade);
    const overallNum = parseInt(overall);
    if (idadeNum < 15 || idadeNum > 50) { alert('Idade inválida (15-50)'); return; }
    if (overallNum < 1 || overallNum > 99) { alert('Overall inválido (1-99)'); return; }
    onSave({ ...jogador, nome, idade: idadeNum, overall: overallNum, altura, peso });
    onClose();
  }

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3>✏️ Editar Jogador</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginBottom: 12 }}>
          {jogador.nome} — {jogador.posicao}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Nome:</span>
            <input value={nome} onChange={e => setNome(e.target.value)} style={inputStyle} />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ flex: 1 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Idade:</span>
              <input type="number" min={15} max={50} value={idade} onChange={e => setIdade(e.target.value)} style={inputStyle} />
            </label>
            <label style={{ flex: 1 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Overall:</span>
              <input type="number" min={1} max={99} value={overall} onChange={e => setOverall(e.target.value)} style={inputStyle} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ flex: 1 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Altura:</span>
              <input value={altura} onChange={e => setAltura(e.target.value)} style={inputStyle} />
            </label>
            <label style={{ flex: 1 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Peso:</span>
              <input value={peso} onChange={e => setPeso(e.target.value)} style={inputStyle} />
            </label>
          </div>
          <button className="btn-primary" onClick={handleSave} style={{ marginTop: 8, width: '100%' }}>
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
