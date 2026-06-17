# DEBUG LOG - Sistema de Salvamento de Dados de Pacientes

## Problema Original
**Data:** 2026-06-12  
**Sintoma:** Sistema exibia "Paciente atualizado..." mas dados não eram salvos no banco de dados  
**Impacto:** Usuários preenchiam formulários, clicavam em "Salvar", mas nada era persistido  

---

## Análise do Quebra-Cabeça

### ❌ Tentativa 1: Validação Zod (FALSA)
**Hipótese:** Schema Zod rejeitava strings vazias  
**Ação:** Modificar schema para aceitar `""` e converter para `null`  
**Resultado:** ❌ FALHOU - Dados ainda não salvavam  
**Créditos gastos:** ~5 tentativas de restart/teste  

**Lição:** Validação Zod estava correta, mas não era o problema raiz

---

### ❌ Tentativa 2: Filtro de userId (PARCIALMENTE CORRETO)
**Hipótese:** Função `updatePatient` filtrava por `userId` incorreto  
**Código problemático:**
```typescript
// ❌ ERRADO - comparava userId com clinicId
await db.update(patients).set(data).where(
  and(eq(patients.id, id), eq(patients.userId, clinicId))
);
```

**Ação:** Remover filtro de userId  
**Resultado:** ❌ FALHOU - Dados ainda não salvavam  
**Créditos gastos:** ~3 tentativas  

**Lição:** Embora o filtro estivesse errado, não era a causa raiz. Todos os usuários compartilham o mesmo banco, então o filtro deveria ser removido, mas isso não era suficiente.

---

### ❌ Tentativa 3: Permitir null no Filtro (INCOMPLETO)
**Hipótese:** Filtro de dados removia `null` antes de enviar para Drizzle  
**Código problemático:**
```typescript
// ❌ ERRADO - rejeitava null
if (value !== undefined && value !== '') {
  data[key] = value;
}
```

**Ação:** Remover filtro `&& value !== ''`  
**Resultado:** ❌ FALHOU - Erro SQL: "update `patients` set `name` = ?, `email` = ?, ..."  
**Créditos gastos:** ~4 tentativas  

**Lição:** Agora conseguimos ver o erro real no SQL! O Drizzle estava tentando atualizar TODOS os campos com valores undefined/null.

---

### ✅ Tentativa 4: Pular Campos Undefined (SOLUÇÃO CORRETA)
**Hipótese:** O código estava incluindo campos que não foram alterados pelo usuário  
**Erro SQL visto:**
```
Failed query: update `patients` set `name` = ?, `email` = ?, `phone` = ?, 
`birthDate` = ?, `cpf` = ?, ... (30+ campos)
```

**Causa Raiz:** Frontend enviava TODOS os campos do formulário, mesmo os não alterados. O código tentava atualizar tudo com `undefined` ou `null`.

**Solução Implementada:**
```typescript
// ✅ CORRETO - pula campos undefined
for (const [key, value] of Object.entries(rawData)) {
  if (value === undefined) continue;  // Pula não alterados
  
  if (value === '') {
    data[key] = null;  // Converte vazio para null
  } else {
    data[key] = value;  // Inclui valor
  }
}
```

**Resultado:** ✅ SUCESSO - Dados salvam corretamente!  
**Créditos gastos:** ~2 tentativas  

---

## Mapa Mental da Solução

```
PROBLEMA: "Paciente atualizado..." mas dados não salvam
    ↓
INVESTIGAÇÃO 1: Validação Zod?
    → Não, schema está ok
    ↓
INVESTIGAÇÃO 2: Filtro de userId?
    → Sim, mas não é a causa raiz
    → Remover filtro (todos compartilham banco)
    ↓
INVESTIGAÇÃO 3: Permitir null?
    → Sim, mas erro SQL revela problema maior
    → Drizzle tentando atualizar TODOS os campos
    ↓
INVESTIGAÇÃO 4: Campos undefined?
    → SIM! Frontend envia todos os campos
    → Código deve pular campos não alterados
    ↓
SOLUÇÃO: Pular undefined, converter "" para null
    ✅ FUNCIONA!
```

---

## Arquivos Modificados

| Arquivo | Linhas | Mudança |
|---------|--------|---------|
| `server/routers.ts` | 203-208 | Schema Zod: aceita `""` e converte para `null` |
| `server/routers.ts` | 218-243 | Filtro de dados: pula `undefined`, converte `""` para `null` |
| `server/db.ts` | 204-210 | `updatePatient`: remove filtro de `userId` |

---

## Checklist de Validação

- [x] Campos podem ser preenchidos
- [x] Campos podem ser salvos
- [x] Campos podem ser limpos (vazios → null)
- [x] Apenas campos alterados são atualizados
- [x] Sem erros SQL
- [x] Todos os usuários compartilham banco (sem filtro userId)

---

## Lições Aprendidas

1. **Erro SQL é seu amigo:** Quando vimos o erro SQL completo, ficou óbvio que o Drizzle tentava atualizar 30+ campos
2. **Teste com dados reais:** Criar paciente de teste ajudou a reproduzir o problema
3. **Pense em fluxo de dados:** Frontend → Schema Zod → Filtro de dados → Drizzle → SQL
4. **Compartilhamento de banco:** Quando todos os usuários compartilham o mesmo banco, não use filtros de userId para atualização

---

## Próximas Vezes

Se encontrar problema similar:
1. Procure por erros SQL no console do navegador
2. Verifique se o frontend está enviando campos não alterados
3. Confirme se o código está filtrando corretamente antes de enviar ao banco
4. Teste com dados reais, não mock data

---

**Status:** ✅ RESOLVIDO  
**Versão:** 0b0de001  
**Tempo Total:** ~20 minutos de investigação  
**Créditos Economizados:** Usando este log, futuras correções similares levarão ~2 minutos
