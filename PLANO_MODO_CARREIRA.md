# Plano de Expansão: Modo Carreira / Manager — Arquitetura Flexível

> **Objetivo:** Transformar o "Brasileirão Simulator" (simulação fixa de 3 divisões)
> em um **Football Manager lite / Brassfoot-like**, onde o usuário controla UM time
> em ligas/campeonatos configuráveis, com mercado de transferências, táticas,
> e gerenciamento ativo entre partidas.

---

## 1. Filosofia da Arquitetura

### Princípios
1. **Campeonatos como dados, não como código** — definir ligas, divisões, times fora do core engine
2. **Save-first design** — toda configuração é parte do save, não do código
3. **User-controlled team** — o jogador escolhe um time para controlar; o resto é CPU
4. **Plugin-ready data** — estrutura que permite patches da comunidade (importar campeonatos JSON)
5. **Migração progressiva** — compatibilidade com saves existentes

### Estrutura de Diretórios Alvo
```
src/
├── core/                    # Motor de simulação puro (sem UI)
│   ├── engine.ts            # loop principal: simular dia/rodada/temporada
│   ├── match.ts             # simular partida individual
│   ├── season.ts            # progressão de temporada, envelhecimento
│   ├── transfers.ts         # lógica de transferências / mercado
│   └── playerGen.ts         # geração de novos jogadores (base, regen)
│
├── data/
│   ├── default/             # dados padrão inclusos no jogo
│   │   ├── brasileirao.ts   # configuração das 3 divisões (como hoje)
│   │   └── generic.ts       # times genéricos para outras ligas
│   ├── competitions.ts      # schema de definição de competições
│   └── import.ts            # importação de patches/JSON
│
├── store/
│   └── GameContext.tsx       # REFATORADO - estado genérico
│
├── types/
│   └── index.ts             # EXPANDIDO - tipos genéricos
│
├── components/
│   ├── manager/             # NOVOS componentes do modo carreira
│   │   ├── ManagerDashboard.tsx
│   │   ├── TacticsPanel.tsx
│   │   ├── TransferMarket.tsx
│   │   ├── SquadList.tsx
│   │   └── ContractPanel.tsx
│   └── ... (demais componentes adaptados)
│
├── setup/                   # NOVO - wizard de criação de save
│   ├── NewGameWizard.tsx    # assistente de novo jogo
│   ├── CompetitionSelector.tsx
│   ├── TeamSelector.tsx
│   └── ManagerConfig.tsx
```

---

## 2. Schema de Competições (NOVO)

### Definição de uma competição (JSON/TypeScript)
```typescript
interface Competition {
  id: string;                    // "br-serie-a", "eng-premier", "copa-br"
  name: string;                  // "Campeonato Brasileiro Série A"
  shortName: string;             // "Série A"
  country: string;               // "Brasil"
  type: 'league' | 'cup' | 'playoff';
  
  // Hierarquia (para rebaixamento/promoção)
  tier: number;                  // 1 = primeira divisão
  parentCompetition?: string;    // id da competição acima
  childCompetition?: string;     // id da competição abaixo
  
  // Formato
  numberOfTeams: number;
  rounds: 'single' | 'double' | number;  // turno/returno ou número fixo
  pointsSystem: { win: 3; draw: 1; loss: 0 };
  
  // Critérios de desempate
  tiebreakers: ('points' | 'wins' | 'goalDiff' | 'goalsFor' | 'headToHead')[];
  
  // Vagas para outras competições
  qualifications?: {
    competitionId: string;
    positions: number[];       // ex: [1,2,3,4] = libertadores
    name: string;              // "Libertadores"
  }[];
  
  // Rebaixamento
  relegation?: {
    toCompetition: string;
    positions: number[];       // ex: [17,18,19,20] = últimas 4
  };
  
  // Times participantes (default)
  defaultTeams?: string[];     // nomes padrão dos times
}
```

### Exemplo: Configuração do Brasileirão como Competição
```typescript
const BRASILEIRAO_2026: CompetitionConfig = {
  id: "br-serie-a",
  name: "Campeonato Brasileiro Série A",
  country: "Brasil",
  tier: 1,
  type: "league",
  numberOfTeams: 20,
  rounds: "double",
  relegation: { toCompetition: "br-serie-b", positions: [17,18,19,20] },
  qualifications: [
    { competitionId: "copa-libertadores", positions: [1,2,3,4], name: "Libertadores" },
    { competitionId: "copa-sulamericana", positions: [5,6,7,8,9,10,11,12], name: "Sul-Americana" }
  ],
  defaultTeams: SERIES_DATA.A  // do initialData.ts
};
```

---

## 3. Estado Global REFATORADO (GameState v2)

### Principais mudanças
```typescript
interface GameState {
  // Metadados
  version: string;               // "2.0" — para migração
  saveName: string;
  createdAt: string;
  
  // Configuração do jogo (escolhida na criação)
  setup: GameSetup;
  
  // Time do usuário
  userTeamId: number;
  
  // Calendário global
  calendar: Calendar;
  currentDate: GameDate;         // { day, month, year }
  
  // Competições ativas
  competitions: Record<string, CompetitionState>;
  // Ex: { "br-serie-a": { ... }, "br-serie-b": { ... }, "copa-br": { ... } }
  
  // Jogadores (banco global)
  allPlayers: Record<number, Player>;
  playerHistory: PlayerClubHistory[];
  
  // Times (banco global)
  allTeams: Record<number, Team>;
  knownTeams: Record<string, Team>;  // times conhecidos (similar _timesConhecidos)
  
  // Mercado de transferências
  transferMarket: TransferMarketState;
  
  // Histórico de premiações (já existente)
  bolaDeOuroHistory: BolaDeOuroHistory[];
  selecaoHistory: SelecaoHistory[];
  championships: Record<string, SeasonState>;
  
  // Temporada atual (usando o mesmo EstadoTemporada, mas genérico)
  currentSeason: SeasonState | null;
  
  // Preferências (já existente)
  prefs: PrefsPorSerie;
  
  // UI
  logoUrl?: string;
}
```

### GameSetup (configuração escolhida pelo usuário)
```typescript
interface GameSetup {
  mode: 'sandbox' | 'manager' | 'full-sim';
  
  // Ligas ativas no jogo
  activeCompetitions: {
    competitionId: string;
    teams: string[];             // times participantes (pode ser editado)
  }[];
  
  // Time do jogador (modo manager)
  userTeam?: {
    teamName: string;
    competitionId: string;       // em qual competição o time começa
  };
  
  // Configurações globais
  settings: {
    agingEnabled: boolean;
    transfersEnabled: boolean;
    injuriesEnabled: boolean;
    youthAcademy: boolean;
    financialModule: boolean;
  };
}
```

---

## 4. Arquitetura das Telas (UI)

### Novo fluxo de navegação
```
[New Game Wizard] ─> [Manager Dashboard] ─> [Jogos/Calendário]
                        │                         │
                        ├─ Táticas                ├─ Pré-Jogo
                        ├─ Elenco                ├─ Ao Vivo (futuro)
                        ├─ Transferências        └─ Pós-Jogo
                        ├─ Competições
                        ├─ Estatísticas
                        └─ Histórico
```

### TabId expandido
```typescript
type TabId = 
  // Existentes (adaptados)
  | 'dashboard'        // Manager Dashboard (NOVO, substitui 'classificacao' como padrão)
  | 'classificacao'    // Tabela da competição selecionada
  | 'rodadas'          // Calendário / Jogos
  | 'estatisticas'
  | 'elenco'           // Squad (substitui 'times')
  | 'historico'
  | 'recordes'
  // NOVOS
  | 'taticas'          // Formação, instruções, strategy
  | 'transferencias'   // Mercado de transferências
  | 'contratos'        // Gerenciamento de contratos
  | 'financeiro';      // Finanças (futuro)
```

---

## 5. Plano de Implementação (Fases)

### FASE 0 — Fundação (1-2 semanas)
1. **Criar schema CompetitionConfig** e refatorar initialData.ts
2. **Refatorar GameState** para ser genérico (compatibilidade retroativa)
3. **Criar o NewGameWizard** (assistente de criação de save)
4. **Adaptar engine** para ler competições de configuração em vez de hardcoded

### FASE 1 — Modo Carreira Básico (2-3 semanas)
1. **Manager Dashboard** — visão geral do time do jogador
2. **TacticsPanel** — escolher formação, escalação (11 titulares)
3. **Controle de partida** — assistir/gerenciar jogos do seu time
4. **SquadList** com atributos detalhados

### FASE 2 — Mercado & Jogadores (2-3 semanas)
1. **TransferMarket** — comprar/vender/emprestar jogadores
2. **Contratos** — salários, duração, renovação
3. **Geração de novos jogadores** (regen/youth academy)
4. **Evolução/Declínio** de atributos por idade

### FASE 3 — Internacional & Patchs (2-4 semanas)
1. **Competições continentais** (Libertadores, Champions League)
2. **Copas nacionais** (Copa do Brasil, FA Cup)
3. **Importador JSON** para patches da comunidade
4. **Editor de times/competições** in-game

### FASE 4 — Profundidade (3-6 semanas)
1. **Módulo financeiro** — orçamento, salários, premiações
2. **Lesões** — probabilidade, duração, impacto
3. **Notícias** — sistema de mídia/scouting
4. **Match engine 3D/texto** — comentários da partida
5. **Multi-save** — gerenciar múltiplas carreiras

---

## 6. Adaptação dos Componentes Existentes

| Componente | Mudança Necessária |
|---|---|
| `ClassificacaoTab` | Ler competição ativa do setup; mostrar tabela da competição selecionada |
| `RodadasTab` | Mostrar calendário do **time do jogador** destacado; opção de simular vs assistir |
| `TimesTab` → `SquadPanel` | Mostrar apenas o elenco do time do jogador + times adversários |
| `TimesTab` (time adversário) | Manter TimeProfileModal para qualquer time |
| `HistoricoTab` | Mostrar histórico da competição selecionada + achievements do jogador |
| `RecordesTab` | Manter como está, adicionar recordes por competição |
| `SimulacaoModal` | Adaptar para simular múltiplas competições simultaneamente |
| `PlayerProfileModal` | Já está bem genérico — poucas mudanças |
| `TimeProfileModal` | Já está bem genérico — poucas mudanças |
| `TimePrefsModal` | Substituir ou adaptar para o novo sistema de configuração |

---

## 7. Schema de Importação (Patches da Comunidade)

### Formato JSON para pacotes de dados
```json
{
  "package": {
    "name": "Brasileirão 2026",
    "author": "Comunidade",
    "version": "1.0",
    "description": "Dados atualizados do Campeonato Brasileiro 2026"
  },
  "competitions": [
    {
      "id": "br-serie-a",
      "name": "Campeonato Brasileiro Série A",
      "tier": 1,
      "type": "league",
      "numberOfTeams": 20,
      "defaultTeams": ["Palmeiras", "Flamengo", ...]
    }
  ],
  "teams": [
    {
      "name": "Palmeiras",
      "shortName": "PAL",
      "colors": ["#006635", "#ffffff"],
      "stadium": "Allianz Parque",
      "city": "São Paulo",
      "rivalries": ["Corinthians", "São Paulo", "Santos"],
      "defaultStrength": 88
    }
  ],
  "players": [
    {
      "name": "Raphael Veiga",
      "position": "MEI",
      "age": 29,
      "overall": 84,
      "team": "Palmeiras",
      "height": "184cm",
      "weight": "78kg"
    }
  ]
}
```

---

## 8. Prioridades Imediatas (Próximos Passos)

### O que fazer AGORA:
1. ✅ **Já analisado** — código mapeado, entendimento completo
2. ⬜ **Definir schema CompetitionConfig** — a base de tudo
3. ⬜ **Criar o assistente de Novo Jogo** — UI de seleção
4. ⬜ **Refatorar initGameState()** — aceitar configuração genérica
5. ⬜ **Criar ManagerDashboard** — tela principal do modo carreira

### O que NÃO fazer (ainda):
- ❌ Não refatorar tudo de uma vez — compatibilidade com saves existentes
- ❌ Não mexer no match engine (já funciona bem)
- ❌ Não adicionar finanças/lesões até o básico funcionar

---

## 9. Diagrama de Fluxo de Dados

```
[NewGameWizard] ──> GameSetup ──> initGameState(setup)
                                      │
                                      ▼
                              GameState (v2)
                           ┌─────────────────┐
                           │ setup            │
                           │ allPlayers       │
                           │ allTeams         │
                           │ competitions     │
                           │ userTeamId       │
                           │ currentSeason    │
                           └─────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
            [Engine]       [UI Manager]   [Storage]
            simula         exibe dados    salva/carrega
            partidas       do time do     dados no
            temporadas     jogador        IndexedDB
```

---

## 10. Estratégia de Compatibilidade

### Saves antigos (v1.x → v2)
1. Detectar `version` no GameState
2. Se ausente ou "1.x", rodar migrador:
   - `setup.mode = 'sandbox'`
   - `setup.activeCompetitions = [{ br-serie-a, br-serie-b, br-serie-c }]`
   - `userTeamId = null` (modo sandbox — sem time controlado)
3. Manter todos os outros campos intactos

### Estrutura de código
- Manter `gameLogic.ts` intacta (as funções de simulação)
- Criar `core/engine.ts` como wrapper que orquestra múltiplas competições
- Adaptar `GameContext.tsx` para ler `setup` e rotear para as competições corretas

---

## 11. Conclusão

Este plano transforma o Brasileirão Simulator de uma simulação fixa de 3 divisões
em uma plataforma flexível que suporta:

✅ **Múltiplas ligas/competições** configuráveis
✅ **Modo carreira** (controlar um time)
✅ **Mercado de transferências**
✅ **Táticas e escalação**
✅ **Patches da comunidade** (importar dados)
✅ **Compatibilidade retroativa** com saves existentes

A prioridade #1 é o **schema de competições** e o **assistente de novo jogo**,
pois são a fundação de tudo. O resto pode ser construído incrementalmente.
