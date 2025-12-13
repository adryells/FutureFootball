export interface Clube {
  id?: number;
  nome: string;
  logo?: string;
  forca: number;
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
  nome: string;
  ano: number;
  ordem: number;
  finalizada: boolean;
  createdAt: Date;
}

export interface Competicao {
  id?: number;
  temporadaId: number;
  nome: string;
  tipo: 'pontos-corridos' | 'mata-mata';
  status: 'configurando' | 'pronta' | 'em-andamento' | 'finalizada';
  clubesIds: number[];
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

export interface ClassificacaoItem {
  clubeId: number;
  clube: Clube;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  saldoGols: number;
}

