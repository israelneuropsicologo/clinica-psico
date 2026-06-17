# Instruções para Aplicar Migração de Sincronização Multi-Conta

## Problema Resolvido

Você tinha 2 bancos de dados separados:
- **Conta 1 (israelmengo@gmail.com - site)**: 3 pacientes
- **Conta 2 (israelneuropsicologo@gmail.com - sistema)**: 45 pacientes

## Solução Implementada

Sistema de `user_links` que vincula as duas contas, permitindo compartilhamento automático de dados.

---

## Passo 1: Aplicar Migração SQL

Execute o script Node.js que já está pronto:

```bash
cd /home/ubuntu/clinica-psico
node apply-migration.mjs
```

**O que este script faz:**
- ✅ Cria a tabela `user_links`
- ✅ Adiciona campo `externalCustomerId` aos pacientes (se não existir)
- ✅ Valida que tudo foi criado com sucesso

**Saída esperada:**
```
🔄 Conectando ao banco de dados...
✅ Conectado ao banco de dados
🔄 Aplicando migração 1: externalCustomerId...
ℹ️  Campo externalCustomerId já existe
🔄 Aplicando migração 2: user_links...
✅ Migração 2 aplicada: tabela user_links criada

✅ Todas as migrações aplicadas com sucesso!
```

---

## Passo 2: Vincular as Duas Contas

Após aplicar a migração, execute o script para vincular as contas:

```bash
node link-users.mjs --primary 1 --linked 2
```

**O que este script faz:**
- ✅ Verifica se os usuários existem
- ✅ Cria o vínculo entre as contas
- ✅ Confirma que o vínculo foi criado

**Saída esperada:**
```
🔄 Conectando ao banco de dados...
✅ Conectado ao banco de dados

🔍 Verificando usuários...
✅ Usuário 1 (Primary): israelmengo@gmail.com
✅ Usuário 2 (Linked): israelneuropsicologo@gmail.com

🔄 Vinculando usuários...
✅ Usuários vinculados com sucesso!

✅ Vínculo confirmado:
   ID: 1
   Criado em: 2026-05-02 15:58:00
```

---

## Passo 3: Validar Sincronização

Após vincular as contas, ambas devem ver os mesmos pacientes:

### Via Navegador:

1. **Faça login com a Conta 1** (israelmengo@gmail.com)
   - Vá para "Pacientes"
   - Você deve ver todos os 45 pacientes (3 da conta 1 + 42 da conta 2)

2. **Faça login com a Conta 2** (israelneuropsicologo@gmail.com)
   - Vá para "Pacientes"
   - Você também deve ver todos os 45 pacientes

### Via Testes:

```bash
pnpm test
```

Todos os 60 testes devem passar, incluindo o teste de sincronização multi-conta.

---

## Endpoints Disponíveis

Após aplicar a migração, os seguintes endpoints estarão disponíveis:

### `userSync.linkUsers` (Admin Only)
Vincula dois usuários para compartilhamento de dados.

```typescript
await trpc.userSync.linkUsers.mutate({
  primaryUserId: 1,
  linkedUserId: 2
});
```

### `userSync.getSharedPatients`
Lista todos os pacientes de ambas as contas vinculadas.

```typescript
const patients = await trpc.userSync.getSharedPatients.useQuery({
  search: "João",
  status: "active"
});
```

### `userSync.getSharedPatientById`
Busca um paciente específico compartilhado.

```typescript
const patient = await trpc.userSync.getSharedPatientById.useQuery({
  id: 123
});
```

### `userSync.getSharedSessions`
Lista todas as sessões de ambas as contas vinculadas.

```typescript
const sessions = await trpc.userSync.getSharedSessions.useQuery({
  patientId: 123,
  status: "confirmed"
});
```

---

## Troubleshooting

### Erro: "Table 'user_links' doesn't exist"
```bash
# Execute novamente o script de migração
node apply-migration.mjs
```

### Erro: "FORBIDDEN - Acesso restrito a administradores"
- Apenas admins podem vincular contas via endpoint
- Use o script `link-users.mjs` que não requer autenticação

### Erro: "Um ou ambos os usuários não existem"
```bash
# Verifique quais usuários existem no banco
node -e "
import mysql from 'mysql2/promise';
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [users] = await conn.execute('SELECT id, email FROM users');
console.table(users);
await conn.end();
"
```

### Pacientes não aparecem compartilhados
1. Verifique se as contas foram vinculadas:
```bash
node -e "
import mysql from 'mysql2/promise';
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [links] = await conn.execute('SELECT * FROM user_links');
console.table(links);
await conn.end();
"
```

2. Execute os testes:
```bash
pnpm test
```

---

## Resumo dos Comandos

```bash
# 1. Aplicar migração
node apply-migration.mjs

# 2. Vincular contas
node link-users.mjs --primary 1 --linked 2

# 3. Validar testes
pnpm test

# 4. Verificar vínculo no banco
node -e "
import mysql from 'mysql2/promise';
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [links] = await conn.execute('SELECT * FROM user_links');
console.table(links);
await conn.end();
"
```

---

## Suporte

Se encontrar problemas:
1. Verifique se o arquivo `.env` contém `DATABASE_URL`
2. Certifique-se de que tem permissão de escrita no banco
3. Execute `pnpm test` para validar
4. Verifique os logs em `.manus-logs/`
