# Whaticket SaaS

Plataforma SaaS de atendimento via WhatsApp com filas, tickets, campanhas, integrações, chatbot e relatórios. Monorepo com `backend` (Node.js + TypeScript) e `frontend` (React 17 + CRA).

- Repositório público: `https://github.com/alltomatos/whaticket-saa`

## Sumário

- Visão geral e recursos
- Arquitetura e diretórios
- Pré-requisitos
- Variáveis de ambiente
- Execução local (Node)
- Execução via Docker
- Imagens do Docker Hub
- Deploy em Docker Swarm
- Personalização de logos
- Scripts úteis
- Licença

## Visão geral e recursos

- Filas e múltiplos atendentes
- Tickets com histórico, tags e anexos
- Campanhas e listas de contatos
- Mensagens com mídia, áudio, vCards
- Chat interno e prompts por fila
- Integrações e webhooks
- Painéis e relatórios

## Arquitetura e diretórios

- `backend/`: API, serviços, filas e WebSocket
- `frontend/`: SPA React
- `docker/`: arquivos Docker
  - `Dockerfile.backend`
  - `Dockerfile.frontend`
  - `docker-compose-local.yml`
  - `docker-compose-hub.yml`
  - `docker-compose-swarm.yml`
  - `backend-entrypoint.sh`
  - `nginx-frontend.conf`

## Pré-requisitos

- Node.js 20+ e npm
- PostgreSQL (recomendado) ou MySQL via `DB_DIALECT`
- Redis
- Docker e Docker Compose

## Variáveis de ambiente

- Backend (`backend/.env.example`):
  - `BACKEND_URL`, `FRONTEND_URL`, `PORT`
  - `DB_DIALECT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
  - `JWT_SECRET`, `JWT_REFRESH_SECRET`
  - `REDIS_URI`, `REDIS_OPT_LIMITER_MAX`, `REDIS_OPT_LIMITER_DURATION`
  - `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`, `MAIL_SECURE`
  - `GERENCIANET_*` e certificado em `backend/certs/`
  - `SENTRY_DSN` (opcional)
- Frontend (`frontend/.env.example`):
  - `REACT_APP_BACKEND_URL`
  - `REACT_APP_HOURS_CLOSE_TICKETS_AUTO`

Observações:

- `.env` e certificados não devem ser versionados
- `backend/certs/` está ignorado e mantém apenas o placeholder

## Execução local (Node)

Instalação:

```bash
cd backend && npm install
cd ../frontend && npm install
```

Desenvolvimento:

```bash
cd backend && npm run dev
cd ../frontend && npm start
```

Produção:

```bash
cd backend && npm run build && npm start
cd ../frontend && npm run build
```

## Execução via Docker

Compose local (build a partir do código):

```bash
docker compose -f docker/docker-compose-local.yml up -d
```

Compose usando imagens do Hub:

```bash
docker compose -f docker/docker-compose-hub.yml up -d
```

Portas padrão:

- Backend em `8080`
- Frontend em `3000` (mapeado para `80` no container)

## Imagens do Docker Hub

- Backend: `ronaldodavi/whaticket-saas-backend:6.0.0`
- Frontend: `ronaldodavi/whaticket-saas-frontend:6.0.0`

Configurar `REACT_APP_BACKEND_URL` no build do frontend (para domínio público):

```bash
docker build -f docker/Dockerfile.frontend \
  -t seuusuario/whaticket-saas-frontend:6.0.0 \
  --build-arg REACT_APP_BACKEND_URL=https://seu-dominio:8080 .
```

## Deploy em Docker Swarm

Inicialização e deploy:

```bash
docker swarm init
docker stack deploy -c docker/docker-compose-swarm.yml whaticket
```

Verificação e escala:

```bash
docker service ls
docker service ps whaticket_backend
docker service scale whaticket_backend=3
docker service scale whaticket_frontend=3
```

Notas:

- Volumes locais em Swarm residem no nó do serviço
- Para dados persistentes distribuídos, utilize drivers de volume adequados

## Personalização de logos

- Adicione imagens em `backend/public/logotipos/` (ex.: `logo.png`, `login.png`)
- O frontend consome `REACT_APP_BACKEND_URL/public/logotipos/...`

## Scripts úteis

- Backend
  - `npm run dev`
  - `npm run build`
  - `npm start`
  - `npm run db:migrate` e `npm run db:seed`
  - `npm test`
- Frontend
  - `npm start`
  - `npm run build`

## Licença

Licença MIT. Consulte `LICENSE`.

## Atualizações Baileys

- Tutorial completo de atualização do Baileys e requisitos de Node: `./TUTORIAL_ATUALIZACAO_BAILEYS.md`
