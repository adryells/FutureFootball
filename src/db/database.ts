import Dexie, { Table } from 'dexie';

export interface Clube {
  id?: number;
  nome: string;
  logo?: string; // base64 ou URL
  forca: number; // 0-100
  pais: string;
  createdAt: Date;
}

export interface Universo {
  id?: number;
  nome: string;
  descricao?: string;
  createdAt: Date;
}

export interface Temporada {
  id?: number;
  universoId: number;
  nome: string; // ex: "2025", "Temporada 2025"
  ano: number;
  ordem: number; // para ordenação cronológica
  finalizada: boolean;
  createdAt: Date;
}

export interface EstruturaDivisao {
  id?: number;
  universoId: number;
  nome: string; // Ex: "Série A", "Série B"
  ordem: number; // Ordem hierárquica (1 = primeira divisão, 2 = segunda, etc)
  quantidadeTimes: number; // Quantidade total de times
  quantidadePromovidos: number; // Quantos times sobem
  quantidadeRebaixados: number; // Quantos times descem
  divisaoSuperiorId?: number; // ID da divisão superior (para onde vão os promovidos)
  divisaoInferiorId?: number; // ID da divisão inferior (para onde vão os rebaixados)
  cor: string; // Cor para identificação visual
  createdAt: Date;
}

export interface SecaoCompeticao {
  id?: number;
  competicaoId: number;
  nome: string;
  posicaoInicial: number; // Posição inicial na classificação (1-based)
  posicaoFinal: number; // Posição final na classificação (1-based)
  cor: string; // Cor em hex
  qualificatoria: boolean; // true = qualificatória, false = rebaixatória
  competicaoDestinoId?: number; // ID da competição de destino (se qualificatória)
  temporadaDestinoId?: number; // ID da temporada de destino (se qualificatória)
  mesmoAno: boolean; // Se a competição de destino é no mesmo ano
  createdAt: Date;
}

export interface Competicao {
  id?: number;
  temporadaId: number;
  nome: string;
  tipo: 'pontos-corridos' | 'mata-mata';
  status: 'configurando' | 'pronta' | 'em-andamento' | 'finalizada';
  clubesIds: number[]; // IDs dos clubes participantes
  rodadasGeradas: boolean;
  createdAt: Date;
}

export interface Partida {
  id?: number;
  competicaoId: number;
  rodada: number;
  clubeCasaId: number;
  clubeVisitanteId: number;
  golsCasa?: number;
  golsVisitante?: number;
  jogada: boolean;
  createdAt: Date;
}

export class FootballFutureDB extends Dexie {
  clubes!: Table<Clube, number>;
  universos!: Table<Universo, number>;
  temporadas!: Table<Temporada, number>;
  competicoes!: Table<Competicao, number>;
  partidas!: Table<Partida, number>;
  secoes!: Table<SecaoCompeticao, number>;
  estruturasDivisao!: Table<EstruturaDivisao, number>;

  constructor() {
    super('FootballFutureDB');
    this.version(3).stores({
      clubes: '++id, nome, pais',
      universos: '++id, nome',
      temporadas: '++id, universoId, ordem',
      competicoes: '++id, temporadaId, status',
      partidas: '++id, competicaoId, rodada, jogada',
      secoes: '++id, competicaoId',
      estruturasDivisao: '++id, universoId, ordem'
    });
  }
}

export const db = new FootballFutureDB();

