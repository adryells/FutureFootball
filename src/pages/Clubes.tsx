import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Upload, Download } from 'lucide-react';
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

// try to fetch logo from Wikimedia (pt/en) then fallback to TheSportsDB
async function fetchLogoFromWikimedia(name: string) {
  const langs = ['pt', 'en'];
  const variants = [
    name,
    `${name} Futebol Clube`,
    `${name} FC`,
    `${name} F.C.`,
    `${name} (football club)`,
    `${name} (futebol)`
  ];

  for (const lang of langs) {
    for (const v of variants) {
      try {
        const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(v)}`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const json = await res.json();
        if (json && json.thumbnail && json.thumbnail.source) {
          return json.thumbnail.source as string;
        }
      } catch (e) {
        // ignore and continue
      }
    }
  }
  return null;
}

async function fetchLogoFromTheSportsDB(name: string) {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/1/searchteams.php?t=${encodeURIComponent(name)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (json && json.teams && json.teams.length > 0) {
      const t = json.teams[0];
      return t.strTeamBadge || t.strTeamLogo || null;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

async function resolveLogoForClub(name: string) {
  // first try Wikimedia
  const wiki = await fetchLogoFromWikimedia(name);
  if (wiki) return wiki;
  // then try TheSportsDB
  const tsdb = await fetchLogoFromTheSportsDB(name);
  if (tsdb) return tsdb;
  return '';
}

// package data that can be imported in the "Clubes" section
// each clube can be either a string (legacy) or an object with { nome, forca, logo }
type ClubPackageItem = { nome: string; forca?: number; logo?: string } | string;
const CLUB_PACKAGES: Record<string, { name: string; clubes: ClubPackageItem[] }> = {
  'brasil-2026': {
    name: 'Brasil 2026',
    clubes: Array.from(
      new Set([
        // série A (nome, força aproximada, logo opcional)
        { nome: 'Flamengo', forca: 95, logo: 'https://logo.clearbit.com/flamengo.com.br?size=256' },
        { nome: 'Palmeiras', forca: 94, logo: 'https://logo.clearbit.com/palmeiras.com.br?size=256' },
        { nome: 'Atlético-MG', forca: 90, logo: 'https://logo.clearbit.com/atleticomg.com.br?size=256' },
        { nome: 'Corinthians', forca: 88, logo: 'https://logo.clearbit.com/corinthians.com.br?size=256' },
        { nome: 'Fluminense', forca: 88, logo: 'https://logo.clearbit.com/fluminense.com.br?size=256' },
        { nome: 'São Paulo', forca: 86, logo: 'https://logo.clearbit.com/spfc.com.br?size=256' },
        { nome: 'Internacional', forca: 87, logo: 'https://logo.clearbit.com/internacional.com.br?size=256' },
        { nome: 'Grêmio', forca: 82, logo: 'https://logo.clearbit.com/gremio.net?size=256' },
        { nome: 'Bragantino', forca: 83, logo: 'https://logo.clearbit.com/bragantino.com.br?size=256' },
        { nome: 'Santos', forca: 80, logo: 'https://logo.clearbit.com/santosfc.com.br?size=256' },
        { nome: 'Athletico-PR', forca: 80, logo: 'https://logo.clearbit.com/athletico.com.br?size=256' },
        { nome: 'Cruzeiro', forca: 78, logo: 'https://logo.clearbit.com/cruzeiro.com.br?size=256' },
        { nome: 'Botafogo', forca: 75, logo: 'https://logo.clearbit.com/botafogo.com.br?size=256' },
        { nome: 'Vasco', forca: 72, logo: 'https://logo.clearbit.com/vasco.com.br?size=256' },
        { nome: 'Bahia', forca: 70, logo: 'https://logo.clearbit.com/ecbahia.com.br?size=256' },
        { nome: 'Coritiba', forca: 68, logo: 'https://logo.clearbit.com/coritiba.com.br?size=256' },
        { nome: 'Remo', forca: 58, logo: 'https://logo.clearbit.com/cremonese.com?size=256' },
        { nome: 'Mirassol', forca: 60, logo: 'https://logo.clearbit.com/mirassolfc.com.br?size=256' },
        { nome: 'Chapecoense', forca: 55, logo: 'https://logo.clearbit.com/chapecoense.com?size=256' },
        { nome: 'Vitória', forca: 50, logo: 'https://logo.clearbit.com/ecvitoria.com.br?size=256' },
        // série B
        { nome: 'América-MG', forca: 82, logo: 'https://logo.clearbit.com/america-mg.com.br?size=256' },
        { nome: 'Fortaleza', forca: 75, logo: 'https://logo.clearbit.com/fortalezaec.net?size=256' },
        { nome: 'Sport', forca: 72, logo: 'https://logo.clearbit.com/sportrecife.com.br?size=256' },
        { nome: 'Atlético-GO', forca: 70, logo: 'https://logo.clearbit.com/atleticogoianiense.com.br?size=256' },
        { nome: 'Goiás', forca: 70, logo: 'https://logo.clearbit.com/goiasesporteclube.com.br?size=256' },
        { nome: 'Náutico', forca: 66, logo: 'https://logo.clearbit.com/timenga.com.br?size=256' },
        { nome: 'Ponte Preta', forca: 65, logo: 'https://logo.clearbit.com/pontepreta.com.br?size=256' },
        { nome: 'Athletic Club', forca: 65, logo: 'https://logo.clearbit.com/athletic-club.com?size=256' },
        { nome: 'Avaí', forca: 68, logo: 'https://logo.clearbit.com/avai.com.br?size=256' },
        { nome: 'Ceará', forca: 74, logo: 'https://logo.clearbit.com/cearasc.com?size=256' },
        { nome: 'Criciúma', forca: 63, logo: 'https://logo.clearbit.com/criciumaec.com.br?size=256' },
        { nome: 'CRB', forca: 60, logo: 'https://logo.clearbit.com/crb.ebel.com.br?size=256' },
        { nome: 'Cuiabá', forca: 69, logo: 'https://logo.clearbit.com/cuiabaesporteclube.com?size=256' },
        { nome: 'Juventude', forca: 62, logo: 'https://logo.clearbit.com/juventude.com.br?size=256' },
        { nome: 'Londrina', forca: 61, logo: 'https://logo.clearbit.com/londrinaesporteclube.com.br?size=256' },
        { nome: 'Novorizontino', forca: 60, logo: 'https://logo.clearbit.com/novorizontino.com.br?size=256' },
        { nome: 'Operário-PR', forca: 59, logo: 'https://logo.clearbit.com/operario.com.br?size=256' },
        { nome: 'São Bernardo', forca: 58, logo: 'https://logo.clearbit.com/saobernardofc.com.br?size=256' },
        { nome: 'Botafogo-SP', forca: 64, logo: 'https://logo.clearbit.com/botafogosp.com.br?size=256' },
        { nome: 'Vila Nova', forca: 56, logo: 'https://logo.clearbit.com/vilanovagol.com.br?size=256' },
        // série C (apenas nomes, força padrão)
        'Amazonas',
        'Anápolis',
        'Barra-SC',
        'Botafogo-PB',
        'Brusque',
        'Caxias',
        'Confiança',
        'Ferroviária-SP',
        'Figueirense',
        'Floresta',
        'Guarani',
        'Inter de Limeira',
        'Itabaiana',
        'Ituano',
        'Maranhão',
        'Maringá',
        'Santa Cruz',
        'Ypiranga-RS',
        // série D (apenas nomes)
        'ABECAT',
        'America-RJ',
        'Aparecidense',
        'Araguaína',
        'ASA',
        'Atlético-BA',
        'Atlético-CE',
        'Barra-SC',
        'Brasiliense',
        'Capital-DF',
        'Cascavel',
        'Ceilândia',
        'Central',
        'Confiança',
        'CRAC',
        'CSA',
        'CSE',
        'Decisão',
        'Ferroviário',
        'Fluminense-PI',
        'Galvez',
        'Gama',
        'Goiatuba',
        'Humaitá',
        'IAPE',
        'Iguatu',
        'Imperatriz',
        'Independência-AC',
        'Inhumas',
        'Itabaiana',
        'Jacuipense',
        'Joinville',
        'Juazeirense',
        'Lagarto',
        'Luverdense',
        'Madureira',
        'Maguary',
        'Manauara',
        'Manaus',
        'Marcílio Dias',
        'Maracanã-CE',
        'Moto Club',
        'Nacional-AM',
        'Noroeste',
        'Nova Iguaçu',
        'Operário-VG',
        'Oratório-AP',
        'Parnahyba',
        'Piauí',
        'Porto-BA',
        'Portuguesa',
        'Portuguesa-RJ',
        'Pouso Alegre',
        'Real Noroeste',
        'Retrô',
        'Rio Branco-ES',
        'Santa Catarina-SC',
        'Sampaio Corrêa',
        'São José-RS',
        'São Raimundo-RR',
        'Sergipe',
        'Tirol',
        'Tocantinópolis',
        'Trem-AP',
        'Treze',
        'União Rondonópolis',
        'Velo Clube',
        'Vitória-ES',
        'XV de Piracicaba',
        'Água Santa',
        'Altos',
        'Anápolis',
        'Blumenau',
        'Botafogo-PB',
        'Brusque',
        'Caxias',
        'Figueirense',
        'Floresta',
        'Guarani',
        'Inter de Limeira',
        'Ituano',
        'Maringá',
        'Santa Cruz',
        'Ypiranga-RS',
        'ABC',
        'CSA',
        'Retrô',
        'Tombense',
        'Ivinhema',
        'Uberaba',
        'Uberlândia',
        'Essube',
        'Arachá'
      ])
    )
  }
};

export default function Clubes() {
  const { addToast: toast } = useToast();
  const [clubes, setClubes] = useState<Clube[]>([]);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClube, setEditingClube] = useState<Clube | null>(null);
  const [paisCustomizado, setPaisCustomizado] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    forca: 50,
    pais: '',
    logo: ''
  });

  // import package state
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>('brasil-2026');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);

  const [selectedClubIds, setSelectedClubIds] = useState<number[]>([]);

  const handleImportPackage = async () => {
    const pkg = CLUB_PACKAGES[selectedPackage];
    if (!pkg) return;
    setImporting(true);
    setImportProgress(0);
    setImportTotal(pkg.clubes.length);
    for (const item of pkg.clubes) {
      const nome = typeof item === 'string' ? item : item.nome;
      const forca = typeof item === 'string' ? 50 : item.forca ?? 50;
      const logo = typeof item === 'string' ? '' : item.logo ?? '';
      const exists = await db.clubes.where('nome').equals(nome).first();
      if (!exists) {
          let finalLogo = logo;
          if (!finalLogo) {
            try {
              finalLogo = await resolveLogoForClub(nome);
            } catch (e) {
              finalLogo = '';
            }
          }
          await db.clubes.add({
            nome,
            pais: 'Brasil',
            forca: Number(forca),
            logo: finalLogo,
            createdAt: new Date()
          });
      }
      setImportProgress(prev => prev + 1);
    }
    loadClubes();
    setShowImportModal(false);
    setImporting(false);
    setImportProgress(0);
    setImportTotal(0);
  };

  useEffect(() => {
    loadClubes();
  }, []);

  // auto-import when query param present: ?import=brasil-2026
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const toImport = params.get('import');
      if (toImport === selectedPackage) {
        // run import in background
        void (async () => {
          await handleImportPackage();
          // remove query param to avoid re-running
          params.delete('import');
          const newQuery = params.toString();
          const newUrl = window.location.pathname + (newQuery ? `?${newQuery}` : '');
          window.history.replaceState({}, document.title, newUrl);
        })();
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setShowImportModal(true);
                setSelectedPackage('brasil-2026');
              }}
              disabled={importing}
              className={`px-4 py-2 rounded-lg flex items-center ${importing ? 'bg-gray-400 text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}
            >
              <Upload className="w-5 h-5 mr-2" />
              {importing ? `Importando (${importProgress}/${importTotal})` : 'Importar Pacote'}
            </button>

            <button
              onClick={async () => {
                const league = prompt('Digite o nome da liga para importar (ex: "Brazil Serie A")');
                if (!league) return;
                try {
                  const resp = await fetch(
                    `https://www.thesportsdb.com/api/v1/json/1/search_all_teams.php?l=${encodeURIComponent(
                      league
                    )}`
                  );
                  if (!resp.ok) {
                    toast('Liga não encontrada na SportsDB.');
                    return;
                  }
                  const json = await resp.json();
                  if (json.teams) {
                    for (const t of json.teams) {
                      const exists = await db.clubes.where('nome').equals(t.strTeam).first();
                      if (!exists) {
                        await db.clubes.add({
                          nome: t.strTeam,
                          pais: t.strCountry || 'Desconhecido',
                          forca: 50,
                          logo: t.strTeamBadge || '',
                          createdAt: new Date()
                        });
                      }
                    }
                    loadClubes();
                    toast(`Importado ${json.teams.length} clubes de ${league}`);
                  } else {
                    toast('Nenhum time encontrado para essa liga.');
                  }
                } catch (err) {
                  toast('Erro ao buscar dados da liga.');
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Importar da SportsDB
            </button>

            <button
              onClick={async () => {
                if (selectedClubIds.length === 0) return;
                if (!confirm(`Remover ${selectedClubIds.length} clubes selecionados?`)) return;
                await db.clubes.bulkDelete(selectedClubIds);
                setSelectedClubIds([]);
                loadClubes();
              }}
              disabled={selectedClubIds.length === 0}
              className={`px-4 py-2 rounded-lg ${selectedClubIds.length === 0 ? 'bg-gray-200 text-gray-500' : 'bg-red-600 text-white hover:bg-red-700'}`}
            >
              Remover Selecionados
            </button>

            <button
              onClick={async () => {
                if (!confirm('Tem certeza que deseja remover TODOS os clubes? Essa ação é irreversível.')) return;
                await db.clubes.clear();
                setSelectedClubIds([]);
                loadClubes();
                toast('Todos os clubes foram removidos.');
              }}
              className="px-4 py-2 rounded-lg bg-red-700 text-white hover:bg-red-800"
            >
              Remover Todos
            </button>

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
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Clubes</h1>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar clubes..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {importing && (
          <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
            Importando pacotes: {importProgress}/{importTotal}. Isso pode demorar — por favor aguarde.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubes
            .filter(c => c.nome.toLowerCase().includes(filter.toLowerCase()))
            .map(clube => (
            <div
              key={clube.id}
              className="bg-white rounded-lg shadow p-4 flex items-center justify-between transition-transform transform hover:-translate-y-1 hover:scale-105 hover:shadow-xl duration-200 ff-fade-in"
            >
              <div className="flex items-center space-x-4 flex-1">
                <input
                  type="checkbox"
                  checked={clube.id ? selectedClubIds.includes(clube.id) : false}
                  onChange={() => {
                    if (!clube.id) return;
                    setSelectedClubIds(prev =>
                      prev.includes(clube.id!) ? prev.filter(id => id !== clube.id) : [...prev, clube.id!]
                    );
                  }}
                  className="w-4 h-4"
                />
                {clube.logo ? (
                  <img
                    src={clube.logo}
                    alt={clube.nome}
                    className="w-16 h-16 rounded-full object-cover transition-transform duration-200 hover:scale-110"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center animate-pulse">
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

        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Importar Pacote</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pacote
                </label>
                <select
                  value={selectedPackage}
                  onChange={e => setSelectedPackage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {Object.entries(CLUB_PACKAGES).map(([key, pkg]) => (
                    <option key={key} value={key}>
                      {pkg.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleImportPackage}
                  disabled={importing}
                  className={`flex-1 px-4 py-2 rounded-lg ${importing ? 'bg-gray-400 text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                  {importing ? `Importando (${importProgress}/${importTotal})` : 'Importar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

