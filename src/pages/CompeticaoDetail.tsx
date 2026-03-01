import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, Trophy, Zap, CheckCircle, Settings } from 'lucide-react';
import { db, Competicao, Partida, Clube, Temporada, SecaoCompeticao } from '../db/database';
import { gerarRodadasPontosCorridos, gerarRodadasMataMata, calcularClassificacao, calcularFormaRecente, FormaRecente } from '../utils/competicao';
import { ClassificacaoItem } from '../types';

export default function CompeticaoDetail() {
  const { id } = useParams<{ id: string }>();
  const [competicao, setCompeticao] = useState<Competicao | null>(null);
  const [temporada, setTemporada] = useState<Temporada | null>(null);
  const [clubes, setClubes] = useState<Clube[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [classificacao, setClassificacao] = useState<ClassificacaoItem[]>([]);
  const [formasRecentes, setFormasRecentes] = useState<Map<number, FormaRecente[]>>(new Map());
  const [secoes, setSecoes] = useState<SecaoCompeticao[]>([]);
  const [showSecoesModal, setShowSecoesModal] = useState(false);
  const [rodadaSelecionada, setRodadaSelecionada] = useState<number>(1);
  const [showClassificacao, setShowClassificacao] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  useEffect(() => {
    if (competicao && partidas.length > 0 && competicao.tipo === 'pontos-corridos') {
      updateClassificacao();
    }
  }, [partidas.length, competicao?.id]);

  const loadData = async () => {
    if (!id) return;
    const competicaoData = await db.competicoes.get(Number(id));
    setCompeticao(competicaoData || null);

    if (competicaoData) {
      const temporadaData = await db.temporadas.get(competicaoData.temporadaId);
      setTemporada(temporadaData || null);

      const clubesData = await db.clubes
        .where('id')
        .anyOf(competicaoData.clubesIds)
        .toArray();
      setClubes(clubesData);

      const partidasData = await db.partidas
        .where('competicaoId')
        .equals(Number(id))
        .toArray();
      setPartidas(partidasData);

      const secoesData = await db.secoes
        .where('competicaoId')
        .equals(Number(id))
        .toArray();
      setSecoes(secoesData);

      if (partidasData.length > 0) {
        const minRodada = Math.min(...partidasData.map(p => p.rodada));
        // Sempre começa na primeira rodada ao carregar a página
        setRodadaSelecionada(minRodada);
      }
    }
  };

  const updateClassificacao = async () => {
    if (!competicao) return;
    const classificacaoData = await calcularClassificacao(
      competicao.id!,
      competicao.clubesIds
    );
    setClassificacao(classificacaoData);

    // Calcula forma recente para cada clube
    const formasMap = new Map<number, FormaRecente[]>();
    for (const item of classificacaoData) {
      const forma = await calcularFormaRecente(
        item.clubeId,
        competicao.id!,
        clubes
      );
      formasMap.set(item.clubeId, forma);
    }
    setFormasRecentes(formasMap);
  };

  const gerarRodadas = async () => {
    if (!competicao) return;

    if (competicao.tipo === 'pontos-corridos') {
      const novasPartidas = gerarRodadasPontosCorridos(competicao.clubesIds);
      novasPartidas.forEach(p => {
        p.competicaoId = competicao.id!;
      });
      await db.partidas.bulkAdd(novasPartidas);
    } else {
      const novasPartidas = gerarRodadasMataMata(competicao.clubesIds);
      novasPartidas.forEach(p => {
        p.competicaoId = competicao.id!;
      });
      await db.partidas.bulkAdd(novasPartidas);
    }

    await db.competicoes.update(competicao.id!, {
      rodadasGeradas: true,
      status: 'em-andamento'
    });

    loadData();
  };

  const checkTemporadaFinalizada = async (temporadaId: number) => {
    // se todas as competições da temporada estiverem finalizadas, marca a temporada
    const comps = await db.competicoes.where('temporadaId').equals(temporadaId).toArray();
    if (comps.length > 0 && comps.every(c => c.status === 'finalizada')) {
      await db.temporadas.update(temporadaId, { finalizada: true });
    }
  };

  const verificarFinalizacao = async () => {
    if (!competicao) return;
    
    const todasPartidas = await db.partidas
      .where('competicaoId')
      .equals(competicao.id!)
      .toArray();
    
    const todasJogadas = todasPartidas.length > 0 && todasPartidas.every(p => p.jogada);
    
    if (todasJogadas && competicao.status !== 'finalizada') {
      await db.competicoes.update(competicao.id!, {
        status: 'finalizada'
      });
      setCompeticao({ ...competicao, status: 'finalizada' });
      // ao finalizar competição, verifique se temporada também deve ser finalizada
      await checkTemporadaFinalizada(competicao.temporadaId);
    }
  };

  const atualizarPlacar = async (
    partidaId: number,
    golsCasa: number | undefined,
    golsVisitante: number | undefined,
    manterRodada: boolean = true
  ) => {
    const partida = partidas.find(p => p.id === partidaId);
    if (!partida) return;

    const rodadaAtual = rodadaSelecionada;
    const jogada = golsCasa !== undefined && golsVisitante !== undefined;

    await db.partidas.update(partidaId, {
      golsCasa,
      golsVisitante,
      jogada
    });

    // Recarrega dados mas mantém a rodada selecionada
    const partidasData = await db.partidas
      .where('competicaoId')
      .equals(Number(id))
      .toArray();
    setPartidas(partidasData);
    
    if (manterRodada) {
      setRodadaSelecionada(rodadaAtual);
    }

    // Verifica se todas as partidas foram jogadas
    await verificarFinalizacao();
    
    // Atualiza classificação apenas para pontos corridos
    if (competicao && competicao.tipo === 'pontos-corridos') {
      const classificacaoData = await calcularClassificacao(
        competicao.id!,
        competicao.clubesIds
      );
      setClassificacao(classificacaoData);
    }
  };

  const gerarResultadoAutomatico = async (partidaId: number) => {
    const partida = partidas.find(p => p.id === partidaId);
    if (!partida) return;

    const clubeCasa = clubes.find(c => c.id === partida.clubeCasaId);
    const clubeVisitante = clubes.find(c => c.id === partida.clubeVisitanteId);

    if (!clubeCasa || !clubeVisitante) return;

    // Calcula probabilidades baseadas na força
    const forcaCasa = clubeCasa.forca;
    const forcaVisitante = clubeVisitante.forca;
    const somaForcas = forcaCasa + forcaVisitante;

    // Probabilidade de vitória (com vantagem de casa)
    const probVitoriaCasa = (forcaCasa * 1.1) / (forcaCasa * 1.1 + forcaVisitante);
    const probEmpate = 0.25; // 25% de chance de empate
    const probVitoriaVisitante = 1 - probVitoriaCasa - probEmpate;

    // Gera resultado aleatório
    const random = Math.random();
    let golsCasa: number;
    let golsVisitante: number;

    if (random < probVitoriaCasa) {
      // Vitória do time de casa
      golsCasa = Math.floor(Math.random() * 4) + 1; // 1-4 gols
      golsVisitante = Math.floor(Math.random() * golsCasa); // Menos que o time de casa
    } else if (random < probVitoriaCasa + probEmpate) {
      // Empate
      const gols = Math.floor(Math.random() * 3); // 0-2 gols
      golsCasa = gols;
      golsVisitante = gols;
    } else {
      // Vitória do visitante
      golsVisitante = Math.floor(Math.random() * 4) + 1; // 1-4 gols
      golsCasa = Math.floor(Math.random() * golsVisitante); // Menos que o visitante
    }

    await atualizarPlacar(partidaId, golsCasa, golsVisitante, true);
  };

  const partidasRodada = partidas.filter(p => p.rodada === rodadaSelecionada);
  const rodadas = [...new Set(partidas.map(p => p.rodada))].sort((a, b) => a - b);

  if (!competicao) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          {temporada && (
            <Link
              to={`/universos/${temporada.universoId}/temporadas/${competicao.temporadaId}`}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Link>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {competicao.nome}
              </h1>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 text-sm rounded ${getStatusColor(competicao.status)}`}>
                  {getStatusText(competicao.status)}
                </span>
                <span className="text-sm text-gray-600">
                  {competicao.tipo === 'pontos-corridos' ? 'Pontos Corridos' : 'Mata-Mata'}
                </span>
                <span className="text-sm text-gray-600">
                  {competicao.clubesIds.length} clube(s)
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {competicao.status === 'pronta' && !competicao.rodadasGeradas && (
                <button
                  onClick={gerarRodadas}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Gerar Rodadas
                </button>
              )}
              {competicao.status === 'em-andamento' && (
                <button
                  onClick={async () => {
                    const partidasNaoJogadas = partidas.filter(p => !p.jogada);
                    const mensagem = partidasNaoJogadas.length > 0
                      ? `Existem ${partidasNaoJogadas.length} partida(s) não jogada(s). Deseja gerar resultados automáticos para elas e finalizar a competição?`
                      : 'Tem certeza que deseja finalizar esta competição?';
                    
                    if (confirm(mensagem)) {
                      // Gera resultados automáticos para partidas não jogadas
                      for (const partida of partidasNaoJogadas) {
                        await gerarResultadoAutomatico(partida.id!);
                      }
                      
                      await db.competicoes.update(competicao.id!, {
                        status: 'finalizada'
                      });
                      // after finalizing competition, check if season should be marked finalized
                      await checkTemporadaFinalizada(competicao.temporadaId);
                      await loadData();
                    }
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Finalizar Competição
                </button>
              )}
            </div>
          </div>

          {competicao.status === 'configurando' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                {competicao.clubesIds.length === 0
                  ? 'Adicione clubes participantes para poder simular a competição.'
                  : competicao.tipo === 'mata-mata' && competicao.clubesIds.length % 2 !== 0
                  ? 'Mata-mata precisa de número par de times.'
                  : 'Configure a competição para poder simular.'}
              </p>
            </div>
          )}
          {competicao.rodadasGeradas && partidas.length > 0 && (
            (() => {
              const partidasJogadas = partidas.filter(p => p.jogada).length;
              const totalPartidas = partidas.length;
              const todasJogadas = partidasJogadas === totalPartidas;
              
              if (todasJogadas && competicao.status !== 'finalizada') {
                return (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                    <p className="text-green-800 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Todas as partidas foram jogadas! A competição pode ser finalizada.
                    </p>
                  </div>
                );
              }
              
              return (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-blue-800">
                    Progresso: {partidasJogadas} de {totalPartidas} partidas jogadas
                  </p>
                </div>
              );
            })()
          )}
        </div>

        {competicao.rodadasGeradas && (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Jogos</h2>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700">Rodada:</label>
                  <select
                    value={rodadaSelecionada}
                    onChange={(e) => setRodadaSelecionada(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {rodadas.map(rodada => (
                      <option key={rodada} value={rodada}>
                        Rodada {rodada}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {partidasRodada.map(partida => {
                  const clubeCasa = clubes.find(c => c.id === partida.clubeCasaId);
                  const clubeVisitante = clubes.find(c => c.id === partida.clubeVisitanteId);

                  return (
                    <div
                      key={partida.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center space-x-3 flex-1">
                          {clubeCasa?.logo ? (
                            <img
                              src={clubeCasa.logo}
                              alt={clubeCasa.nome}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">
                                {clubeCasa?.nome.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="font-medium text-gray-900">
                            {clubeCasa?.nome}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            value={partida.golsCasa ?? ''}
                            onChange={(e) =>
                              atualizarPlacar(
                                partida.id!,
                                e.target.value === '' ? undefined : Number(e.target.value),
                                partida.golsVisitante,
                                true
                              )
                            }
                            onFocus={(e) => e.target.select()}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="0"
                          />
                          <span className="text-gray-500">x</span>
                          <input
                            type="number"
                            min="0"
                            value={partida.golsVisitante ?? ''}
                            onChange={(e) =>
                              atualizarPlacar(
                                partida.id!,
                                partida.golsCasa,
                                e.target.value === '' ? undefined : Number(e.target.value),
                                true
                              )
                            }
                            onFocus={(e) => e.target.select()}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="0"
                          />
                          {!partida.jogada && (
                            <button
                              onClick={() => gerarResultadoAutomatico(partida.id!)}
                              className="ml-2 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                              title="Gerar resultado automático"
                            >
                              <Zap className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center space-x-3 flex-1 justify-end">
                          <span className="font-medium text-gray-900">
                            {clubeVisitante?.nome}
                          </span>
                          {clubeVisitante?.logo ? (
                            <img
                              src={clubeVisitante.logo}
                              alt={clubeVisitante.nome}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">
                                {clubeVisitante?.nome.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {competicao.tipo === 'pontos-corridos' && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                    Classificação
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowSecoesModal(true)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Configurar Seções
                    </button>
                    <button
                      onClick={() => setShowClassificacao(!showClassificacao)}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      {showClassificacao ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                </div>

                {showClassificacao && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            Pos
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            Clube
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                            P
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                            J
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                            V
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                            E
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                            D
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                            GP
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                            GC
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                            SG
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                            Forma
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {classificacao.map((item, index) => {
                          const posicao = index + 1;
                          const secao = secoes.find(s => posicao >= s.posicaoInicial && posicao <= s.posicaoFinal);
                          
                          return (
                          <tr
                            key={item.clubeId}
                            className={`border-b border-gray-100 hover:bg-gray-50 ${
                              secao ? 'border-l-4' : ''
                            }`}
                            style={{
                              borderLeftColor: secao ? secao.cor : undefined
                            }}
                          >
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">
                              <div className="flex items-center space-x-2">
                                <span>{posicao}º</span>
                                {secao && (
                                  <span
                                    className="px-2 py-0.5 text-xs rounded text-white"
                                    style={{ backgroundColor: secao.cor }}
                                  >
                                    {secao.nome}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                {item.clube.logo ? (
                                  <img
                                    src={item.clube.logo}
                                    alt={item.clube.nome}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400 text-xs">
                                      {item.clube.nome.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <span className="text-sm font-medium text-gray-900">
                                  {item.clube.nome}
                                </span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4 text-sm font-bold text-gray-900">
                              {item.pontos}
                            </td>
                            <td className="text-center py-3 px-4 text-sm text-gray-600">
                              {item.jogos}
                            </td>
                            <td className="text-center py-3 px-4 text-sm text-gray-600">
                              {item.vitorias}
                            </td>
                            <td className="text-center py-3 px-4 text-sm text-gray-600">
                              {item.empates}
                            </td>
                            <td className="text-center py-3 px-4 text-sm text-gray-600">
                              {item.derrotas}
                            </td>
                            <td className="text-center py-3 px-4 text-sm text-gray-600">
                              {item.golsPro}
                            </td>
                            <td className="text-center py-3 px-4 text-sm text-gray-600">
                              {item.golsContra}
                            </td>
                            <td className={`text-center py-3 px-4 text-sm font-medium ${
                              item.saldoGols > 0
                                ? 'text-green-600'
                                : item.saldoGols < 0
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }`}>
                              {item.saldoGols > 0 ? '+' : ''}
                              {item.saldoGols}
                            </td>
                            <td className="text-center py-3 px-4">
                              <div className="flex items-center justify-center space-x-1">
                                {(() => {
                                  const forma = formasRecentes.get(item.clubeId) || [];
                                  const formaCompleta = [...forma];
                                  // Preenche com espaços vazios se tiver menos de 5
                                  while (formaCompleta.length < 5) {
                                    formaCompleta.push({
                                      resultado: 'E',
                                      partida: {} as any,
                                      adversario: {} as any,
                                      foiCasa: false
                                    });
                                  }
                                  return formaCompleta.slice(0, 5).map((f, idx) => {
                                    if (!f.partida.id) {
                                      return (
                                        <span
                                          key={idx}
                                          className="w-6 h-6 flex items-center justify-center text-xs text-gray-400"
                                        >
                                          -
                                        </span>
                                      );
                                    }
                                    const adversarioNome = f.adversario?.nome || 'Desconhecido';
                                    const placar = f.foiCasa
                                      ? `${f.partida.golsCasa}x${f.partida.golsVisitante}`
                                      : `${f.partida.golsVisitante}x${f.partida.golsCasa}`;
                                    const tooltip = `Rodada ${f.partida.rodada}: ${item.clube.nome} ${placar} ${adversarioNome}${f.foiCasa ? ' (C)' : ' (F)'}`;
                                    
                                    return (
                                      <div
                                        key={idx}
                                        className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded cursor-help ${
                                          f.resultado === 'V'
                                            ? 'bg-green-500 text-white'
                                            : f.resultado === 'E'
                                            ? 'bg-gray-400 text-white'
                                            : 'bg-red-500 text-white'
                                        }`}
                                        title={tooltip}
                                      >
                                        {f.resultado}
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {showSecoesModal && competicao && (
          <SecoesModal
            competicao={competicao}
            secoes={secoes}
            onClose={() => setShowSecoesModal(false)}
            onSave={async () => {
              const novasSecoes = await db.secoes
                .where('competicaoId')
                .equals(competicao.id!)
                .toArray();
              setSecoes(novasSecoes);
            }}
          />
        )}
      </div>
    </div>
  );
}

function SecoesModal({
  competicao,
  secoes,
  onClose,
  onSave
}: {
  competicao: Competicao;
  secoes: SecaoCompeticao[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [secoesLocais, setSecoesLocais] = useState<SecaoCompeticao[]>(secoes);
  const [showForm, setShowForm] = useState(false);
  const [editingSecao, setEditingSecao] = useState<SecaoCompeticao | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    posicaoInicial: 1,
    posicaoFinal: 1,
    cor: '#3B82F6',
    qualificatoria: true,
    competicaoDestinoId: undefined as number | undefined,
    temporadaDestinoId: undefined as number | undefined,
    mesmoAno: false
  });
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);

  useEffect(() => {
    loadCompeticoes();
  }, []);

  const loadCompeticoes = async () => {
    const temp = await db.temporadas.get(competicao.temporadaId);
    if (temp) {
      const todasTemporadas = await db.temporadas
        .where('universoId')
        .equals(temp.universoId)
        .toArray();
      setTemporadas(todasTemporadas);

      const todasCompeticoes = await db.competicoes
        .where('temporadaId')
        .anyOf(todasTemporadas.map(t => t.id!))
        .toArray();
      setCompeticoes(todasCompeticoes);
    }
  };

  const handleSave = async () => {
    if (editingSecao) {
      await db.secoes.update(editingSecao.id!, {
        ...formData,
        competicaoId: competicao.id!,
        createdAt: editingSecao.createdAt
      });
    } else {
      await db.secoes.add({
        ...formData,
        competicaoId: competicao.id!,
        createdAt: new Date()
      });
    }
    const novasSecoes = await db.secoes
      .where('competicaoId')
      .equals(competicao.id!)
      .toArray();
    setSecoesLocais(novasSecoes);
    setShowForm(false);
    setEditingSecao(null);
    setFormData({
      nome: '',
      posicaoInicial: 1,
      posicaoFinal: 1,
      cor: '#3B82F6',
      qualificatoria: true,
      competicaoDestinoId: undefined,
      temporadaDestinoId: undefined,
      mesmoAno: false
    });
    onSave();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta seção?')) {
      await db.secoes.delete(id);
      const novasSecoes = await db.secoes
        .where('competicaoId')
        .equals(competicao.id!)
        .toArray();
      setSecoesLocais(novasSecoes);
      onSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Configurar Seções</h2>
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
              setEditingSecao(null);
              setFormData({
                nome: '',
                posicaoInicial: 1,
                posicaoFinal: 1,
                cor: '#3B82F6',
                qualificatoria: true,
                competicaoDestinoId: undefined,
                temporadaDestinoId: undefined,
                mesmoAno: false
              });
              setShowForm(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            + Nova Seção
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-gray-900 mb-4">
              {editingSecao ? 'Editar Seção' : 'Nova Seção'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  placeholder="Ex: G6, Z4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                <input
                  type="color"
                  value={formData.cor}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  className="w-full h-10 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Posição Inicial</label>
                <input
                  type="number"
                  min="1"
                  value={formData.posicaoInicial}
                  onChange={(e) => setFormData({ ...formData, posicaoInicial: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Posição Final</label>
                <input
                  type="number"
                  min="1"
                  value={formData.posicaoFinal}
                  onChange={(e) => setFormData({ ...formData, posicaoFinal: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                />
              </div>
              <div className="col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.qualificatoria}
                    onChange={(e) => setFormData({ ...formData, qualificatoria: e.target.checked })}
                  />
                  <span className="text-gray-700">Seção Qualificatória (caso contrário, será Rebaixatória)</span>
                </label>
              </div>
              {(formData.qualificatoria || !formData.qualificatoria) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.qualificatoria ? 'Temporada Destino' : 'Temporada Destino (onde os rebaixados irão)'}
                    </label>
                    <select
                      value={formData.temporadaDestinoId || ''}
                      onChange={(e) => setFormData({ ...formData, temporadaDestinoId: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                    >
                      <option value="">Selecione</option>
                      {temporadas.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.qualificatoria ? 'Competição Destino' : 'Competição Destino (onde os rebaixados irão)'}
                    </label>
                    <select
                      value={formData.competicaoDestinoId || ''}
                      onChange={(e) => setFormData({ ...formData, competicaoDestinoId: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                      disabled={!formData.temporadaDestinoId}
                    >
                      <option value="">Selecione</option>
                      {competicoes
                        .filter(c => c.temporadaId === formData.temporadaDestinoId)
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.mesmoAno}
                        onChange={(e) => setFormData({ ...formData, mesmoAno: e.target.checked })}
                      />
                      <span className="text-gray-700">Competição no mesmo ano</span>
                    </label>
                  </div>
                </>
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
                  setEditingSecao(null);
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {secoesLocais.map(secao => (
            <div
              key={secao.id}
              className="flex items-center justify-between p-3 border rounded-lg"
              style={{ borderLeftColor: secao.cor, borderLeftWidth: '4px' }}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span
                    className="px-2 py-1 text-xs rounded text-white"
                    style={{ backgroundColor: secao.cor }}
                  >
                    {secao.nome}
                  </span>
                  <span className="text-sm text-gray-600">
                    {secao.posicaoInicial}º - {secao.posicaoFinal}º
                  </span>
                  <span className="text-xs text-gray-500">
                    ({secao.qualificatoria ? 'Qualificatória' : 'Rebaixatória'})
                  </span>
                </div>
                {secao.competicaoDestinoId && (
                  <div className="text-xs text-gray-500 mt-1">
                    → {competicoes.find(c => c.id === secao.competicaoDestinoId)?.nome || 'N/A'}
                    {secao.mesmoAno ? ' (mesmo ano)' : ' (ano seguinte)'}
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingSecao(secao);
                    setFormData({
                      nome: secao.nome,
                      posicaoInicial: secao.posicaoInicial,
                      posicaoFinal: secao.posicaoFinal,
                      cor: secao.cor,
                      qualificatoria: secao.qualificatoria,
                      competicaoDestinoId: secao.competicaoDestinoId,
                      temporadaDestinoId: secao.temporadaDestinoId,
                      mesmoAno: secao.mesmoAno
                    });
                    setShowForm(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(secao.id!)}
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

