export type Posicao = 'GOL' | 'ZAG' | 'LD' | 'LE' | 'VOL' | 'MEI' | 'ATA';
export type TimeLado = 'casa' | 'fora';
export type TabId = 'classificacao' | 'rodadas' | 'estatisticas' | 'times' | 'historico' | 'recordes';
export type EstatSubTab = 'artilharia' | 'assistencias';
export type RecordesMainTab = 'campeoes' | 'bolaDeOuro' | 'selecaoAno' | 'artilhariaGeral' | 'assistenciasGeral';
export type RecordesSubTab = 'historicos' | 'simulados' | 'ranking';
export type SortColumn = 'num' | 'nome' | 'posicao' | 'idade' | 'overall' | 'altura' | 'peso' | 'gols' | 'assistencias' | 'golsHist' | 'assistsHist' | 'partidas' | 'media' | 'mediaCarreira';

export interface TimePrefs {
  forcaGeral: number;
  relevancia: number;
}

export interface PrefsPorSerie {
  A: Record<string, TimePrefs>;
  B: Record<string, TimePrefs>;
  C: Record<string, TimePrefs>;
}

let _nextJogadorId = 1;
export function gerarIdJogador(): number {
  return _nextJogadorId++;
}
export function resetarIdJogador(): void {
  _nextJogadorId = 1;
}

export interface Jogador {
  id: number;
  nome: string;
  posicao: Posicao;
  idade: number;
  overall: number;
  altura: string;
  peso: string;
  gols: number;
  assistencias: number;
  golsHistorico: number;
  assistenciasHistorico: number;
  anosAtivo: number;
  /** Partidas jogadas na temporada */
  partidas?: number;
  /** Partidas jogadas na carreira */
  partidasHistorico?: number;
  /** Soma de notas na temporada (para cálculo da média) */
  somaNotas?: number;
  /** Soma de notas na carreira */
  somaNotasHistorico?: number;
  /** Se verdadeiro, jogador está aposentado e não joga mais */
  aposentado?: boolean;
  /** Última temporada em que jogou (para referência histórica) */
  ultimaTemporada?: number;
}

export interface Time {
  timeId: number;
  nome: string;
  jogadores: Jogador[];
  formacao: string;
  forca: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  pontos: number;
  jogos: number;
}

export interface GolInfo {
  type: 'gol';
  time: TimeLado;
  jogador: string;
  timeNome: string;
  assistencia: string | null;
  minuto: number;
}

export interface Jogo {
  casa: string;
  fora: string;
  resultado: { casa: number; fora: number } | null;
  golsInfo: GolInfo[];
}

export interface EstadoTemporada {
  times: Record<string, Time>;
  jogos: Jogo[][];
  rodadaAtual: number;
  concluido: boolean;
  _campeao?: string;
  _vice?: string;
  _rebaixados?: string[];
  _concluido?: boolean;
  _bolaDeOuro?: BolaDeOuroResult;
  _selecao?: SelecaoTemporada;
}

export interface ResultadoSerie {
  classificacao: { nome: string; pontos: number; vitorias: number; jogos: number }[];
  promovidos: string[];
  rebaixados: string[];
  /** Estado completo da temporada simulada (times com jogadores, jogos, golsInfo) */
  _estado?: EstadoTemporada;
}

export interface CampeaoAno {
  campeao: string;
  vice: string;
  rebaixados: string[];
}

export interface GameState {
  year: number;
  state: EstadoTemporada | null;
  championships: Record<string, EstadoTemporada>;
  seriesB: string[];
  seriesC: string[];
  lastSeriesResults: LastSeriesResults | null;
  _campeoes: Record<number, CampeaoAno>;
  _savedAt?: string;
  _bolaDeOuroHistorico?: BolaDeOuroHistorico[];
  _selecoesHistorico?: SelecaoHistorico[];
  /** Banco global de todos os jogadores que já existiram, key = id */
  _todosJogadores?: Record<number, Jogador>;
  /** Times conhecidos fora da Série A (B e C), preservados com seus jogadores entre temporadas */
  _timesConhecidos?: Record<string, Time>;
  /** Histórico de clubes por jogador (ano a ano) */
  _jogadorHistoricoClubes?: JogadorHistoricoClube[];
  /** Próximo ID para times (auto-incremento) */
  _proximoTimeId?: number;
  _logoUrl?: string | null;
  /** Estado completo da Série B (times, jogos, resultados) */
  _estadoB?: EstadoTemporada;
  /** Estado completo da Série C (times, jogos, resultados) */
  _estadoC?: EstadoTemporada;
  /** Histórico de temporadas da Série B (ano -> EstadoTemporada) */
  _championshipsB?: Record<string, EstadoTemporada>;
  /** Histórico de temporadas da Série C (ano -> EstadoTemporada) */
  _championshipsC?: Record<string, EstadoTemporada>;
}

/** Registro de um jogador em um clube em uma temporada */
export interface JogadorHistoricoClube {
  jogadorId: number;
  jogadorNome: string;
  ano: number;
  time: string;
  gols: number;
  assistencias: number;
  partidas: number;
  media: number;
  overall: number;
}

export interface EstatisticasTemporada {
  artilheiros: { nome: string; time: string; gols: number; golsHistorico: number; id?: number }[];
  assistencias: { nome: string; time: string; assists: number; assistsHistorico: number; id?: number }[];
}

export interface SaveInfo {
  key: string;
  nome: string;
  data: string;
  ano: number | string;
  times: number;
  concluido: boolean;
  erro?: boolean;
  origemDB?: boolean;
}

export interface FormacaoInfo {
  nome: string;
  posicoes: Posicao[];
}

export interface SortState {
  col: SortColumn;
  asc: boolean;
}

export interface CampeaoHistorico {
  ano: number;
  campeao: string;
  vice: string;
  terceiro: string;
}

export interface LastSeriesResults {
  B: ResultadoSerie;
  C: { promovidos: string[]; classificacao: { nome: string; pontos: number; vitorias: number; jogos: number }[] };
  rebaixadosA: string[];
  promovidosB: string[];
  rebaixadosB?: string[];
}

// === Media / Nota dos jogadores ===
export interface MediaJogador {
  /** Média geral na carreira (todas temporadas) */
  carreira: number;
  /** Média por partida na carreira */
  porPartida: number;
  /** Média na temporada atual */
  temporada: number;
}

// === Bola de Ouro ===
export interface BolaDeOuroEntry {
  jogador: string;
  id?: number;
  time: string;
  posicao: Posicao;
  nota: number;
  gols: number;
  assistencias: number;
}

export interface BolaDeOuroResult {
  ouro: BolaDeOuroEntry;
  prata: BolaDeOuroEntry;
  bronze: BolaDeOuroEntry;
}

// === Seleção da Temporada ===
export interface SelecaoEntry {
  jogador: string;
  id?: number;
  time: string;
  posicao: Posicao;
  nota: number;
}

export interface SelecaoTemporada {
  goleiro: SelecaoEntry;
  laterais: SelecaoEntry[];
  zag: SelecaoEntry[];
  volantes: SelecaoEntry[];
  meias: SelecaoEntry[];
  atacantes: SelecaoEntry[];
}

// === Histórico de premiações ===
export interface BolaDeOuroHistorico {
  ano: number;
  ouro: BolaDeOuroEntry;
  prata: BolaDeOuroEntry;
  bronze: BolaDeOuroEntry;
}

export interface SelecaoHistorico {
  ano: number;
  selecao: SelecaoTemporada;
}

// === Rankings de Bola de Ouro ===
export interface BdoRankingEntry {
  jogador: string;
  id?: number;
  ouros: number;
  pratas: number;
  bronzes: number;
  totalPremios: number;
}

export interface GoatRankingEntry extends BdoRankingEntry {
  goatIndex: number;
  mediaHistorica: number;
  gols: number;
  assistencias: number;
  titulos: number;
  aparicoesSelecao: number;
}
