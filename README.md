# Querido Dante

Site migrado do Bolt para o Lovable, mantendo o tema visual original e conectado ao Supabase próprio.

## Sincronização

### GitHub

Este projeto ainda **não está conectado** ao repositório `github.com/qrddante/querido-dante`. Para ativar o sync bidirecional:

1. No editor do Lovable, clique no menu **Plus (+)** → **GitHub** → **Connect project**.
2. Autorize o app do Lovable no GitHub.
3. Escolha a conta/organização e selecione o repositório `querido-dante`.
4. Após a conexão, toda alteração feita no Lovable será commitada no GitHub, e alterações feitas no GitHub sincronizam de volta ao Lovable.

> Atenção: o repositório original do Bolt tem uma estrutura diferente (SPA com hash-router) da estrutura atual (TanStack Start). Avalie se deseja substituir o conteúdo do GitHub pela versão Lovable ou manter um branch separado.

### Atualizações já sincronizadas manualmente do GitHub

- **Página Planos (`/planos`)**: trazida do repositório GitHub e integrada ao roteamento do projeto Lovable. A página exibe os planos Free, Dante Plus, Dante Premium e Dante Premium+.
- **Navegação**: item "Planos" adicionado à navbar e botão "Fazer upgrade do plano" no perfil redireciona para `/planos`.

### Supabase

O projeto usa o Supabase próprio do usuário (BYO), configurado com as variáveis:

- `MEU_SUPABASE_URL`
- `MEU_SUPABASE_ANON_KEY`
- `MEU_SUPABASE_SERVICE_KEY`

**Importante:** o Lovable não sincroniza schema, tabelas, RLS, policies ou functions automaticamente no Supabase próprio. Qualquer mudança que envolva o banco de dados precisa ser aplicada manualmente no painel do Supabase ou via migrations próprias.

## Desenvolvimento local

```sh
git clone <url-do-repositorio>
cd querido-dante
npm i
npm run dev
```

## Stack

- TanStack Start
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase JS
- Lucide React
