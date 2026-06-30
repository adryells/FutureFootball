# Brasileirão Simulator — Guia Completo para Agentes de Código

## 1. Arquitetura Geral

**Stack**: React 18+ / TypeScript (ES2023) / Vite 8.x  
**Estado**: Context + useReducer (`GameContext`)  
**Armazenamento**: localStorage (principal) + IndexedDB (fallback e dados volumosos)  
**Estilização**: CSS global + CSS modules por componente, tema escuro via variáveis CSS

### Estrutura de Diretórios

```
src/
├── App.tsx                      # Entry point + modais globais
├── main.tsx                     # ReactDOM.createRoot
├── types/
│   └── index.ts                 # TODAS as interfaces/tipos do sistema
├── store/
│   └── GameContext.tsx           # Context + Reducer + Provider
├── hooks/
│   └── useGame.ts               # Hook (vazio, não utilizado)
├── data/
│   └── initialData.ts           # Times, cores, formações, nomes, prefs default
├── utils/
│   ├── gameLogic.ts             # Lógica principal (simulação, times, jogadores, premiações)
│   ├── storage.ts               # Persistência (localStorage + IndexedDB)
│   └── random.ts                # randomInt, randomChoice, poissonRandom
├── components/
│   ├── layout/
│   │   ├── Header.tsx           # Cabeçalho com ano e botão Config
│   │   └── Navigation.tsx       # Abas: Classificação, Rodadas, Estatísticas, Times, Histórico, Recordes
│   ├── common/
│   │   ├── ErrorBoundary.tsx    # Tratamento de erros React
│   │   ├── Notification.tsx     # Toast de notificação
│   │   └── TimeLogo.tsx         # Avatar do time (logo ou iniciais)
│   ├── tabs/
│   │   ├── ClassificacaoTab.tsx  # Tabela de classificação (A/B/C)
│   │   ├── RodadasTab.tsx        # Jogos da rodada + ações de simulação
│   │   ├── EstatisticasTab.tsx   # Artilharia e assistências da temporada
│   │   ├── TimesTab.tsx          # Detalhe do time (campo, jogadores, edição)
│   │   ├── HistoricoTab.tsx      # Temporadas passadas (memória + DB)
│   │   ├── RecordesTab.tsx       # Campeões, Bola de Ouro, Seleção, rankings
│   │   ├── SeriesTab.tsx         # Simulação standalone de B/C
│   │   └── rodadasHelpers.ts    # Funções auxiliares de simulação de jogos
│   └── modals/
│       ├── SimulacaoModal.tsx    # Simulação em lote (N temporadas)
│       ├── TemporadaResumoModal.tsx  # Resumo pós-temporada
│       ├── PlayerProfileModal.tsx # Perfil do jogador (carreira, premiações)
│       ├── TimeProfileModal.tsx   # Perfil do time (títulos, ídolos, história)
│       ├── SettingsModal.tsx      # Configurações (salvar, carregar, importar/exportar)
│       ├── SaveModal.tsx          # Modal de salvar
│       ├── LoadModal.tsx          # Modal de carregar
│       ├── ExportModal.tsx        # Modal de exportar
│       ├── ImportModal.tsx        # Modal de importar
│       ├── LogoModal.tsx          # Upload de logo
│       ├── TimePrefsModal.tsx     # Ajuste de força/relevância dos times
│       └── EditJogadorModal.tsx   # Editar jogador individual
└── styles/
    └── global.css                # Tema, reset, utilitários
```

## 2. Sistema de Tipos (types/index.ts)

### Tipos Centrais

```typescript
// Jogador: o coração do sistema
Jogador {
  id: number;                     // ID único (auto-incremento global)
  nome: string;                   // Nome completo
  posicao: Posicao;               // GOL | ZAG | LD | LE | VOL | MEI | ATA
  idade: number;                  // 15-50
  overall: number;                // 1-99 (rating geral)
  altura: string; peso: string;   // Formatos livres (ex: "1.80m", "78kg")
  gols: number;                   // Gols na temporada ATUAL
  assistencias: number;           // Assists na temporada ATUAL
  golsHistorico: number;          // Gols na carreira TODA
  assistenciasHistorico: number;  // Assists na carreira TODA
  anosAtivo: number;              // Anos desde que entrou no jogo
  partidas?: number;              // Partidas na temporada
  partidasHistorico?: number;     // Partidas na carreira
  somaNotas?: number;             // Soma de notas na temporada (para média)
  somaNotasHistorico?: number;    // Soma de notas na carreira
  aposentado?: boolean;           // Se true, não joga mais
  ultimaTemporada?: number;       // Último ano em que jogou
}

// Time
Time {
  timeId: number;                 // ID único
  nome: string;                   // Nome do time
  jogadores: Jogador[];           // Elenco atual
  formacao: string;               // Ex: "4-3-3", "4-4-2"
  forca: number;                  // Força calculada (média OVR)
  vitorias, empates, derrotas: number;
  golsPro, golsContra: number;
  pontos, jogos: number;
}

// Jogo
Jogo {
  casa: string;                   // Time casa
  fora: string;                   // Time fora
  resultado: { casa: number; fora: number } | null;  // null = não jogado
  golsInfo: GolInfo[];            // Detalhes de cada gol (para exibição)
}

GolInfo {
  type: 'gol';
  time: 'casa' | 'fora';
  jogador: string;                // Nome do jogador
  timeNome: string;               // Nome do time
  assistencia: string | null;     // Nome do assistente
  minuto: number;                 // Minuto do gol
}

// Estado de uma temporada completa
EstadoTemporada {
  times: Record<string, Time>;
  jogos: Jogo[][];                // jogos[rodada][jogo]
  rodadaAtual: number;
  concluido: boolean;
  _campeao?: string;              // Cache do campeão
  _vice?: string;
  _rebaixados?: string[];
  _bolaDeOuro?: BolaDeOuroResult;
  _selecao?: SelecaoTemporada;
}
```

### GameState (Estado Global do Jogo)

```typescript
GameState {
  year: number;                              // Ano atual
  state: EstadoTemporada | null;             // Estado da Série A atual
  championships: Record<string, EstadoTemporada>;  // Últimos ~100 anos em memória
  _championshipYears?: string[];             // Lista COMPLETA de anos (inclui DB)
  seriesB: string[];                         // Times na Série B
  seriesC: string[];                         // Times na Série C
  lastSeriesResults: LastSeriesResults | null;
  _campeoes: Record<number, CampeaoAno>;     // { ano: { campeao, vice, rebaixados } }
  _bolaDeOuroHistorico?: BolaDeOuroHistorico[];
  _selecoesHistorico?: SelecaoHistorico[];
  _todosJogadores?: Record<number, Jogador>; // Banco global de jogadores
  _timesConhecidos?: Record<string, Time>;   // Times de B/C preservados
  _jogadorHistoricoClubes?: JogadorHistoricoClube[];  // Histórico ano-a-ano
  _proximoTimeId?: number;
  _estadoB?: EstadoTemporada;                // Estado atual da Série B
  _estadoC?: EstadoTemporada;                // Estado atual da Série C
  _championshipsB?: Record<string, EstadoTemporada>;
  _championshipsC?: Record<string, EstadoTemporada>;
  _logoUrl?: string | null;
}
```

## 3. Fluxo de Dados (GameContext)

### AppState (Estado interno do Context/Reducer)

```typescript
AppState {
  game: GameState;              // Estado do jogo
  activeTab: TabId;             // Aba atual
  currentRodada: number;        // Rodada selecionada
  jogadoresSort: SortState;     // Ordenação da tabela de jogadores
  historicoAnoSelecionado: string | null;
  estatSubTab: EstatSubTab;     // artilharia | assistencias
  recordesMainTab: RecordesMainTab;
  recordesSubTab: RecordesSubTab;
  loading: boolean;
  notification: { message: string; type: 'success'|'error'|'info' } | null;
}
```

### Ações do Dispatch

| Ação                     | Descrição                           |
|--------------------------|-------------------------------------|
| `SET_GAME`               | Substitui game inteiro              |
| `UPDATE_GAME`            | Merge parcial em game               |
| `SET_ACTIVE_TAB`         | Muda a aba ativa                    |
| `SET_RODADA`             | Muda rodada atual                   |
| `SET_JOGADORES_SORT`     | Configura ordenação                 |
| `SET_HISTORICO_ANO`      | Ano selecionado no histórico        |
| `SET_ESTAT_SUBTAB`       | artilharia/assistencias             |
| `SET_RECORDES_MAIN_TAB`/`SET_RECORDES_SUB_TAB` | Sub-aba de recordes |
| `SET_LOADING`            | Estado de loading                   |
| `SET_NOTIFICATION`       | Toast                               |
| `UPDATE_STATE`           | Atualiza apenas `game.state`        |
| `NEXT_YEAR`              | Avança ano (substitui game + reseta rodada) |
| `SET_LOGO_URL`           | Logo personalizada                  |

### Funções Expostas pelo Context

| Função                          | Descrição                                      |
|---------------------------------|------------------------------------------------|
| `proximoAno()`                  | Avança temporada (salva antiga no DB)          |
| `simularRodadaAtual()`          | Simula 1 rodada                                |
| `simularTodas()`                | Simula TODAS as rodadas                        |
| `simularRestantesFn()`          | Simula rodadas restantes                       |
| `loadGame(nome)`                | Carrega save (localStorage -> DB)              |
| `saveGame(nome)`                | Salva jogo (localStorage, fallback DB)         |
| `showNotification(msg, type)`   | Exibe toast                                    |

## 4. Simulação de Temporada

### Ciclo Anual

```
1. Início: initGameState() -> cria times, jogadores, gera rodadas
2. Rodadas: simularRodada() / simularTodasRodadas() / simularRestantes()
3. Conclusão: quando todas as rodadas têm resultado
4. Fim da temporada:
   a. gerarPremiacoes() -> Bola de Ouro + Seleção
   b. iniciarNovoAno() -> 
      - Computa rebaixados/promovidos
      - Faz times envelhecerem (jogadores > 35 aposentam)
      - Gera novos jogadores para times fracos
      - Reorganiza séries
   c. Salva EstadoTemporada no IndexedDB (sem golsInfo)
   d. Avança year++
```

### Onde Cada Simulação Acontece

| Função                    | Arquivo            | Descrição                        |
|---------------------------|--------------------|----------------------------------|
| `simularPartida`          | gameLogic.ts       | 1 jogo (gols Poisson, golsInfo)  |
| `simularRodada`           | gameLogic.ts       | 1 rodada inteira                 |
| `simularTodasRodadas`     | gameLogic.ts       | Todas as rodadas                 |
| `simularSerieCompleta`    | gameLogic.ts       | Série B ou C completa            |
| `iniciarNovoAno`          | gameLogic.ts       | Transição entre temporadas       |
| `gerarPremiacoes`         | gameLogic.ts       | Bola de Ouro + Seleção           |
| `SimulacaoModal.handleSimular` | SimulacaoModal.tsx | Lote de N anos               |

### Regras de Rebaixamento/Promoção

- **Série A**: 4 últimos rebaixados → Série B
- **Série B**: 4 primeiros promovidos → Série A; 4 últimos rebaixados → Série C
- **Série C**: 4 primeiros promovidos → Série B

### Envelhecimento e Aposentadoria

- Todos os jogadores envelhecem 1 ano por temporada
- Jogadores com idade > 35: chance de aposentar (50% + 5% por ano acima de 35)
- Jogadores aposentados têm `aposentado: true` e são removidos do elenco
- Times que perdem muitos jogadores recebem novos jovens (overall baixo ~40-55)

## 5. Persistência (storage.ts)

### localStorage (rápido, síncrono)

- **Chaves**: `brsim_<nome>` para saves, `brsim_autosave` para autosave
- **Limite**: ~5MB (quando estoura, fallback para IndexedDB)
- **Uso**: Save atual, carregamento rápido

### IndexedDB (assíncrono, grande capacidade)

- **DB Name**: `BrasileiraoSimulator`
- **DB Version**: 2
- **Stores**:
  - `saves`: keyPath `key` — saves completos (`brsim_<nome>`)
  - `logos`: keyPath `timeNome` — logos de times
  - `championship_years`: keyPath `chave` — temporadas individuais

### Funções de Championship Years

```typescript
// Salvar 1 ano de uma série no DB
salvarAnoSimuladoDB(ano: number, serie: string, estado: unknown): Promise<boolean>
// Chave: "brsim_champ_A_2026"

// Carregar 1 ano do DB
carregarAnoSimuladoDB(ano: number, serie: string): Promise<unknown | null>

// Listar todos os anos disponíveis para uma série
listarAnosSimuladosDB(serie: string): Promise<number[]>

// Limpar todos os anos
removerAnosSimuladosDB(): Promise<void>

// Remover 1 ano específico
removerAnoSimuladoDB(ano: number, serie: string): Promise<boolean>

// Carregar TODOS os anos (memória + DB) para estatísticas globais
carregarEstatisticasGlobais(game: GameState): Promise<EstatisticasTemporada>
```

### Save/Load

| Função                       | Descrição                          |
|------------------------------|------------------------------------|
| `salvarSave(nome, game)`     | localStorage com fallback DB       |
| `carregarSave(nome)`         | localStorage apenas                |
| `carregarSaveDB(nome)`       | DB apenas                          |
| `salvarAutosave(game)`       | Autosave com debounce (2s)         |
| `carregarAutosave()`         | localStorage                       |
| `deletarSave(nome)`          | Ambos                              |
| `listarSavesCombinado()`     | Junta localStorage + DB            |
| `exportarSaveParaArquivo(nome, game)` | Download .json              |
| `importarSaveDoArquivo(file)`| Lê arquivo .json                   |
| `resetarJogo()`              | Limpa localStorage + DB            |
| `salvarLogoDB(timeNome, dataUrl)` | Logo em DB + localStorage    |

## 6. Otimização de Memória (IndexedDB para Histórico)

### Problema Original

Após centenas de temporadas simuladas, `JSON.parse(JSON.stringify(state.game))` falhava com `RangeError: Invalid string length` porque `championships` acumulava TODOS os `EstadoTemporada` completos (com times, jogadores, partidas, golsInfo).

### Solução Implementada

1. **Salvamento individual por ano**: cada ano é salvo no IndexedDB via `salvarAnoSimuladoDB()`, com `golsInfo` removido para economizar espaço (~90% de redução)
2. **Cache LRU em memória**: apenas os últimos 100 anos (`MAX_CACHED_YEARS = 100`) são mantidos em `game.championships`
3. **`_championshipYears`**: array completo de anos disponíveis (inclui DB), sem os dados
4. **`cloneGameForSimulation()`**: em vez de `JSON.parse(JSON.stringify())`, faz shallow copy dos campos históricos
5. **Carregamento sob demanda**: componentes que precisam de anos antigos carregam do DB assincronamente

### Onde os Dados São Salvos

| Localização                                    | Quando                                      | Quem |
|------------------------------------------------|---------------------------------------------|------|
| `GameContext.proximoAno()`                     | Fim de cada temporada manual                | Salva A, B, C |
| `SimulacaoModal.handleSimular()`               | A cada iteração em lote                     | Salva A e B |
| `HistoricoTab` useEffect                       | Ao selecionar ano não em memória            | Carrega do DB |
| `PlayerProfileModal` useEffect                 | Modo sem ID, anos faltando                  | Carrega do DB |
| `TimeProfileModal` useEffect                   | Anos faltando em memória                    | Carrega do DB |
| `RecordesTab` `carregarEstatisticasGlobais()`  | Ao abrir artilharia/assistências gerais     | Carrega todos |

### Limitações Conhecidas

- **Série C não é salva na SimulacaoModal** (porque `resultadoC` não tem `_estado`)
- **PlayerProfileModal com ID**: não carrega do DB (usa só `jogadorHistoricoClubes`)
- **Save migration**: saves existentes com `championships` cheio em localStorage não são migrados automaticamente para IndexedDB

## 7. Componentes Principais

### App.tsx (Entry Point)

- Renderiza `GameProvider` > `AppContent`
- `AppContent` gerencia modais globais (PlayerProfile, TimeProfile)
- Escuta eventos `open-player-profile` e `open-time-profile` via window

### Navigation.tsx

6 abas: Classificação, Rodadas, Estatísticas, Times, Histórico, Recordes  
Usa `state.activeTab` do Context

### ClassificacaoTab.tsx

- Seletor de série (A/B/C)
- Tabela com posição, time, pontos, jogos, V/E/D, GP/GC/SG
- Cores por zona (libertadores, pré-libertadores, sul-americana, rebaixamento)
- Série A: últimos 5 resultados (V/E/D)
- Série B/C: usa `_estadoB` / `_estadoC` do GameState

### RodadasTab.tsx

- Navegação entre rodadas
- Cada jogo: placar, golsInfo, médias dos jogadores
- Ações: simular 1 rodada, todas, restantes
- Botão "Modo Simulação" → abre SimulacaoModal
- Ao concluir temporada, abre TemporadaResumoModal antes de avançar

### EstatisticasTab.tsx

- Sub-abas: Artilharia / Assistências (temporada atual)
- Top 20

### TimesTab.tsx

- Seletor de time
- Exibe: informações, campo (formação), tabela de jogadores
- Ordenação por qualquer coluna
- Clique no nome/idade/overall → EditJogadorModal

### HistoricoTab.tsx

- Seletor de ano (combina memória + DB)
- Carrega do DB se não estiver em memória (loading state)
- Exibe: campeão, classificação final, destaques (artilheiro, assistências)

### RecordesTab.tsx

5 sub-abas principais:
- **Campeões**: Históricos (1937-2025) / Simulados (2026+) / Ranking Títulos
- **Bola de Ouro**: Histórico / Ranking BDO / GOAT Index
- **Seleção da Temporada**: Histórico
- **Artilharia Geral**: Todos os gols de todos os anos (async DB)
- **Assistências Gerais**: Todas as assistências (async DB)

### SimulacaoModal.tsx

- Input de quantidade (1-5000), presets
- Usa `cloneGameForSimulation()` em vez de `JSON.parse(JSON.stringify())`
- Loop assíncrono com `await new Promise(r => setTimeout(r, 0))` para permitir cancelamento e atualização de UI
- Cada iteração: simula rodadas, premiações, salva no DB, avança ano
- Mantém cache LRU de 100 anos em memória
- Barra de progresso com campeão atual e ano
- Botão de cancelar

### PlayerProfileModal.tsx

**Dois modos de busca**:
1. **Com ID** (`jogadorId !== undefined`): usa `jogadorHistoricoClubes` para temporadas, `championships` apenas para idade
2. **Sem ID** (fallback por nome): varre `championships` em memória + carrega do DB assincronamente

Exibe:
- Avatar (posição), nome, time atual, OVR, idade
- Totais de carreira (gols, assists, partidas)
- Premiações (Bola de Ouro, Seleção)
- Histórico por temporada (ano, time, gols, assists, média, OVR, título)

### TimeProfileModal.tsx

- Cabeçalho: nome, série, força, títulos
- Estatísticas: vitórias, empates, derrotas, gols, assists
- Títulos
- Time atual no campo (formação visual)
- Histórico na Série A (ano, posição, título)
- Ídolos (top 15 jogadores por gols)
- Carrega dados do DB para anos não em memória

## 8. Dados Iniciais (initialData.ts)

### Times

- **Série A**: 20 times (Athletico-PR a Vitória)
- **Série B**: 20 times (América-MG a Vila Nova)
- **Série C**: 20 times (Amazonas a Ypiranga)

### Cores dos Times

`TIME_COLORS: Record<string, [string, string]>` — cor principal e secundária  
`getTimeColors(nome)` resolve por nome ou alias

### Formações

Disponíveis: 4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 4-5-1, 5-3-2, 4-3-2-1

### Preferências Default

`DEFAULT_TIME_PREFS` — força geral (40-99) e relevância (1-5) por time  
Flamengo/Palmeiras: força 86-88, relevância 5  
Times pequenos: força 57-65, relevância 1

### Campeões Históricos

1937-2025 (89 registros, incluindo múltiplos campeões em 1967-1968)

## 9. Arquivos CSS

| Arquivo                  | Componente            |
|--------------------------|-----------------------|
| global.css               | Reset, tema, tabelas, botões, modais, responsivo |
| Navigation.css           | NavBar                |
| ClassificacaoTab.css     | Classificação         |
| RodadasTab.css           | JogoCard e layout     |
| EstatisticasTab.css      | Estatísticas          |
| TimesTab.css             | Time detail, campo    |
| HistoricoTab.css         | Histórico             |
| RecordesTab.css          | Recordes              |
| SettingsModal.css        | Configurações         |
| TimePrefsModal.css       | Preferências de força |
| SimulacaoModal.css       | Simulação lote        |
| TemporadaResumoModal.css | Resumo temporada      |
| PlayerProfileModal.css   | Perfil jogador        |
| TimeProfileModal.css     | Perfil time           |

## 10. Eventos Globais (window)

```typescript
// Abrir perfil do jogador (de qualquer componente)
window.dispatchEvent(new CustomEvent('open-player-profile', {
  detail: { nome: string, id?: number }
}));

// Abrir perfil do time
window.dispatchEvent(new CustomEvent('open-time-profile', {
  detail: { nome: string, id?: number }
}));
```

App.tsx escuta ambos e renderiza os modais correspondentes.

## 11. Guia Rápido para Modificações

### Adicionar um Novo Tipo

1. Declarar em `src/types/index.ts`
2. Se fizer parte do GameState, adicionar à interface
3. Se precisar de persistência, adicionar ao save/load

### Adicionar uma Nova Aba

1. Adicionar ao enum `TabId` em types
2. Adicionar ao array `TABS` em Navigation.tsx
3. Criar componente em `components/tabs/`
4. Adicionar ao switch em App.tsx

### Adicionar um Novo Modal

1. Criar componente em `components/modals/`
2. Se for global, adicionar estado + render em App.tsx
3. Se for local, gerenciar no componente pai

### Modificar a Simulação

1. Lógica principal em `gameLogic.ts` (funções puras, operam em mutação)
2. Orquestração em `GameContext.tsx` (proximoAno, simularRodadaAtual)
3. Simulação em lote em `SimulacaoModal.tsx`

### Ajustar Persistência

1. `storage.ts` para funções de salvar/carregar
2. `GameContext.tsx` para autosave (debounce 2s)
3. Dados históricos: `salvarAnoSimuladoDB` / `carregarAnoSimuladoDB`
