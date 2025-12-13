# Football Future

Um projeto de simulação de "universos" de futebol onde você pode criar universos, temporadas, competições e simular partidas com atualização automática de classificação.

## 🚀 Tecnologias

- **React 18** - Biblioteca para construção da interface
- **TypeScript** - Tipagem estática
- **Vite** - Build tool moderna e rápida
- **Dexie.js** - Wrapper para IndexedDB (armazenamento local)
- **Tailwind CSS** - Framework CSS utilitário
- **React Router** - Roteamento
- **PWA** - Progressive Web App (funciona offline e pode ser instalado)

## 📋 Funcionalidades

### Versão 1.0 (Atual)

1. **Home** - Página inicial com navegação para Universos e Clubes
2. **Gerenciamento de Clubes**
   - Listar, criar, editar e deletar clubes
   - Upload de logo (base64)
   - Definir nome, força (0-100) e país
3. **Gerenciamento de Universos**
   - Listar e criar universos
   - Gerenciar temporadas dentro de cada universo
4. **Gerenciamento de Temporadas**
   - Criar, editar e deletar temporadas
   - Ordem cronológica: temporadas só podem ser editadas quando as anteriores estão finalizadas
5. **Gerenciamento de Competições**
   - Criar competições dentro de temporadas
   - Dois tipos: Pontos Corridos e Mata-Mata
   - Status: Configurando, Pronta, Em Andamento, Finalizada
6. **Simulação de Partidas**
   - Geração automática de rodadas
   - Pontos Corridos: todos contra todos (ida e volta espelhado)
   - Mata-Mata: eliminação direta
   - Seletor de rodada
   - Input de placares
   - Atualização automática da tabela de classificação

## 🛠️ Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Execute o projeto em desenvolvimento:
```bash
npm run dev
```

4. Para build de produção:
```bash
npm run build
```

## 📱 Uso

### Criando um Universo

1. Na home, clique em "Universos"
2. Clique em "Novo Universo"
3. Preencha o nome e descrição (opcional)
4. Clique em "Criar"

### Criando Clubes

1. Na home, clique em "Clubes"
2. Clique em "Novo Clube"
3. Preencha nome, país, força (0-100)
4. Opcionalmente, faça upload de uma logo
5. Clique em "Criar"

### Criando Temporadas

1. Entre em um universo
2. Clique em "Nova Temporada"
3. Preencha nome, ano e ordem cronológica
4. Clique em "Criar"

### Criando Competições

1. Entre em uma temporada
2. Clique em "Nova Competição"
3. Escolha o tipo (Pontos Corridos ou Mata-Mata)
4. Selecione os clubes participantes
5. Clique em "Criar"

### Simulando Partidas

1. Entre em uma competição
2. Se a competição estiver "Pronta", clique em "Gerar Rodadas"
3. Selecione a rodada desejada
4. Preencha os placares nos campos de input
5. A tabela de classificação será atualizada automaticamente

## 💾 Armazenamento

Todos os dados são salvos localmente no navegador usando IndexedDB. Isso significa:
- Os dados persistem mesmo após fechar o navegador
- Funciona offline
- Dados são específicos do navegador/dispositivo

## 🎯 Próximas Versões

- Formato de fase de grupos + mata-mata
- Sistema de rebaixamento e promoção automática entre temporadas
- Geração automática de competições da próxima temporada baseada em resultados
- Estatísticas avançadas de jogadores
- Sistema de transferências
- Mais formatos de competição

## 📝 Estrutura do Projeto

```
src/
  ├── db/
  │   └── database.ts          # Configuração do IndexedDB
  ├── pages/
  │   ├── Home.tsx             # Página inicial
  │   ├── Clubes.tsx           # Gerenciamento de clubes
  │   ├── Universos.tsx        # Lista de universos
  │   ├── UniversoDetail.tsx  # Detalhes do universo (temporadas)
  │   ├── TemporadaDetail.tsx # Detalhes da temporada (competições)
  │   └── CompeticaoDetail.tsx # Detalhes da competição (partidas)
  ├── utils/
  │   └── competicao.ts       # Funções de geração de rodadas e classificação
  ├── types/
  │   └── index.ts            # Tipos TypeScript
  ├── App.tsx                 # Rotas principais
  └── main.tsx                # Entry point
```

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

