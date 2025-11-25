# Tutorial de Atualização Baileys 7.x com Node 20 LTS

## ⚠️ ATENÇÃO - Leia Antes de Atualizar

A atualização do Baileys de 6.7.x para 7.0.0 contém **BREAKING CHANGES** significativas. Este tutorial cobre todos os passos necessários para uma atualização segura em produção.

## 📋 Pré-Requisitos

### 1. Requisitos de Sistema
-- ✅ **Node.js 20 LTS** (projeto já atualizado e recomendado para produção)
- ✅ Docker com suporte a multi-stage builds
- ✅ Backup completo do banco de dados
- ✅ Backup das sessões do WhatsApp

### 2. Verificar Versão do Node.js
```bash
node --version
# Deve retornar v20.x.x (LTS)
```

Caso ainda utilize imagem antiga, atualize seu Dockerfile para Node 20:
```dockerfile
FROM node:20-alpine
```

## 🔍 Breaking Changes Principais

### 1. **Sistema LID (Local Identifiers)**
- WhatsApp migrou para LIDs para melhorar privacidade
- **Impacto**: Sessões antigas podem precisar re-autenticação
- **Ação**: Monitorar logs de conexão após atualização

### 2. **Módulos ESM vs CommonJS**
- Baileys 7.x recomenda ESM
- **Impacto**: O código atual usa CommonJS (TypeScript compilado)
- **Ação**: ✅ Compatível - TypeScript compila para CommonJS

### 3. **Protobufs Otimizados**
- Métodos `.fromObject()` removidos
- **Impacto**: Código atual usa `.create()` e `.encode()`
- **Ação**: ✅ Compatível - código já usa métodos corretos

### 4. **Performance**
- ⚠️ Usuários reportaram aumento de CPU em RC6
- **Ação**: Monitorar uso de recursos após atualização

## 📝 Análise de Compatibilidade do Código Atual

### ✅ Código Compatível
O arquivo [`backend/src/libs/wbot.ts`](file:///d:/projetos/install_siwhaticket_saas/backend/src/libs/wbot.ts) está **majoritariamente compatível**:

```typescript
// ✅ Usa fetchLatestBaileysVersion (mantido)
const { version, isLatest } = await fetchLatestBaileysVersion();

// ✅ Usa makeWASocket (mantido)
wsocket = makeWASocket({...});

// ✅ Usa jidNormalizedUser (mantido)
jidNormalizedUser((wsocket as WASocket).user.id)
```

### ⚠️ Pontos de Atenção

1. **`isJidUser` foi removido** - Substituído por `isPnUser`
   - Verificar se é usado em outros arquivos

2. **Eventos de LID**
   - Novo evento `lid-mapping.update` disponível
   - Considerar implementar para melhor suporte

## 🚀 Procedimento de Atualização

### Opção 1: Atualização com Docker (RECOMENDADO)

#### Passo 1: Backup Completo
```bash
# Backup do banco de dados
docker exec whaticket-postgres pg_dump -U whaticket whaticket > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup dos volumes
docker run --rm -v install_siwhaticket_saas_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
docker run --rm -v install_siwhaticket_saas_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis_backup.tar.gz /data
```

#### Passo 2: Verificar versão do Baileys
```json
{
  "@whiskeysockets/baileys": "^7.0.0-rc.9"
}
```
✅ **Já atualizado no projeto**

#### Passo 3: Base de execução (Node 20)
```dockerfile
FROM node:20-alpine
```

#### Passo 4: Rebuild e Deploy
```bash
# Parar containers
docker compose -f docker/docker-compose-local.yml down

# Rebuild (força reconstrução sem cache)
docker compose -f docker/docker-compose-local.yml build --no-cache backend

# Subir dependências e backend (teste)
docker compose -f docker/docker-compose-local.yml up -d postgres redis
sleep 10
docker compose -f docker/docker-compose-local.yml up -d backend

# Monitorar logs
docker compose -f docker/docker-compose-local.yml logs -f backend
```

#### Passo 5: Verificação
```bash
# Verificar se o backend iniciou
docker compose -f docker/docker-compose-local.yml ps

# Verificar logs por erros
docker compose -f docker/docker-compose-local.yml logs backend | grep -i error

# Testar conexão
curl http://localhost:8080/version
```

#### Passo 6: Subir Frontend (se backend OK)
```bash
docker compose -f docker/docker-compose-local.yml up -d frontend
```

### Opção 2: Atualização Sem Docker (Instalação Manual)

#### Passo 1: Backup
```bash
# Backup do banco
pg_dump -U whaticket whaticket > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup do código
tar czf codigo_backup_$(date +%Y%m%d_%H%M%S).tar.gz /home/deploy/
```

#### Passo 2: Atualizar Dependências
```bash
cd /home/deploy/sua_instancia/backend

# Atualizar package.json (já feito)
# "@whiskeysockets/baileys": "^7.0.0-rc.9"

# Limpar node_modules e cache
rm -rf node_modules package-lock.json
npm cache clean --force

# Reinstalar
npm install
```

#### Passo 3: Rebuild
```bash
npm run build
```

#### Passo 4: Restart com PM2
```bash
pm2 stop sua_instancia-backend
pm2 start sua_instancia-backend
pm2 logs sua_instancia-backend
```

## 🔍 Checklist de Verificação Pós-Atualização

### Testes Essenciais
- [ ] Backend iniciou sem erros
- [ ] Frontend carrega corretamente
- [ ] Login funciona
- [ ] Conexões WhatsApp existentes mantidas
- [ ] Novo emparelhamento funciona
- [ ] Envio de mensagens funciona
- [ ] Recebimento de mensagens funciona
- [ ] Grupos funcionam corretamente
- [ ] Mídia (imagens/vídeos) funciona

### Monitoramento (Primeiras 24h)
```bash
# Monitorar CPU/Memória
docker stats

# Monitorar logs de erro
docker-compose logs -f backend | grep -i error

# Monitorar conexões WhatsApp
# Acessar painel admin e verificar status
```

## 🔄 Procedimento de Rollback

### Se algo der errado:

#### Docker
```bash
# Parar tudo
docker compose -f docker/docker-compose-local.yml down

# Restaurar package.json (se necessário)
git checkout backend/package.json
# Ou manualmente: "@whiskeysockets/baileys": "^6.7.18"

# Rebuild
docker compose -f docker/docker-compose-local.yml build --no-cache backend

# Restaurar banco (se necessário)
docker exec -i whaticket-postgres psql -U whaticket whaticket < backup_YYYYMMDD_HHMMSS.sql

# Subir novamente
docker compose -f docker/docker-compose-local.yml up -d
```

#### Manual
```bash
cd /home/deploy/sua_instancia/backend

# Reverter package.json
# "@whiskeysockets/baileys": "^6.7.18"

# Reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build

# Restart
pm2 restart sua_instancia-backend
```

## 📊 Problemas Conhecidos e Soluções

### 1. Erro: "Cannot find module '@whiskeysockets/baileys'"
**Solução**: Limpar cache e reinstalar
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 2. Sessões WhatsApp desconectam após update
**Causa**: Mudança no sistema LID
**Solução**: Re-emparelhar conexões afetadas

### 3. Alto uso de CPU
**Causa**: Migração de LID em background
**Solução**: 
- Monitorar por 24-48h
- Considerar aumentar recursos temporariamente
- Se persistir, reportar issue no GitHub do Baileys

### 4. Erro: "Node version not supported"
**Solução**: Atualizar para Node 20 LTS
```dockerfile
FROM node:20-alpine
```

## 📚 Recursos Adicionais

- [Baileys Migration Guide](https://baileys.wiki/docs/migration/to-v7.0.0)
- [Baileys GitHub Issues](https://github.com/WhiskeySockets/Baileys/issues)
- [Changelog Completo](https://github.com/WhiskeySockets/Baileys/releases)

## ⏱️ Tempo Estimado

- **Preparação e Backup**: 15-30 minutos
- **Atualização**: 10-20 minutos
- **Verificação**: 30-60 minutos
- **Monitoramento**: 24-48 horas

## 🎯 Recomendação Final

1. **Ambiente de Teste**: Se possível, teste primeiro em ambiente de homologação
2. **Horário**: Faça a atualização fora do horário de pico
3. **Equipe**: Tenha alguém de plantão para monitorar
4. **Comunicação**: Avise usuários sobre possível instabilidade
5. **Rollback**: Tenha o plano de rollback pronto antes de começar
