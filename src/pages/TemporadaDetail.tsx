import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Trophy, Download, Sparkles } from 'lucide-react';
import { db, Competicao, Temporada, SecaoCompeticao, EstruturaDivisao } from '../db/database';
import { calcularClassificacao } from '../utils/competicao';

export default function TemporadaDetail() {
  const { universoId, id } = useParams<{ universoId: string; id: string }>();
  const navigate = useNavigate();
  const [temporada, setTemporada] = useState<Temporada | null>(null);
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [divisoes, setDivisoes] = useState<EstruturaDivisao[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showGerarEstruturaModal, setShowGerarEstruturaModal] = useState(false);
  const [editingCompeticao, setEditingCompeticao] = useState<Competicao | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'pontos-corridos' as 'pontos-corridos' | 'mata-mata',
    clubesIds: [] as number[]
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    const temporadaData = await db.temporadas.get(Number(id));
    setTemporada(temporadaData || null);

    const competicoesData = await db.competicoes
      .where('temporadaId')
      .equals(Number(id))
      .toArray();
    setCompeticoes(competicoesData);

    if (temporadaData && universoId) {
      const divisoesData = await db.estruturasDivisao
        .where('universoId')
        .equals(Number(universoId))
        .sortBy('ordem');
      setDivisoes(divisoesData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (editingCompeticao) {
      await db.competicoes.update(editingCompeticao.id!, {
        ...formData,
        status: formData.clubesIds.length > 0 
          ? (formData.tipo === 'mata-mata' && formData.clubesIds.length % 2 !== 0
              ? 'configurando'
              : 'pronta')
          : 'configurando'
      });
    } else {
      const competicaoId = await db.competicoes.add({
        temporadaId: Number(id),
        ...formData,
        status: formData.clubesIds.length > 0 
          ? (formData.tipo === 'mata-mata' && formData.clubesIds.length % 2 !== 0
              ? 'configurando'
              : 'pronta')
          : 'configurando',
        rodadasGeradas: false,
        createdAt: new Date()
      });
      navigate(`/competicoes/${competicaoId}`);
    }

    setShowModal(false);
    setEditingCompeticao(null);
    setFormData({ nome: '', tipo: 'pontos-corridos', clubesIds: [] });
    loadData();
  };

  const handleEdit = (competicao: Competicao) => {
    setEditingCompeticao(competicao);
    setFormData({
      nome: competicao.nome,
      tipo: competicao.tipo,
      clubesIds: competicao.clubesIds
    });
    setShowModal(true);
  };

  const handleDelete = async (competicaoId: number) => {
    if (confirm('Tem certeza que deseja excluir esta competição? Todas as partidas serão excluídas.')) {
      await db.partidas.where('competicaoId').equals(competicaoId).delete();
      await db.competicoes.delete(competicaoId);
      loadData();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pronta':
        return 'bg-green-100 text-green-800';
      case 'em-andamento':
        return 'bg-blue-100 text-blue-800';
      case 'finalizada':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pronta':
        return 'Pronta para simular';
      case 'em-andamento':
        return 'Em andamento';
      case 'finalizada':
        return 'Finalizada';
      default:
        return 'Configurando';
    }
  };

  if (!temporada) {
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
            to={`/universos/${universoId}`}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <div className="flex items-center space-x-2">
            {divisoes.length > 0 && competicoes.length === 0 && (
              <button
                onClick={() => setShowGerarEstruturaModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Gerar da Estrutura
              </button>
            )}
            {temporada && temporada.ordem > 1 && (
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Download className="w-5 h-5 mr-2" />
                Importar do Ano Anterior
              </button>
            )}
            <button
              onClick={() => {
                setEditingCompeticao(null);
                setFormData({ nome: '', tipo: 'pontos-corridos', clubesIds: [] });
                setShowModal(true);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Competição Avulsa
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {temporada.nome}
        </h1>
        <p className="text-gray-600 mb-6">Ano: {temporada.ano}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {competicoes.map(competicao => (
            <div
              key={competicao.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <Link
                  to={`/competicoes/${competicao.id}`}
                  className="flex-1"
                >
                  <div className="flex items-center mb-2">
                    <Trophy className="w-5 h-5 text-indigo-600 mr-2" />
                    <h3 className="text-xl font-bold text-gray-900">
                      {competicao.nome}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(competicao.status)}`}>
                      {getStatusText(competicao.status)}
                    </span>
                    <span className="text-xs text-gray-600">
                      {competicao.tipo === 'pontos-corridos' ? 'Pontos Corridos' : 'Mata-Mata'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {competicao.clubesIds.length} clube(s) participante(s)
                  </p>
                </Link>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(competicao)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(competicao.id!)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <Link
                to={`/competicoes/${competicao.id}`}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                Ver detalhes →
              </Link>
            </div>
          ))}
        </div>

        {competicoes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma competição criada ainda.</p>
          </div>
        )}

        {showModal && (
          <CompeticaoModal
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onClose={() => {
              setShowModal(false);
              setEditingCompeticao(null);
            }}
            editingCompeticao={editingCompeticao}
          />
        )}

        {showImportModal && temporada && (
          <ImportarCompeticaoModal
            temporadaAtual={temporada}
            onClose={() => setShowImportModal(false)}
            onImport={loadData}
          />
        )}

        {showGerarEstruturaModal && temporada && divisoes.length > 0 && (
          <GerarEstruturaModal
            temporada={temporada}
            divisoes={divisoes}
            onClose={() => setShowGerarEstruturaModal(false)}
            onGerar={loadData}
          />
        )}
      </div>
    </div>
  );
}

function GerarEstruturaModal({
  temporada,
  divisoes,
  onClose,
  onGerar
}: {
  temporada: Temporada;
  divisoes: EstruturaDivisao[];
  onClose: () => void;
  onGerar: () => void;
}) {
  const [clubes, setClubes] = useState<any[]>([]);
  const [clubesPorDivisao, setClubesPorDivisao] = useState<Map<number, number[]>>(new Map());

  useEffect(() => {
    loadClubes();
  }, []);

  const loadClubes = async () => {
    const allClubes = await db.clubes.toArray();
    setClubes(allClubes);
    
    // Inicializa com clubes aleatórios para cada divisão
    const inicial = new Map<number, number[]>();
    divisoes.forEach(divisao => {
      const clubesAleatorios = [...allClubes]
        .sort(() => Math.random() - 0.5)
        .slice(0, divisao.quantidadeTimes)
        .map(c => c.id!);
      inicial.set(divisao.id!, clubesAleatorios);
    });
    setClubesPorDivisao(inicial);
  };

  const toggleClube = (divisaoId: number, clubeId: number) => {
    const atual = clubesPorDivisao.get(divisaoId) || [];
    if (atual.includes(clubeId)) {
      setClubesPorDivisao(new Map(clubesPorDivisao.set(divisaoId, atual.filter(id => id !== clubeId))));
    } else {
      const divisao = divisoes.find(d => d.id === divisaoId);
      if (divisao && atual.length < divisao.quantidadeTimes) {
        setClubesPorDivisao(new Map(clubesPorDivisao.set(divisaoId, [...atual, clubeId])));
      }
    }
  };

  const handleGerar = async () => {
    for (const divisao of divisoes) {
      const clubesIds = clubesPorDivisao.get(divisao.id!) || [];
      if (clubesIds.length === 0) continue;

      await db.competicoes.add({
        temporadaId: temporada.id!,
        nome: divisao.nome,
        tipo: 'pontos-corridos',
        status: clubesIds.length > 0 ? 'pronta' : 'configurando',
        clubesIds,
        rodadasGeradas: false,
        createdAt: new Date()
      });
    }
    onGerar();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Gerar Competições da Estrutura</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Selecione os clubes para cada divisão. Você pode ajustar depois.
        </p>

        <div className="space-y-4 mb-4">
          {divisoes.map(divisao => {
            const clubesSelecionados = clubesPorDivisao.get(divisao.id!) || [];
            return (
              <div key={divisao.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: divisao.cor }}
                    />
                    <h3 className="font-bold text-gray-900">{divisao.nome}</h3>
                    <span className="text-sm text-gray-600">
                      {clubesSelecionados.length} / {divisao.quantidadeTimes} times
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {clubes.map(clube => {
                    const selecionado = clubesSelecionados.includes(clube.id!);
                    const desabilitado = !selecionado && clubesSelecionados.length >= divisao.quantidadeTimes;
                    return (
                      <label
                        key={clube.id}
                        className={`flex items-center space-x-2 p-2 border rounded cursor-pointer ${
                          selecionado ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-300'
                        } ${desabilitado ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                      >
                        <input
                          type="checkbox"
                          checked={selecionado}
                          onChange={() => toggleClube(divisao.id!, clube.id!)}
                          disabled={desabilitado}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        {clube.logo && (
                          <img
                            src={clube.logo}
                            alt={clube.nome}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <span className="text-sm text-gray-900">{clube.nome}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGerar}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Gerar Competições
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportarCompeticaoModal({
  temporadaAtual,
  onClose,
  onImport
}: {
  temporadaAtual: Temporada;
  onClose: () => void;
  onImport: () => void;
}) {
  const [competicoesAnteriores, setCompeticoesAnteriores] = useState<Competicao[]>([]);
  const [divisoes, setDivisoes] = useState<EstruturaDivisao[]>([]);
  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadCompeticoesAnteriores();
    loadDivisoes();
  }, []);

  const loadCompeticoesAnteriores = async () => {
    const temporadasAnteriores = await db.temporadas
      .where('universoId')
      .equals(temporadaAtual.universoId)
      .and(t => t.ordem < temporadaAtual.ordem)
      .sortBy('ordem');

    if (temporadasAnteriores.length === 0) return;

    const ultimaTemporada = temporadasAnteriores[temporadasAnteriores.length - 1];
    const competicoes = await db.competicoes
      .where('temporadaId')
      .equals(ultimaTemporada.id!)
      .and(c => c.status === 'finalizada')
      .toArray();

    setCompeticoesAnteriores(competicoes);
  };

  const loadDivisoes = async () => {
    const divisoesData = await db.estruturasDivisao
      .where('universoId')
      .equals(temporadaAtual.universoId)
      .sortBy('ordem');
    setDivisoes(divisoesData);
  };

  const handleImport = async () => {
    // Mapa para armazenar competições criadas (nome -> id)
    const competicoesCriadas = new Map<string, number>();
    // Mapa para armazenar clubes que devem ser adicionados a cada divisão (nome -> clubesIds[])
    const clubesParaAdicionar = new Map<string, number[]>();
    // Mapa para armazenar clubes que devem ser removidos de cada divisão (nome -> clubesIds[])
    const clubesParaRemover = new Map<string, Set<number>>();

    // Primeira passada: analisa todas as competições e identifica movimentações baseadas na estrutura
    for (const competicaoId of selecionadas) {
      const competicaoAnterior = competicoesAnteriores.find(c => c.id === competicaoId);
      if (!competicaoAnterior) continue;

      // Encontra a divisão correspondente pelo nome
      const divisao = divisoes.find(d => d.nome === competicaoAnterior.nome);
      if (!divisao) continue; // Se não encontrar divisão, pula (competição avulsa)

      // Busca classificação
      const classificacao = await calcularClassificacao(
        competicaoAnterior.id!,
        competicaoAnterior.clubesIds
      );

      // Processa rebaixados
      if (divisao.quantidadeRebaixados > 0 && divisao.divisaoInferiorId) {
        const rebaixados = classificacao
          .slice(-divisao.quantidadeRebaixados)
          .map(item => item.clubeId);

        // Marca para remover da competição atual
        if (!clubesParaRemover.has(competicaoAnterior.nome)) {
          clubesParaRemover.set(competicaoAnterior.nome, new Set());
        }
        rebaixados.forEach(id => clubesParaRemover.get(competicaoAnterior.nome)!.add(id));

        // Adiciona na divisão inferior
        const divisaoInferior = divisoes.find(d => d.id === divisao.divisaoInferiorId);
        if (divisaoInferior) {
          const nomeDestino = divisaoInferior.nome;
          if (!clubesParaAdicionar.has(nomeDestino)) {
            clubesParaAdicionar.set(nomeDestino, []);
          }
          clubesParaAdicionar.get(nomeDestino)!.push(...rebaixados);
        }
      }

      // Processa promovidos
      if (divisao.quantidadePromovidos > 0 && divisao.divisaoSuperiorId) {
        const promovidos = classificacao
          .slice(0, divisao.quantidadePromovidos)
          .map(item => item.clubeId);

        // Marca para remover da competição atual
        if (!clubesParaRemover.has(competicaoAnterior.nome)) {
          clubesParaRemover.set(competicaoAnterior.nome, new Set());
        }
        promovidos.forEach(id => clubesParaRemover.get(competicaoAnterior.nome)!.add(id));

        // Adiciona na divisão superior
        const divisaoSuperior = divisoes.find(d => d.id === divisao.divisaoSuperiorId);
        if (divisaoSuperior) {
          const nomeDestino = divisaoSuperior.nome;
          if (!clubesParaAdicionar.has(nomeDestino)) {
            clubesParaAdicionar.set(nomeDestino, []);
          }
          clubesParaAdicionar.get(nomeDestino)!.push(...promovidos);
        }
      }
    }

    // Segunda passada: cria todas as competições com os ajustes
    for (const competicaoId of selecionadas) {
      const competicaoAnterior = competicoesAnteriores.find(c => c.id === competicaoId);
      if (!competicaoAnterior) continue;

      // Começa com todos os clubes
      let novosClubesIds: number[] = [...competicaoAnterior.clubesIds];

      // Remove os que devem ser removidos
      const clubesRemover = clubesParaRemover.get(competicaoAnterior.nome);
      if (clubesRemover) {
        novosClubesIds = novosClubesIds.filter(id => !clubesRemover.has(id));
      }

      // Adiciona os que devem ser adicionados
      const clubesAdicionar = clubesParaAdicionar.get(competicaoAnterior.nome);
      if (clubesAdicionar) {
        novosClubesIds = [...novosClubesIds, ...clubesAdicionar];
        // Remove duplicatas
        novosClubesIds = [...new Set(novosClubesIds)];
      }

      // Cria nova competição
      const novaCompeticaoId = await db.competicoes.add({
        temporadaId: temporadaAtual.id!,
        nome: competicaoAnterior.nome,
        tipo: competicaoAnterior.tipo,
        status: novosClubesIds.length > 0 
          ? (competicaoAnterior.tipo === 'mata-mata' && novosClubesIds.length % 2 !== 0
              ? 'configurando'
              : 'pronta')
          : 'configurando',
        clubesIds: novosClubesIds,
        rodadasGeradas: false,
        createdAt: new Date()
      });

      competicoesCriadas.set(competicaoAnterior.nome, novaCompeticaoId);
    }

    onImport();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Importar Competições</h2>
        <p className="text-gray-600 mb-4">
          Selecione as competições finalizadas do ano anterior para importar:
        </p>

        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {competicoesAnteriores.length === 0 ? (
            <p className="text-gray-500">Nenhuma competição finalizada encontrada no ano anterior.</p>
          ) : (
            competicoesAnteriores.map(comp => (
              <label
                key={comp.id}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selecionadas.has(comp.id!)}
                  onChange={(e) => {
                    const newSet = new Set(selecionadas);
                    if (e.target.checked) {
                      newSet.add(comp.id!);
                    } else {
                      newSet.delete(comp.id!);
                    }
                    setSelecionadas(newSet);
                  }}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium">{comp.nome}</div>
                  <div className="text-sm text-gray-500">
                    {comp.tipo === 'pontos-corridos' ? 'Pontos Corridos' : 'Mata-Mata'} • {comp.clubesIds.length} clubes
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={selecionadas.size === 0}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Importar ({selecionadas.size})
          </button>
        </div>
      </div>
    </div>
  );
}

function CompeticaoModal({
  formData,
  setFormData,
  onSubmit,
  onClose,
  editingCompeticao
}: {
  formData: { nome: string; tipo: 'pontos-corridos' | 'mata-mata'; clubesIds: number[] };
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  editingCompeticao: Competicao | null;
}) {
  const [clubes, setClubes] = useState<any[]>([]);

  useEffect(() => {
    loadClubes();
  }, []);

  const loadClubes = async () => {
    const allClubes = await db.clubes.toArray();
    setClubes(allClubes);
  };

  const toggleClube = (clubeId: number) => {
    if (formData.clubesIds.includes(clubeId)) {
      setFormData({
        ...formData,
        clubesIds: formData.clubesIds.filter(id => id !== clubeId)
      });
    } else {
      setFormData({
        ...formData,
        clubesIds: [...formData.clubesIds, clubeId]
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {editingCompeticao ? 'Editar Competição' : 'Nova Competição'}
        </h2>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Competição
            </label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Competição
            </label>
            <select
              value={formData.tipo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tipo: e.target.value as 'pontos-corridos' | 'mata-mata'
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="pontos-corridos">Pontos Corridos</option>
              <option value="mata-mata">Mata-Mata</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clubes Participantes
            </label>
            <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
              {clubes.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Nenhum clube cadastrado. Crie clubes primeiro.
                </p>
              ) : (
                <div className="space-y-2">
                  {clubes.map(clube => (
                    <label
                      key={clube.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.clubesIds.includes(clube.id!)}
                        onChange={() => toggleClube(clube.id!)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div className="flex items-center space-x-2 flex-1">
                        {clube.logo && (
                          <img
                            src={clube.logo}
                            alt={clube.nome}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {clube.nome}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({clube.pais})
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {formData.tipo === 'mata-mata' && formData.clubesIds.length % 2 !== 0 && (
              <p className="text-xs text-orange-600 mt-2">
                Mata-mata precisa de número par de times
              </p>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {editingCompeticao ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

