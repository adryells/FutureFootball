import { Partida, Clube, ClassificacaoItem } from '../types';
import { db } from '../db/database';

export function gerarRodadasPontosCorridos(clubesIds: number[]): Partida[] {
  const partidas: Partida[] = [];
  const numClubes = clubesIds.length;
  
  if (numClubes < 2) return partidas;

  // Algoritmo Round-Robin para gerar turno de ida
  const times = [...clubesIds];
  const numRodadas = numClubes - 1;
  const partidasPorRodada = Math.floor(numClubes / 2);

  for (let rodada = 1; rodada <= numRodadas; rodada++) {
    for (let i = 0; i < partidasPorRodada; i++) {
      const casa = times[i];
      const visitante = times[numClubes - 1 - i];
      
      partidas.push({
        competicaoId: 0, // será atualizado depois
        rodada,
        clubeCasaId: casa,
        clubeVisitanteId: visitante,
        jogada: false,
        createdAt: new Date()
      });
    }

    // Rotaciona os times (exceto o primeiro)
    const primeiro = times[0];
    const ultimo = times.pop()!;
    times.splice(1, 0, ultimo);
    times[0] = primeiro;
  }

  // Gera turno de volta (espelho invertido)
  const numRodadasIda = numRodadas;
  const partidasIda = partidas.length;
  for (let i = 0; i < partidasIda; i++) {
    const partidaIda = partidas[i];
    partidas.push({
      competicaoId: partidaIda.competicaoId,
      rodada: partidaIda.rodada + numRodadasIda,
      clubeCasaId: partidaIda.clubeVisitanteId,
      clubeVisitanteId: partidaIda.clubeCasaId,
      jogada: false,
      createdAt: new Date()
    });
  }

  return partidas;
}

export function gerarRodadasMataMata(clubesIds: number[]): Partida[] {
  const partidas: Partida[] = [];
  const numClubes = clubesIds.length;
  
  if (numClubes < 2 || numClubes % 2 !== 0) {
    return partidas; // Mata-mata precisa de número par de times
  }

  // Gera primeira fase (oitavas, quartas, etc)
  let rodada = 1;
  let timesRestantes = [...clubesIds];
  
  while (timesRestantes.length > 1) {
    const partidasRodada: Partida[] = [];
    
    for (let i = 0; i < timesRestantes.length; i += 2) {
      partidasRodada.push({
        competicaoId: 0,
        rodada,
        clubeCasaId: timesRestantes[i],
        clubeVisitanteId: timesRestantes[i + 1],
        jogada: false,
        createdAt: new Date()
      });
    }
    
    partidas.push(...partidasRodada);
    timesRestantes = []; // Será preenchido com os vencedores após as partidas
    rodada++;
  }

  return partidas;
}

export async function calcularClassificacao(
  competicaoId: number,
  clubesIds: number[]
): Promise<ClassificacaoItem[]> {
  const partidas = await db.partidas
    .where('competicaoId')
    .equals(competicaoId)
    .and(p => p.jogada === true)
    .toArray();

  const clubes = await db.clubes
    .where('id')
    .anyOf(clubesIds)
    .toArray();

  const classificacao: Map<number, ClassificacaoItem> = new Map();

  // Inicializa classificação
  clubesIds.forEach(clubeId => {
    const clube = clubes.find(c => c.id === clubeId);
    if (clube) {
      classificacao.set(clubeId, {
        clubeId,
        clube,
        pontos: 0,
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        golsPro: 0,
        golsContra: 0,
        saldoGols: 0
      });
    }
  });

  // Processa partidas
  partidas.forEach(partida => {
    if (partida.golsCasa === undefined || partida.golsVisitante === undefined) {
      return;
    }

    const casa = classificacao.get(partida.clubeCasaId);
    const visitante = classificacao.get(partida.clubeVisitanteId);

    if (!casa || !visitante) return;

    casa.jogos++;
    visitante.jogos++;
    casa.golsPro += partida.golsCasa;
    casa.golsContra += partida.golsVisitante;
    visitante.golsPro += partida.golsVisitante;
    visitante.golsContra += partida.golsCasa;

    if (partida.golsCasa > partida.golsVisitante) {
      casa.pontos += 3;
      casa.vitorias++;
      visitante.derrotas++;
    } else if (partida.golsCasa < partida.golsVisitante) {
      visitante.pontos += 3;
      visitante.vitorias++;
      casa.derrotas++;
    } else {
      casa.pontos += 1;
      visitante.pontos += 1;
      casa.empates++;
      visitante.empates++;
    }

    casa.saldoGols = casa.golsPro - casa.golsContra;
    visitante.saldoGols = visitante.golsPro - visitante.golsContra;
  });

  // Ordena classificação
  const resultado = Array.from(classificacao.values()).sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
    if (b.saldoGols !== a.saldoGols) return b.saldoGols - a.saldoGols;
    return b.golsPro - a.golsPro;
  });

  return resultado;
}

export interface FormaRecente {
  resultado: 'V' | 'E' | 'D';
  partida: Partida;
  adversario: Clube;
  foiCasa: boolean;
}

export async function calcularFormaRecente(
  clubeId: number,
  competicaoId: number,
  clubes: Clube[]
): Promise<FormaRecente[]> {
  const partidas = await db.partidas
    .where('competicaoId')
    .equals(competicaoId)
    .and(p => p.jogada === true)
    .and(p => (p.clubeCasaId === clubeId || p.clubeVisitanteId === clubeId))
    .toArray();

  // Ordena por rodada (mais recente primeiro)
  partidas.sort((a, b) => b.rodada - a.rodada);

  // Pega as últimas 5
  const ultimas5 = partidas.slice(0, 5);

  return ultimas5.map(partida => {
    const foiCasa = partida.clubeCasaId === clubeId;
    const adversarioId = foiCasa ? partida.clubeVisitanteId : partida.clubeCasaId;
    const adversario = clubes.find(c => c.id === adversarioId);

    let resultado: 'V' | 'E' | 'D';
    if (partida.golsCasa === undefined || partida.golsVisitante === undefined) {
      resultado = 'E'; // Fallback
    } else if (foiCasa) {
      if (partida.golsCasa > partida.golsVisitante) resultado = 'V';
      else if (partida.golsCasa < partida.golsVisitante) resultado = 'D';
      else resultado = 'E';
    } else {
      if (partida.golsVisitante > partida.golsCasa) resultado = 'V';
      else if (partida.golsVisitante < partida.golsCasa) resultado = 'D';
      else resultado = 'E';
    }

    return {
      resultado,
      partida,
      adversario: adversario || { id: adversarioId, nome: 'Desconhecido', forca: 0, pais: '', createdAt: new Date() },
      foiCasa
    };
  });
}

