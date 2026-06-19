# 🔐 Boas Práticas de Foreign Key - Guia de Integridade Referencial

## Problema Identificado

Erro: `Cannot add or update a child row: a foreign key constraint fails`

**Causa:** Tentativa de inserir um registro com um `userId` que não existe na tabela `users`.

---

## ✅ Solução Implementada

### 1. Validação Antes de Inserção

**Antes (❌ Problema):**
```typescript
export async function createApiToken(userId: number, name: string) {
  const result = await db.insert(apiTokens).values({
    userId,  // ❌ Sem validação!
    token,
    name,
  });
}
```

**Depois (✅ Correto):**
```typescript
export async function createApiToken(userId: number, name: string) {
  // PASSO 1: Validar se o userId existe
  const userExists = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userExists.length === 0) {
    throw new Error(`User with id ${userId} does not exist`);
  }

  // PASSO 2: Inserir com segurança
  const result = await db.insert(apiTokens).values({
    userId,
    token,
    name,
  });
}
```

---

## 📋 Checklist para Evitar Erros de Foreign Key

### Ao Criar Tabelas com Foreign Keys

- [ ] Definir `ON DELETE CASCADE` ou `ON DELETE RESTRICT` explicitamente
- [ ] Documentar qual tabela é "pai" e qual é "filha"
- [ ] Criar índices nas colunas de foreign key para performance

### Ao Inserir Dados

- [ ] **SEMPRE** validar que o ID referenciado existe na tabela pai
- [ ] Usar transações para operações que envolvem múltiplas tabelas
- [ ] Retornar erro claro ao usuário se a validação falhar

### Ao Atualizar Dados

- [ ] Validar novo ID antes de atualizar
- [ ] Considerar impacto em registros filhos (CASCADE vs RESTRICT)

### Ao Deletar Dados

- [ ] Verificar se há registros filhos dependentes
- [ ] Usar `ON DELETE CASCADE` apenas se apropriado
- [ ] Considerar soft delete (marcar como inativo) em vez de hard delete

---

## 🔍 Padrão de Validação Reutilizável

```typescript
/**
 * Valida se um ID existe em uma tabela específica
 */
export async function validateForeignKey(
  table: any,
  id: number,
  fieldName: string = "id"
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(table)
    .where(eq(table[fieldName], id))
    .limit(1);

  return result.length > 0;
}

// Uso:
const userExists = await validateForeignKey(users, userId);
if (!userExists) {
  throw new Error(`User with id ${userId} does not exist`);
}
```

---

## 📊 Tabelas com Foreign Keys no Sistema

| Tabela Filha | Campo FK | Tabela Pai | Status |
|---|---|---|---|
| `apiTokens` | `userId` | `users` | ✅ Validado |
| `clinicalNotes` | `userId` | `users` | ⚠️ Verificar |
| `clinicalNotes` | `patientId` | `patients` | ⚠️ Verificar |
| `clinicalNotes` | `sessionId` | `sessions` | ⚠️ Verificar |
| `sessions` | `userId` | `users` | ⚠️ Verificar |
| `sessions` | `patientId` | `patients` | ⚠️ Verificar |
| `documents` | `userId` | `users` | ⚠️ Verificar |
| `documents` | `patientId` | `patients` | ⚠️ Verificar |

---

## 🧪 Testes Recomendados

```typescript
describe("Foreign Key Validation", () => {
  it("deve rejeitar ID inválido", async () => {
    expect(() => createApiToken(999999, "Test"))
      .rejects
      .toThrow("does not exist");
  });

  it("deve aceitar ID válido", async () => {
    const result = await createApiToken(validUserId, "Test");
    expect(result.token).toBeDefined();
  });

  it("deve manter integridade referencial", async () => {
    // Verificar que o registro foi criado com FK válida
    const record = await db.select().from(apiTokens).where(...);
    expect(record[0].userId).toBe(validUserId);
  });
});
```

---

## 🚀 Próximos Passos

1. **Aplicar padrão a todas as operações de inserção** que envolvem foreign keys
2. **Adicionar validação em routers** antes de chamar funções de db
3. **Criar middleware** para validação automática
4. **Adicionar testes** para cada tabela com FK
5. **Documentar constraints** no schema Drizzle

---

## 📞 Referência Rápida

**Erro Comum:**
```
Cannot add or update a child row: a foreign key constraint fails
```

**Solução:**
```typescript
// Sempre valide antes de inserir!
const exists = await validateForeignKey(users, userId);
if (!exists) throw new Error("Invalid userId");
```

---

## 📚 Recursos Adicionais

- [Drizzle ORM - Foreign Keys](https://orm.drizzle.team/docs/relations)
- [MySQL - Foreign Key Constraints](https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html)
- [Best Practices - Referential Integrity](https://en.wikipedia.org/wiki/Referential_integrity)
