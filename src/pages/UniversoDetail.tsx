import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Calendar, Settings, Trophy } from 'lucide-react';
import { db, Temporada, Universo, EstruturaDivisao } from '../db/database';

export default function UniversoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [universo, setUniverso] = useState<Universo | null>(null);
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [divisoes, setDivisoes] = useState<EstruturaDivisao[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDivisoesModal, setShowDivisoesModal] = useState(false);
  const [editingTemporada, setEditingTemporada] = useState<Temporada | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    ano: new Date().getFullYear(),
    ordem: 1
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    const universoData = await db.universos.get(Number(id));
    setUniverso(universoData || null);

    const temporadasData = await db.temporadas
      .where('universoId')
      .equals(Number(id))
      .sortBy('ordem');
    setTemporadas(temporadasData);

    const divisoesData = await db.estruturasDivisao
      .where('universoId')
      .equals(Number(id))
      .sortBy('ordem');
    setDivisoes(divisoesData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (editingTemporada) {
      await db.temporadas.update(editingTemporada.id!, {
        ...formData,
        ano: Number(formData.ano),
        ordem: Number(formData.ordem)
      });
    } else {
      await db.temporadas.add({
        universoId: Number(id),
        ...formData,
        ano: Number(formData.ano),
        ordem: Number(formData.ordem),
        finalizada: false,
        createdAt: new Date()
      });
    }

    setShowModal(false);
    setEditingTemporada(null);
    setFormData({ nome: '', ano: new Date().getFullYear(), ordem: 1 });
    loadData();
  };

  const handleEdit = (temporada: Temporada) => {
    setEditingTemporada(temporada);
    setFormData({
      nome: temporada.nome,
      ano: temporada.ano,
      ordem: temporada.ordem
    });
    setShowModal(true);
  };

  const handleDelete = async (temporadaId: number) => {
    if (confirm('Tem certeza que deseja excluir esta temporada? Todas as competições serão excluídas.')) {
      const competicoes = await db.competicoes.where('temporadaId').equals(temporadaId).toArray();
      for (const comp of competicoes) {
        await db.partidas.where('competicaoId').equals(comp.id!).delete();
      }
      await db.competicoes.where('temporadaId').equals(temporadaId).delete();
      await db.temporadas.delete(temporadaId);
      loadData();
    }
  };

  const canEditTemporada = (temporada: Temporada) => {
    // Verifica se todas as temporadas anteriores estão finalizadas
    const anteriores = temporadas.filter(t => t.ordem < temporada.ordem);
    return anteriores.every(t => t.finalizada) || temporada.ordem === 1;
  };

  if (!universo) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/universos"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <button
            onClick={() => {
              const maxOrdem = temporadas.length > 0 
                ? Math.max(...temporadas.map(t => t.ordem)) 
                : 0;
              setEditingTemporada(null);
              setFormData({ 
                nome: '', 
                ano: new Date().getFullYear(), 
                ordem: maxOrdem + 1 
              });
              setShowModal(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Temporada
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{universo.nome}</h1>
        {universo.descricao && (
          <p className="text-gray-600 mb-6">{universo.descricao}</p>
        )}

        {/* Seção de Configuração de Divisões */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Trophy className="w-6 h-6 text-indigo-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Estrutura de Divisões</h2>
            </div>
            <button
              onClick={() => setShowDivisoesModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
            >
              <Settings className="w-5 h-5 mr-2" />
              Configurar Divisões
            </button>
          </div>
          {divisoes.length === 0 ? (
            <p className="text-gray-500">Nenhuma divisão configurada. Configure a estrutura de divisões para gerar competições automaticamente.</p>
          ) : (
            <div className="space-y-2">
              {divisoes.map((divisao, index) => (
                <div
                  key={divisao.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  style={{ borderLeftColor: divisao.cor, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-600">{divisao.ordem}º</span>
                    <span className="font-semibold text-gray-900">{divisao.nome}</span>
                    <span className="text-sm text-gray-600">{divisao.quantidadeTimes} times</span>
                    {divisao.quantidadePromovidos > 0 && (
                      <span className="text-sm text-green-600">↑ {divisao.quantidadePromovidos} promovidos</span>
                    )}
                    {divisao.quantidadeRebaixados > 0 && (
                      <span className="text-sm text-red-600">↓ {divisao.quantidadeRebaixados} rebaixados</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seção de Temporadas */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Temporadas</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {temporadas.map(temporada => {
            const podeEditar = canEditTemporada(temporada);
            return (
              <div
                key={temporada.id}
                className={`bg-white rounded-lg shadow p-6 ${
                  !podeEditar ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <Link
                    to={`/universos/${id}/temporadas/${temporada.id}`}
                    className="flex-1"
                  >
                    <div className="flex items-center mb-2">
                      <Calendar className="w-5 h-5 text-indigo-600 mr-2" />
                      <h3 className="text-xl font-bold text-gray-900">
                        {temporada.nome}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Ano: {temporada.ano} • Ordem: {temporada.ordem}
                    </p>
                    {temporada.finalizada && (
                      <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Finalizada
                      </span>
                    )}
                    {!podeEditar && (
                      <p className="text-xs text-orange-600 mt-2">
                        Finalize as temporadas anteriores para editar
                      </p>
                    )}
                  </Link>
                  <div className="flex space-x-2 ml-4">
                    {podeEditar && (
                      <>
                        <button
                          onClick={() => handleEdit(temporada)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(temporada.id!)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <Link
                  to={`/universos/${id}/temporadas/${temporada.id}`}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Ver competições →
                </Link>
              </div>
            );
          })}
        </div>

        {temporadas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma temporada criada ainda.</p>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingTemporada ? 'Editar Temporada' : 'Nova Temporada'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Temporada
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    placeholder="Ex: 2025, Temporada 2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ano
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.ano}
                    onChange={(e) =>
                      setFormData({ ...formData, ano: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordem Cronológica
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.ordem}
                    onChange={(e) =>
                      setFormData({ ...formData, ordem: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Define a ordem cronológica. Temporadas só podem ser editadas quando as anteriores estão finalizadas.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTemporada(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {editingTemporada ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDivisoesModal && (
          <DivisoesModal
            universoId={Number(id)}
            divisoes={divisoes}
            onClose={() => {
              setShowDivisoesModal(false);
              loadData();
            }}
          />
        )}
      </div>
    </div>
  );
}

function DivisoesModal({
  universoId,
  divisoes: divisoesIniciais,
  onClose
}: {
  universoId: number;
  divisoes: EstruturaDivisao[];
  onClose: () => void;
}) {
  const [divisoes, setDivisoes] = useState<EstruturaDivisao[]>(divisoesIniciais);
  const [editingDivisao, setEditingDivisao] = useState<EstruturaDivisao | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    ordem: 1,
    quantidadeTimes: 20,
    quantidadePromovidos: 0,
    quantidadeRebaixados: 0,
    divisaoSuperiorId: undefined as number | undefined,
    divisaoInferiorId: undefined as number | undefined,
    cor: '#3B82F6'
  });

  useEffect(() => {
    loadDivisoes();
  }, []);

  const loadDivisoes = async () => {
    const data = await db.estruturasDivisao
      .where('universoId')
      .equals(universoId)
      .sortBy('ordem');
    setDivisoes(data);
  };

  const handleSave = async () => {
    if (editingDivisao) {
      await db.estruturasDivisao.update(editingDivisao.id!, {
        ...formData,
        universoId
      });
    } else {
      await db.estruturasDivisao.add({
        ...formData,
        universoId,
        createdAt: new Date()
      });
    }
    await loadDivisoes();
    setShowForm(false);
    setEditingDivisao(null);
    setFormData({
      nome: '',
      ordem: divisoes.length + 1,
      quantidadeTimes: 20,
      quantidadePromovidos: 0,
      quantidadeRebaixados: 0,
      divisaoSuperiorId: undefined,
      divisaoInferiorId: undefined,
      cor: '#3B82F6'
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta divisão?')) {
      await db.estruturasDivisao.delete(id);
      await loadDivisoes();
    }
  };

  const handleEdit = (divisao: EstruturaDivisao) => {
    setEditingDivisao(divisao);
    setFormData({
      nome: divisao.nome,
      ordem: divisao.ordem,
      quantidadeTimes: divisao.quantidadeTimes,
      quantidadePromovidos: divisao.quantidadePromovidos,
      quantidadeRebaixados: divisao.quantidadeRebaixados,
      divisaoSuperiorId: divisao.divisaoSuperiorId,
      divisaoInferiorId: divisao.divisaoInferiorId,
      cor: divisao.cor
    });
    setShowForm(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Configurar Divisões</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <button
            onClick={() => {
              setEditingDivisao(null);
              setFormData({
                nome: '',
                ordem: divisoes.length + 1,
                quantidadeTimes: 20,
                quantidadePromovidos: 0,
                quantidadeRebaixados: 0,
                divisaoSuperiorId: undefined,
                divisaoInferiorId: undefined,
                cor: '#3B82F6'
              });
              setShowForm(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            + Nova Divisão
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-gray-900 mb-4">
              {editingDivisao ? 'Editar Divisão' : 'Nova Divisão'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  placeholder="Ex: Série A, Série B"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
                <input
                  type="number"
                  min="1"
                  value={formData.ordem}
                  onChange={(e) => setFormData({ ...formData, ordem: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade de Times</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantidadeTimes}
                  onChange={(e) => setFormData({ ...formData, quantidadeTimes: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                <input
                  type="color"
                  value={formData.cor}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  className="w-full h-10 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade de Promovidos</label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantidadePromovidos}
                  onChange={(e) => setFormData({ ...formData, quantidadePromovidos: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                />
              </div>
              {formData.quantidadePromovidos > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Divisão Superior (destino dos promovidos)</label>
                  <select
                    value={formData.divisaoSuperiorId || ''}
                    onChange={(e) => setFormData({ ...formData, divisaoSuperiorId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  >
                    <option value="">Selecione</option>
                    {divisoes
                      .filter(d => d.id !== editingDivisao?.id && d.ordem < formData.ordem)
                      .map(d => (
                        <option key={d.id} value={d.id}>
                          {d.nome} ({d.ordem}º divisão)
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade de Rebaixados</label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantidadeRebaixados}
                  onChange={(e) => setFormData({ ...formData, quantidadeRebaixados: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                />
              </div>
              {formData.quantidadeRebaixados > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Divisão Inferior (destino dos rebaixados)</label>
                  <select
                    value={formData.divisaoInferiorId || ''}
                    onChange={(e) => setFormData({ ...formData, divisaoInferiorId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  >
                    <option value="">Selecione</option>
                    {divisoes
                      .filter(d => d.id !== editingDivisao?.id && d.ordem > formData.ordem)
                      .map(d => (
                        <option key={d.id} value={d.id}>
                          {d.nome} ({d.ordem}º divisão)
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={handleSave}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingDivisao(null);
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {divisoes.map(divisao => (
            <div
              key={divisao.id}
              className="flex items-center justify-between p-3 border rounded-lg"
              style={{ borderLeftColor: divisao.cor, borderLeftWidth: '4px' }}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-600">{divisao.ordem}º</span>
                  <span className="font-semibold text-gray-900">{divisao.nome}</span>
                  <span className="text-sm text-gray-600">{divisao.quantidadeTimes} times</span>
                  {divisao.quantidadePromovidos > 0 && (
                    <span className="text-sm text-green-600">
                      ↑ {divisao.quantidadePromovidos} → {divisoes.find(d => d.id === divisao.divisaoSuperiorId)?.nome || 'N/A'}
                    </span>
                  )}
                  {divisao.quantidadeRebaixados > 0 && (
                    <span className="text-sm text-red-600">
                      ↓ {divisao.quantidadeRebaixados} → {divisoes.find(d => d.id === divisao.divisaoInferiorId)?.nome || 'N/A'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(divisao)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(divisao.id!)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

