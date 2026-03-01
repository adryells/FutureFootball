import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { db, Universo } from '../db/database';

export default function Universos() {
  const [universos, setUniversos] = useState<Universo[]>([]);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUniverso, setEditingUniverso] = useState<Universo | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadUniversos();
  }, []);

  const loadUniversos = async () => {
    const allUniversos = await db.universos.toArray();
    setUniversos(allUniversos);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUniverso) {
      await db.universos.update(editingUniverso.id!, formData);
    } else {
      const id = await db.universos.add({
        ...formData,
        createdAt: new Date()
      });
      navigate(`/universos/${id}`);
    }
    
    setShowModal(false);
    setEditingUniverso(null);
    setFormData({ nome: '', descricao: '' });
    loadUniversos();
  };

  const handleEdit = (universo: Universo) => {
    setEditingUniverso(universo);
    setFormData({
      nome: universo.nome,
      descricao: universo.descricao || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este universo? Todas as temporadas e competições serão excluídas.')) {
      // Deletar temporadas e competições relacionadas
      const temporadas = await db.temporadas.where('universoId').equals(id).toArray();
      for (const temp of temporadas) {
        const competicoes = await db.competicoes.where('temporadaId').equals(temp.id!).toArray();
        for (const comp of competicoes) {
          await db.partidas.where('competicaoId').equals(comp.id!).delete();
        }
        await db.competicoes.where('temporadaId').equals(temp.id!).delete();
      }
      await db.temporadas.where('universoId').equals(id).delete();
      await db.universos.delete(id);
      loadUniversos();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <button
            onClick={() => {
              setEditingUniverso(null);
              setFormData({ nome: '', descricao: '' });
              setShowModal(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Universo
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Universos</h1>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar universos..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {universos
            .filter(u => u.nome.toLowerCase().includes(filter.toLowerCase()))
            .map(universo => (
            <div
              key={universo.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <Link
                  to={`/universos/${universo.id}`}
                  className="flex-1"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {universo.nome}
                  </h3>
                  {universo.descricao && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {universo.descricao}
                    </p>
                  )}
                </Link>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(universo)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(universo.id!)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <Link
                to={`/universos/${universo.id}`}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                Ver detalhes →
              </Link>
            </div>
          ))}
        </div>

        {universos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum universo criado ainda.</p>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingUniverso ? 'Editar Universo' : 'Novo Universo'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Universo
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingUniverso(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {editingUniverso ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

