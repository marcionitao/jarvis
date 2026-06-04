# Instruções para Agentes - Projeto Jarvis

> Este ficheiro é lido automaticamente antes de cada sessão de coding.

---

## Stack do projeto

- **React Native** + **Expo** (SDK 55)
- **Expo Router** (roteamento baseado em arquivos em `src/app/`)
- **TypeScript** (com `tsconfig.json` e strict mode)
- **React Native Reanimated** (animações)
- **React Native Gesture Handler** (gestos)
- **Expo Modules** (image, font, symbols, glass-effect, etc.)

---

## Estrutura de pastas (obrigatória)

- `src/app/` → rotas do Expo Router (`_layout.tsx`, `index.tsx`, `explore.tsx`, etc.)
- `src/components/` → componentes reutilizáveis
- `src/constants/` → constantes e configurações
- `src/hooks/` → hooks personalizados
- `src/context/` → Context API (criar quando necessário)
- `src/types/` → definições de tipos TypeScript (criar quando necessário)
- `src/utils/` → funções utilitárias (criar quando necessário)
- `assets/` → imagens e recursos estáticos

---

## Estratégia de edição de ficheiros — CRÍTICO

- Para substituições simples de texto, usa **sempre `bash`/`sed`** em vez da ferramenta `edit`
- Se a ferramenta `edit` falhar **uma vez**, muda imediatamente para `bash`
- Nunca tentes o mesmo `edit` mais de **2 vezes** sem mudar de abordagem
- Para substituições com caracteres especiais (URLs, atributos HTML), usa sempre `bash` desde o início

---

## Confirmação obrigatória antes de aplicar — CRÍTICO

**NUNCA apliques uma edição sem confirmação explícita do utilizador.**

O fluxo obrigatório é:

1. Mostra o diff (antes/depois)
2. Pergunta explicitamente: `"Posso aplicar esta alteração? (sim/não)"`
3. Aguarda resposta
4. Só aplicas se a resposta for afirmativa

---

## Segurança — Regras absolutas

- **NUNCA** hardcodar secrets, API keys, ou tokens — usa sempre `.env` ou Expo secrets
- **NUNCA** logar dados sensíveis (passwords, tokens, informações pessoais)
- Variáveis de ambiente devem ter validação no startup da aplicação

---

## Regras obrigatórias de código

- Sempre use **TypeScript** com type hints completos
- Componentes funcionais com hooks (nunca classes)
- Use `async/await` para chamadas de funções assíncronas
- Imports devem ser agrupados: built-ins → externos → internos → relativos
- Usa interfaces TypeScript em vez de `type` para objectos (excepto unions/intersections)
- Nunca commite dados sensíveis — use `.env` ou Expo secrets
- Mantenha o código limpo: remova `console.log` antes de commit
- Sempre rode `npm run lint` antes de commit
- Siga o padrão de rotas do Expo Router
- Use Context para estado global quando necessário
- Tratamento de erro: sempre mostre feedback amigável ao usuário

---

## Comandos úteis (npm scripts)

- `npm start` → inicia o Metro bundler + QR Code
- `npm run android` → roda no emulador/dispositivo Android
- `npm run ios` → roda no simulador/dispositivo iOS
- `npm run web` → roda no navegador
- `npm run lint` → executa ESLint (via Expo)

---

## Fluxo de trabalho recomendado

1. Crie branch: `feature/nome-da-feature` ou `fix/nome-do-bug`
2. Faça as alterações
3. Rode `npm run lint`
4. Teste no emulador (`npm run android` ou `npm run ios`)
5. Commit claro e faça PR

---

## O que o agente NÃO deve fazer

- Não alterar ficheiros de configuração raiz (`package.json`, `tsconfig.json`, etc.) sem confirmar primeiro
- Não instalar packages sem listar alternativas e impacto
- Não apagar ficheiros — marcar como "candidato a remoção" e aguardar confirmação
- Não assumir que um padrão é "melhor" só porque é mais moderno — respeita as convenções existentes
- Não gerar mais de 1 nível de abstracção não pedido

---

## Estilo de respostas do agente

- Seja direto, técnico e conciso
- **Sempre mostre o diff** das alterações que vai fazer (arquivos e linhas)
- Prefira usar os comandos `npm run ...` em vez de comandos crus
- Pergunte **SEMPRE** antes de alterar qualquer configuração ou ficheiro do projeto
- Ao criar novas telas: use o padrão do Expo Router (`src/app/nova-tela.tsx`)
- Mantenha o UI moderno e intuitivo

---

## Dicas extras

- Consulte `README.md` para funcionalidades do projeto
- Estrutura atual das telas em `src/app/`:
  - `_layout.tsx` - Layout principal
  - `index.tsx` - Tela inicial (Dashboard)
  - `explore.tsx` - Tela de explorar
