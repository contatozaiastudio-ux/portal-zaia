# Portal de Aprovação de Conteúdo — ZAIA Studio

Next.js + Tailwind + Supabase. Ver [briefing original](../../Downloads/briefing-claude-code-portal-sbc.md) para a especificação completa.

## Setup

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No SQL editor do projeto, rode nessa ordem:
   - `supabase/schema.sql`
   - `supabase/seed.sql` (dados de exemplo do cliente piloto SBC)
3. Copie `.env.local.example` para `.env.local` e preencha com os valores de
   **Project Settings → API** do seu projeto Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (nunca exponha esse valor no cliente)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (público, usado só para upload direto de mídia)
4. `npm install && npm run dev`

## Acesso

- **Cliente:** `/[slug]?t=[access_token]` — link único por cliente, sem login.
  O `slug` e o `access_token` estão na tabela `clients` (gerado automaticamente
  ao inserir um cliente).
- **Equipe ZAIA:** `/admin/[slug]` — sem token nesta fase (ver seção 7 do
  briefing), rota isolada da rota do cliente.

Para pegar o link do cliente piloto depois de rodar o seed:

```sql
select slug, access_token from clients where slug = 'sbc';
```

## Arquitetura

- Sem Supabase Auth / login: todo acesso a tabelas passa pelo servidor
  Next.js usando a `service_role` key (nunca exposta ao browser). RLS está
  habilitado em todas as tabelas sem policies — a chave anon pública não lê
  nem escreve nada.
- Upload de mídia: o browser sobe o arquivo **direto para o Supabase
  Storage** via signed upload URL (gerada pelo servidor), em vez de passar
  pelo corpo da requisição da function serverless da Vercel — isso evita o
  limite de payload da Vercel e viabiliza vídeos de até 200MB (briefing,
  seção 6). Vídeos maiores usam o campo de link externo (Drive/Canva) como
  fallback.

## Deploy

Deploy padrão na Vercel (`vercel.com/new`), com as mesmas variáveis de
ambiente do `.env.local` configuradas no projeto. Domínio próprio
(`portal.zaiastudio.com`) é um ajuste de DNS a ser feito depois, sem
impacto no código (briefing, seção 10).
