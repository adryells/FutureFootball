# ⚽ BR Sim React — Ideias de Melhorias e Features

> Sugestões organizadas por esforço de implementação e impacto no jogo.
>
> **Total: ~80+ ideias** — desde micro-melhorias até features complexas.

---

## 🎯 CURTO PRAZO (fáceis de implementar, 1-2 horas cada)

### 1. Mercado de Transferências
- Janela entre temporadas onde times contratam/vendem jogadores
- Jogadores com contratos expirando podem trocar de time
- Times maiores "roubam" jogadores de times menores (mais realista)
- **Impacto:** Dá profundidade estratégica e imprevisibilidade

### 2. Sorteio de Grupos para Séries
- Atualmente a Série C tem só turno único (19 rodadas)
- Poderia ter 2 grupos com final entre os campeões (mais realista)
- **Impacto:** Torna a Série C mais interessante e variada

### 3. Classificação Detalhada com Critérios de Desempate
- Mostrar vitórias, saldo de gols, gols pró, confronto direto
- Ordenar corretamente usando todos os critérios (não só pontos)
- **Impacto:** Mais realismo, menos empates "estranhos" na tabela

### 4. Filtro de Jogadores no TimesTab
- Buscar por nome
- Filtrar por posição (GOL, ZAG, LD, etc.)
- Ordenar por overall/gols/média (já tem mas poderia melhorar)
- **Impacto:** Facilita encontrar quem você quer

### 5. Salvar/Exportar Jogo
- Botão de "Salvar" nomeado (não só autosave)
- Exportar save como arquivo `.json` para backup/compartilhar
- **Impacto:** Segurança e compartilhamento

### 6. ⭐ Indicador de "Jogador Revelação" na Temporada
- Destacar visualmente jogadores Sub-21 com overall > 70
- Badge "🌟 Revelação" ao lado do nome no TimesTab e nas estatísticas
- **Impacto:** Facilita identificar jovens promessas

### 7. ⭐ Botão "Simular até o fim do campeonato" na tela de Classificação
- Atalho direto na aba de classificação sem precisar ir em Rodadas
- **Impacto:** Reduz clique desnecessário

### 8. ⭐ Mostrar Sequência de Invicto / Vitórias Consecutivas
- Adicionar coluna na classificação: "Invicto há X jogos" ou "Vitórias consecutivas"
- **Impacto:** Cria narrativa de "time embalado"

### 9. ⭐ Tooltip com detalhes do time ao passar mouse no nome
- Ao passar mouse sobre o nome do time na tabela, mostrar: overall médio, artilheiro
- **Impacto:** Informação rápida sem precisar abrir perfil

### 10. ⭐ Resumo Rápido da Rodada Anterior
- Após simular rodada, mostrar notificação com: "Rodada X: 15 gols, 3 viradas"
- **Impacto:** Feedback imediato mais rico que "Rodada simulada!"

### 11. ⭐ Navegação por Teclado (Setas)
- Setas esquerda/direita para navegar entre rodadas
- Enter para simular rodada atual
- **Impacto:** UX mais fluida

### 12. ⭐ Badge de "Novo" nos Jogadores Gerados na Temporada
- Jogadores que acabaram de ser criados (vindos da base) têm badge "🆕" por 1 temporada
- **Impacto:** Identifica rapidamente quem é novo no elenco

### 13. ⭐ Últimos 5 Resultados também para Série B e C
- Hoje só a Série A mostra os últimos 5 jogos (bolinhas V/E/D)
- Adicionar para B e C também
- **Impacto:** Consistência visual entre divisões

### 14. ⭐ Atalho para "Simular Próximo Ano" após concluir temporada
- Botão grande no centro da tela após última rodada
- **Impacto:** Fluxo mais direto (já existe mas pode ser mais proeminente)

### 15. ⭐ Indicador de "Clássico" nos Jogos
- Detectar confrontos entre rivais históricos (Fla-Flu, Gre-Nal, Derby, etc.)
- Mostrar badge "🏆 Clássico!" no card do jogo
- **Impacto:** Emoção e contexto nos confrontos

### 16. ⭐ Contador de "Gols da Rodada" no cabeçalho
- Mostrar total de gols marcados na rodada atual
- Destacar rodadas com muitos gols (média > 3)
- **Impacto:** Informação adicional sem esforço

### 17. ⭐ Botão "Jogar Partida" (simular apenas 1 jogo)
- Opção de simular APENAS um jogo específico, não a rodada inteira
- Clicar no jogo → botão "▶ Jogar" → só aquele jogo é simulado
- **Impacto:** Controle granular de simulação

### 18. ⭐ Gols contra e expulsões nos golsInfo
- Adicionar tipo 'gol contra' e 'cartao vermelho' no GolInfo
- Tornar as partidas mais imprevisíveis e realistas
- **Impacto:** Mais drama e variedade nos jogos

### 19. ⭐ Pênaltis e defesas de pênalti
- Gols de pênalti com indicador "(pên.)" no golsInfo
- Goleiro defendeu pênalti → destaque
- **Impacto:** Detalhe realista

### 20. ⭐ Substituições durante a partida
- Jogadores podem ser substituídos
- Impacto na nota: substituto pode entrar bem ou mal
- **Impacto:** Estratégia de jogo

---

## 🏆 MÉDIO PRAZO (2-3 dias de desenvolvimento cada)

### 21. Geração de Jogadores Mais Realista
- Jogadores da base (revelações) com potencial escondido
- Atributos secundários: finalização, passe, defesa, ritmo
- Scout: times podem descobrir jovens talentos
- **Impacto:** Sensação de "descobrir" um craque

### 22. Lesões e Suspensões
- Jogadores podem se lesionar durante partidas
- Acúmulo de cartões amarelos → suspensão
- Time precisa usar reservas quando titular está fora
- **Impacto:** Estratégia e imprevistos

### 23. Quadro de Honra por Temporada
- Mostrar quem foi artilheiro e líder de assistências de cada ano
- "Artilheiro do Ano 2027", "Melhor Assistente 2027"
- **Impacto:** Cria rivalidades e narrativas

### 24. Gráficos e Estatísticas de Desempenho
- Evolução dos times (pontos por ano)
- Gráfico de desempenho na temporada (sequência de resultados)
- Comparativo "time A vs time B" ao longo dos anos
- **Impacto:** Visual mais rico, fã de futebol ama gráfico

### 25. Maiores Campeões (já começou)
- Ranking de títulos consolidado (históricos + simulados)
- Taça com nome do clube que mais venceu em X anos
- **Impacto:** Incentivo a torcer para seu time crescer

### 26. ⭐ "Jogador do Jogo" (Man of the Match)
- Após cada partida, destacar o melhor jogador em campo
- Mostrar badge "⭐ MVP" no card do jogo
- Acumular estatística de "MVPs" na carreira do jogador
- **Impacto:** Reconhecimento individual, enriquece perfil do jogador

### 27. ⭐ Calendário Completo da Temporada
- View estilo calendário: todos os jogos do mês organizados por data
- Filtro por time para ver "Calendário do Flamengo"
- **Impacto:** Visão macro da temporada

### 28. ⭐ Comparar Dois Jogadores (side-by-side)
- Selecionar dois jogadores e comparar estatísticas lado a lado
- Estatísticas da temporada e da carreira
- **Impacto:** Debate entre torcedores, engajamento

### 29. ⭐ Melhor Time da Década
- Calcular qual time teve melhor desempenho acumulado em blocos de 10 anos
- "Flamengo anos 2030: 4 títulos, 68% de aproveitamento"
- **Impacto:** Contexto histórico de longo prazo

### 30. ⭐ Artilheiro por Time (por temporada)
- Mostrar quem foi o artilheiro de cada time em cada temporada
- "Maior artilheiro do Corinthians na temporada 2028"
- **Impacto:** Dá identidade aos jogadores dentro de cada clube

### 31. ⭐ Média de Público por Time
- Estimar público baseado no tamanho/desempenho do time
- Times grandes com 40k+, times pequenos com 5k+
- Registrar recorde de público do time
- **Impacto:** Imersão, sensação de "grande jogo"

### 32. ⭐ Ranking de Força do Elenco
- Adicionar ranking "Força do Elenco" ao lado da classificação
- Mostrar overall médio dos 11 titulares de cada time
- **Impacto:** Contexto extra: "time com melhor elenco vs classificação real"

### 33. ⭐ Evolução do Overall do Jogador ao Longo do Tempo
- Gráfico de linha mostrando overall do jogador ano a ano
- Ver pico de carreira, declínio com idade
- **Impacto:** Visualização clara da trajetória

### 34. ⭐ "Clube do Coração" (favoritar um time)
- Marcar um time como favorito com ⭐
- Time favorito aparece destacado em todas as telas
- Notificações específicas: "Seu time venceu!", "Seu time contratou..."
- **Impacto:** Engajamento emocional imediato

### 35. ⭐ Estatísticas Head-to-Head (confronto direto)
- Ao clicar em dois times, mostrar histórico de confrontos
- "Flamengo 12 vitórias, Palmeiras 8 vitórias, 5 empates"
- Últimos 5 confrontos
- **Impacto:** Rivalidade, contexto histórico

### 36. ⭐ Média de Gols por Jogo na Temporada
- Mostrar estatística agregada da temporada: "Média de 2.7 gols/jogo"
- **Impacto:** Visão geral da competitividade

### 37. ⭐ Ranking de Goleiros
- Estatísticas específicas para goleiros: gols sofridos, clean sheets
- "Melhor goleiro da temporada" baseado em clean sheets
- **Impacto:** Valoriza posição de goleiro que hoje é invisível

### 38. ⭐ Artilheiro Mais Jovem e Mais Velho da História
- Recordes: "Jogador mais jovem a marcar" (17 anos), "Mais velho" (39 anos)
- Registrar quando um jogador quebra o recorde
- **Impacto:** Cria narrativas históricas

---

## 🚀 LONGO PRAZO (features mais complexas, 1-2 semanas)

### 39. Modo "Torcedor" / Seguir um Time
- Você escolhe um time no início
- Notificações: "Seu time contratou...", "Seu time foi rebaixado!"
- Visão focada no seu time (jogos, notícias, desempenho)
- **Impacto:** Engajamento emocional

### 40. Sistema de Táticas
- Escolher formação (4-4-2, 4-3-3, 3-5-2, etc.)
- Definir estilo de jogo (ofensivo, defensivo, contra-ataque)
- Escalar jogador por posição (não só automático)
- **Impacto:** Profundidade tática real

### 41. Modo Multiplayer (mesmo PC)
- Dois jogadores escolhem times diferentes
- Um avança rodada, o outro vê o resultado
- Disputa de quem faz mais pontos ao longo de X anos
- **Impacto:** Diversão compartilhada

### 42. Narrativa / Storytelling
- "Jogador X fez 500 gols na carreira!"
- "Time Y quebrou recorde de invencibilidade"
- "Clássico entre Z e W terminou com briga"
- Notícias falsas geradas pelo sistema
- **Impacto:** Imersão, graça de compartilhar

### 43. Modo "Desafio"
- Cenários pré-definidos: "Salve o time do rebaixamento em 5 rodadas"
- "Leve um time da Série C à Libertadores em 10 anos"
- **Impacto:** Replayability, objetivos claros

### 44. ⭐ Copa do Brasil
- Torneio de mata-mata paralelo durante a temporada
- Times de todas as séries (A, B, C)
- Sorteio de chaves, jogos de ida e volta
- **Impacto:** Outra competição, mais variedade

### 45. ⭐ Libertadores e Sul-Americana
- Times bem colocados na Série A vão para Libertadores/Sul-Americana
- Simulação de torneio continental (formato simplificado: grupos + mata)
- Ranking de títulos internacionais
- **Impacto:** Dimensão continental, status de "campeão da América"

### 46. ⭐ Estádios e Capacidade
- Cada time ter um estádio com nome e capacidade
- Fator "casa" mais forte para times com estádio grande e cheio
- Recorde de público, média de público
- **Impacto:** Realismo, fator casa mais significativo

### 47. ⭐ Finanças dos Times
- Cada time ter orçamento anual
- Receita: patrocínios, bilheteria, vendas de jogadores, premiações
- Despesas: salários, contratações, categorias de base
- Times que gastam mal podem passar por crise financeira
- **Impacto:** Camada estratégica profunda, restrição orçamentária

### 48. ⭐ Jogadores Estrangeiros
- Gerar jogadores com nomes de outros países (argentinos, uruguaios, etc.)
- Limite de estrangeiros por time (como no BR real)
- **Impacto:** Mais variedade de nomes, realismo

### 49. ⭐ Categorias de Base (Sub-20, Sub-17)
- Times terem times B com jovens
- Promover jogadores da base ao time principal
- Copas de base paralelas
- **Impacto:** Ciclo completo de formação de jogadores

### 50. ⭐ Troca de Técnico
- Técnico com atributos (formação preferida, estilo)
- Time mal na tabela pode demitir técnico
- Novo técnico pode mudar formação e desempenho
- **Impacto:** Mais realismo, reviravoltas na temporada

### 51. ⭐ Eleições Presidenciais nos Clubes
- A cada 3-4 anos, eleição no clube
- Novo presidente pode mudar investimento, contratar técnico
- **Impacto:** Imprevisibilidade fora de campo

### 52. ⭐ Draft de Jogadores (similar NBA)
- Times piores escolhem primeiro
- Novos jogadores entram no jogo via draft anual
- **Impacto:** Mecanismo justo de distribuição de talentos

### 53. ⭐ Torneio de Verão / Pré-Temporada
- Torneios amistosos antes do início do campeonato
- Testar formações, dar ritmo a jogadores
- Pequeno impacto no moral/condicionamento
- **Impacto:** Aquecimento para a temporada

### 54. ⭐ Nacionalidade e Convocação para Seleção
- Cada jogador ter nacionalidade
- Seleção Brasileira convoca melhores jogadores
- Jogadores podem perder jogos do clube por convocação
- **Impacto:** Realismo máximo, dimensão internacional

### 55. ⭐ Campeonatos Estaduais
- Torneio curto no início do ano (formato simplificado)
- Times divididos por estado (SP, RJ, MG, RS, etc.)
- Campeão estadual ganha bônus de moral
- **Impacto:** Tradição do futebol brasileiro

### 56. ⭐ Supercopa do Brasil
- Jogo entre campeão da Série A e campeão da Copa do Brasil
- Taça de prata, prestígio
- **Impacto:** Fechamento do calendário

---

## 🎨 MELHORIAS VISUAIS (baixo esforço, alto impacto)

| # | Feature | Descrição | Esforço |
|---|---------|-----------|---------|
| 57 | Tema escuro/claro | Alternância com botão | 2h |
| 58 | Animações nos resultados | Gols aparecendo com efeito tipo "GOL!" | 3h |
| 59 | Responsivo mobile | Já tem algo, mas dá pra melhorar muito | 4h |
| 60 | Escudo dos times | Ícones maiores, mais visíveis | 1h |
| 61 | ⭐ Efeito sonoro | "Gol!" ao simular partida (opcional) | 2h |
| 62 | ⭐ Bandeirinha do time na classificação | Bandeira/escudo + nome, mais vistoso | 1h |
| 63 | ⭐ Cards de jogo com gradiente das cores dos times | Fundo gradiente com as cores dos dois times | 2h |
| 64 | ⭐ Modo "Compacto" para tabela | Esconder colunas menos relevantes | 1h |
| 65 | ⭐ Transição suave entre abas | Fade in/out ao trocar de aba | 1h |
| 66 | ⭐ Mapa do Brasil com times | Visual geográfico dos times na Série A | 6h |
| 67 | ⭐ Avatar de jogador (posição + cor do time) | Avatares simples baseados em posição | 4h |
| 68 | ⭐ Emoji de "tempo" nos cards | ☀️ 🌧️ 🌙 (só estético) | 2h |
| 69 | ⭐ Tabela com sticky header | Cabeçalho fixo ao rolar a tabela | 1h |
| 70 | ⭐ Campo de jogo animado no card | Visual de gramado no card da partida | 3h |
| 71 | ⭐ Badge de "casa" e "fora" nos jogos | Indicar visualmente quem manda o jogo | 1h |

---

## 💡 IDEIAS CRIATIVAS (fora da caixa)

| # | Ideia | Descrição |
|---|-------|-----------|
| 72 | **"E se..."** | Botão que gera um cenário alternativo (e se Pelé jogasse hoje?) |
| 73 | **Mural de Recordes** | Maior goleada, maior artilheiro, maior sequência de vitórias |
| 74 | **Eleição do Craque do Ano** | Não só Bola de Ouro, mas votação popular |
| 75 | **Geração de Nomes Brasileiros** | Usar nomes reais de jogadores da base |
| 76 | ⭐ **Simulação "Ao Vivo"** | Ver gols um por um ("aos 23' João Pedro abre o placar!") |
| 77 | ⭐ **Jornal de Esportes** | Fim de temporada gera "jornal" com manchetes |
| 78 | ⭐ **Mercado de Apostas** | Odds para cada partida, palpites |
| 79 | ⭐ **Fantasy Game integrado** | Monte seu time com jogadores reais do save |
| 80 | ⭐ **"Onde eles estão agora?"** | Perfil de jogadores aposentados |
| 81 | ⭐ **Linha do Tempo Interativa** | Timeline scrollável com eventos importantes |
| 82 | ⭐ **Geração de Memes** | "Time X perdeu 5 seguidos" → meme automático |
| 83 | ⭐ **Narrador Automático** | Texto narrando os lances principais da rodada |

---

## 🛠️ MELHORIAS TÉCNICAS (refatoração, performance, arquitetura)

| # | Feature | Descrição | Impacto |
|---|---------|-----------|---------|
| 84 | ⭐ **Migração Total para IndexedDB** | Remover dependência de localStorage | Performance |
| 85 | ⭐ **Web Workers para Simulação** | Rodar simulação em background thread | Performance |
| 86 | ⭐ **Compressão de Dados** | Compactar dados antes de salvar no DB | Economia |
| 87 | ⭐ **PWA (Service Worker)** | Jogo funciona offline, instalável | Acessibilidade |
| 88 | ⭐ **Testes Unitários (Vitest)** | Testar funções de simulação | Confiabilidade |
| 89 | ⭐ **Modo Debug** | Logar cada passo da simulação | Desenvolvimento |
| 90 | ⭐ **Validação de Save** | Verificar integridade do save ao carregar | Robustez |
| 91 | ⭐ **Modularizar gameLogic.ts** | Quebrar em match, season, player, awards | Manutenibilidade |
| 92 | ⭐ **Internacionalização (i18n)** | Suporte a inglês, espanhol | Alcance |
| 93 | ⭐ **Tema Customizável** | Usuário escolher paleta de cores | Personalização |
| 94 | ⭐ **Lazy Loading de Anos Antigos** | Carregar do DB apenas quando necessário | Performance |
| 95 | ⭐ **Virtual Scrolling (jogadores)** | Renderizar apenas jogadores visíveis | Performance |

---

## 📊 DADOS E CONTEÚDO (enriquecer o universo)

| # | Feature | Descrição |
|---|---------|-----------|
| 96 | ⭐ **Mais Posições** | PON, SA, MD/ME (meia direita/esquerda) |
| 97 | ⭐ **Mascotes dos Times** | Urubu, Porco, Leão, etc. |
| 98 | ⭐ **Hinos dos Times** | Link para letra do hino |
| 99 | ⭐ **Rivalidades Regionais** | Clássicos estaduais mapeados |
| 100 | ⭐ **Torcidas Organizadas** | Nome, tamanho e influência |
| 101 | ⭐ **Patrocinadores** | Patrocínio muda conforme desempenho |
| 102 | ⭐ **Apelidos dos Times** | "Mengão", "Verdão", "Peixe" |
| 103 | ⭐ **Ídolos por Time** | Lista de ídolos históricos (reais + simulados) |

---

## ♻️ CICLO DE JOGO / GAMEPLAY

| # | Feature | Descrição |
|---|---------|-----------|
| 104 | ⭐ **Conquistas / Achievements** | "Venceu 10 títulos", "Descobriu um craque" |
| 105 | ⭐ **Hall da Fama** | Jogadores com GOAT Index > 1000 |
| 106 | ⭐ **Nível de Dificuldade** | Fácil / Normal / Difícil |
| 107 | ⭐ **Modo "Caos Total"** | 100% aleatório |
| 108 | ⭐ **Reset Parcial** | Resetar times mas manter histórico |
| 109 | ⭐ **Auto-play Inteligente** | Para em clássicos e finais |
| 110 | ⭐ **Notificações** | "Seu time está a 2 pontos do líder!" |
| 111 | ⭐ **Múltiplos Slots de Save** | Slot 1, Slot 2, etc. |
| 112 | ⭐ **Backup Automático** | Antes de sobrescrever save |

---

## 🔄 INTEGRAÇÕES

| # | Feature | Descrição |
|---|---------|-----------|
| 113 | ⭐ **Importar Times Reais** | Baixar elenco real de API pública |
| 114 | ⭐ **Compartilhar Temporada** | Gerar imagem PNG do resumo |
| 115 | ⭐ **Replay de Temporada** | Ver temporada passada rodada por rodada |
| 116 | ⭐ **Exportar CSV** | Baixar dados para análise externa |

---

## 🔧 PEQUENAS CORREÇÕES / BUGS CONHECIDOS

| # | Problema | Solução |
|---|----------|---------|
| 117 | ⚠️ Série C não salva na SimulacaoModal | Adicionar resultadoC._estado |
| 118 | ⚠️ PlayerProfileModal com ID não carrega DB | Unificar lógica de carregamento |
| 119 | ⚠️ Save migration não existe | Script para migrar championships do LS para DB |
| 120 | ⚠️ useGame.ts vazio | Remover ou implementar |
| 121 | ⚠️ gameLogic.ts como .bak | Renomear para .ts |
| 122 | ⚠️ GolsInfo em anos antigos causa lentidão | Remover antes de salvar |

---

## 🥇 RECOMENDAÇÃO TOP 10 para implementar primeiro

| # | Feature | Categoria | Esforço | Impacto |
|---|---------|-----------|---------|---------|
| 1 | **🔁 Mercado de Transferências** | Core gameplay | ★★★ | 🔥🔥🔥🔥🔥 |
| 2 | **📊 Filtro e Busca de Jogadores** | UX | ★ | 🔥🔥🔥🔥 |
| 3 | **🏅 Quadro de Honra por Temporada** | Histórico | ★★ | 🔥🔥🔥🔥 |
| 4 | **⭐ Jogador do Jogo (MVP)** | Estatística | ★★ | 🔥🔥🔥 |
| 5 | **⭐ Calendário da Temporada** | Visual | ★★ | 🔥🔥🔥 |
| 6 | **⭐ Indicador de "Clássico"** | UX | ★ | 🔥🔥🔥 |
| 7 | **⭐ Clube do Coração (favoritar)** | Engajamento | ★ | 🔥🔥🔥🔥 |
| 8 | **🔄 Critérios de Desempate** | Realismo | ★★ | 🔥🔥🔥 |
| 9 | **⭐ Conquistas / Achievements** | Replayability | ★★★ | 🔥🔥🔥🔥🔥 |
| 10 | **⭐ Mapa do Brasil dos Times** | Visual | ★★★ | 🔥🔥🔥 |

> 💡 **Dica:** Comece pelas 3 primeiras (Mercado, Filtro, Quadro de Honra) que são o "pacote essencial". Depois, Conquistas (Achievements) que dá enorme senso de progressão com esforço moderado.

---

## 📋 LEGENDA

| Símbolo | Significado |
|---------|-------------|
| ⭐ | Ideia NOVA (não estava na lista original) |
| 🎯 | Curto prazo (1-2h) |
| 🏆 | Médio prazo (2-3 dias) |
| 🚀 | Longo prazo (1-2 semanas) |
| 🎨 | Visual |
| 💡 | Criativa |
| 🛠️ | Técnica |

---

## ✅ IMPLEMENTADO RECENTEMENTE

### Versão 2.0 — Modo Carreira / Manager (Maio 2025)

| # | Feature | Status | Arquivos |
|---|---------|--------|----------|
| ✅ | **Schema de Competições Flexível** | Concluído | `src/types/index.ts`, `src/data/competitions.ts` |
| ✅ | **New Game Wizard** | Concluído | `src/components/setup/NewGameWizard.tsx`, `.css` |
| ✅ | **Modo Carreira (Manager)** | Base | `src/App.tsx` (ManagerDashboard + sub-componentes) |
| ✅ | **GameSetup / GameState v2** | Concluído | `src/types/index.ts`, `src/core/gameSetup.ts` |
| ✅ | **Nova aba "Painel"** | Concluído | `src/components/layout/Navigation.tsx` |
| ✅ | **Visão Geral do Time** | Concluído | ManagerDashboard (App.tsx) |
| ✅ | **Calendário do Time** | Concluído | ManagerCalendar (App.tsx) |
| ✅ | **Últimos Jogos do Time** | Concluído | ManagerLastMatches (App.tsx) |
| ✅ | **Estatísticas do Time** | Concluído | ManagerTeamStats (App.tsx) |
| ✅ | **3 modos: Sandbox, Manager, Full-sim** | Concluído | NewGameWizard |
| ✅ | **Compatibilidade retroativa (v1 → v2)** | Concluído | `upgradeToV2()` em `core/gameSetup.ts` |
| ✅ | **Plano de Expansão Documentado** | Concluído | `PLANO_MODO_CARREIRA.md` |

### Próximos Passos Imediatos

| Prioridade | Feature | Esforço | Status |
|-----------|---------|---------|--------|
| 🔴 Crítico | **ManagerDashboard separado** (mover App.tsx → próprio componente) | 2h | ⬜ |
| 🔴 Crítico | **TacticsPanel** — formação, escalação, substituições | 4h | ⬜ |
| 🟡 Alto | **TransferMarket** — comprar/vender jogadores | 8h | ⬜ |
| 🟡 Alto | **Contratos** — salários, duração, renovação | 6h | ⬜ |
| 🟢 Médio | **Jovens da Base (regen)** — surgimento automático | 4h | ⬜ |
| 🟢 Médio | **Competições customizáveis** — importar JSON | 6h | ⬜ |
| 🔵 Baixo | **Módulo financeiro** — orçamento, salários | 8h | ⬜ |
| 🔵 Baixo | **Lesões** — probabilidade e duração | 4h | ⬜ |

