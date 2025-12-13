import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Upload } from 'lucide-react';
import { db, Clube } from '../db/database';

const PAISES_SUL_AMERICANOS = [
  'Argentina',
  'Bolívia',
  'Brasil',
  'Chile',
  'Colômbia',
  'Equador',
  'Guiana',
  'Paraguai',
  'Peru',
  'Suriname',
  'Uruguai',
  'Venezuela'
];

export default function Clubes() {
  const [clubes, setClubes] = useState<Clube[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClube, setEditingClube] = useState<Clube | null>(null);
  const [paisCustomizado, setPaisCustomizado] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    forca: 50,
    pais: '',
    logo: ''
  });

  useEffect(() => {
    loadClubes();
  }, []);

  const loadClubes = async () => {
    const allClubes = await db.clubes.toArray();
    setClubes(allClubes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingClube) {
      await db.clubes.update(editingClube.id!, {
        ...formData,
        forca: Number(formData.forca)
      });
    } else {
      await db.clubes.add({
        ...formData,
        forca: Number(formData.forca),
        createdAt: new Date()
      });
    }
    
    setShowModal(false);
    setEditingClube(null);
    setFormData({ nome: '', forca: 50, pais: '', logo: '' });
    loadClubes();
  };

  const handleEdit = (clube: Clube) => {
    setEditingClube(clube);
    const isPaisCustomizado = !PAISES_SUL_AMERICANOS.includes(clube.pais);
    setPaisCustomizado(isPaisCustomizado);
    setFormData({
      nome: clube.nome,
      forca: clube.forca,
      pais: clube.pais,
      logo: clube.logo || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este clube?')) {
      await db.clubes.delete(id);
      loadClubes();
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
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
              setEditingClube(null);
              setPaisCustomizado(false);
              setFormData({ nome: '', forca: 50, pais: '', logo: '' });
              setShowModal(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Clube
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Clubes</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubes.map(clube => (
            <div
              key={clube.id}
              className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4 flex-1">
                {clube.logo ? (
                  <img
                    src={clube.logo}
                    alt={clube.nome}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-xl">
                      {clube.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {clube.nome}
                  </h3>
                  <p className="text-sm text-gray-600">{clube.pais}</p>
                  <div className="mt-1">
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">Força:</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${clube.forca}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-700 ml-2">
                        {clube.forca}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(clube)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(clube.id!)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {clubes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum clube cadastrado ainda.</p>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingClube ? 'Editar Clube' : 'Novo Clube'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Clube
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
                    País
                  </label>
                  <div className="space-y-2">
                    {!paisCustomizado ? (
                      <>
                        <select
                          required
                          value={formData.pais}
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              setPaisCustomizado(true);
                              setFormData({ ...formData, pais: '' });
                            } else {
                              setFormData({ ...formData, pais: e.target.value });
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">Selecione um país</option>
                          {PAISES_SUL_AMERICANOS.map(pais => (
                            <option key={pais} value={pais}>
                              {pais}
                            </option>
                          ))}
                          <option value="custom">+ Adicionar outro país</option>
                        </select>
                      </>
                    ) : (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          required
                          value={formData.pais}
                          onChange={(e) =>
                            setFormData({ ...formData, pais: e.target.value })
                          }
                          placeholder="Digite o nome do país"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPaisCustomizado(false);
                            setFormData({ ...formData, pais: '' });
                          }}
                          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Voltar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Força (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formData.forca}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        forca: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo
                  </label>
                  <div className="flex items-center space-x-4">
                    {formData.logo && (
                      <img
                        src={formData.logo}
                        alt="Preview"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingClube(null);
                      setPaisCustomizado(false);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {editingClube ? 'Salvar' : 'Criar'}
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

