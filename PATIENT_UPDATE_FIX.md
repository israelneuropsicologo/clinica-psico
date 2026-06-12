# Correção: Data Persistence Bug em Patient Detail

## Problema Identificado

Quando um usuário editava um paciente no dashboard (PatientDetail.tsx) e **limpava campos opcionais** (como `gender`, `maritalStatus`, `schooling`, `religion`, `occupation`, `referredBy`), esses campos **não eram salvos como vazios/NULL**. Em vez disso, **mantinham seus valores anteriores**.

### Exemplo do Bug:
1. Paciente criado com `gender: "male"`, `occupation: "Engineer"`
2. Usuário abre o formulário de edição e limpa esses campos
3. Usuário clica em "Salvar"
4. ❌ Os campos **não são atualizados** - mantêm os valores antigos

## Causa Raiz

Havia **dois problemas** no endpoint `patients.update` em `server/routers.ts`:

### Problema 1: Schema Zod Rejeitava Strings Vazias
```typescript
// ❌ ANTES - Zod rejeitava "" como inválido
gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
```

Quando o frontend enviava `gender: ""`, o Zod validava como erro porque `""` não é um valor válido do enum.

### Problema 2: Filtro Removia Valores NULL
```typescript
// ❌ ANTES - Removia campos com valor null
if (value !== undefined && value !== null && value !== '') {
  data[key] = value;
}
```

Mesmo que a string vazia fosse convertida para `null`, o filtro a removia do objeto `data`, impedindo que o banco de dados fosse atualizado.

## Solução Implementada

### Mudança 1: Schema Zod Aceita Strings Vazias e Converte para NULL
```typescript
// ✅ DEPOIS - Aceita "" e converte para null
gender: z.enum(["male", "female", "other", "prefer_not_to_say"])
  .optional()
  .or(z.literal(""))
  .transform(v => v === "" ? null : v),

maritalStatus: z.enum(["single", "married", "divorced", "widowed", "stable_union", "other"])
  .optional()
  .or(z.literal(""))
  .transform(v => v === "" ? null : v),

schooling: z.enum(["no_schooling", "elementary", "middle", "high_school", "college", "postgrad"])
  .optional()
  .or(z.literal(""))
  .transform(v => v === "" ? null : v),

religion: z.string().optional().transform(v => v === "" ? null : v),
occupation: z.string().optional().transform(v => v === "" ? null : v),
referredBy: z.string().optional().transform(v => v === "" ? null : v),
```

### Mudança 2: Filtro Permite Valores NULL
```typescript
// ✅ DEPOIS - Permite null para limpar campos
if (value !== undefined && value !== '') {
  data[key] = value;
}
```

Removido o filtro `&& value !== null` para permitir que `null` seja salvo no banco.

## Como Funciona Agora

1. **Frontend envia**: `{ id: 123, gender: "", occupation: "" }`
2. **Zod valida e transforma**: `{ id: 123, gender: null, occupation: null }`
3. **Filtro permite null**: `{ gender: null, occupation: null }` é passado para o banco
4. **Banco atualiza**: `UPDATE patients SET gender = NULL, occupation = NULL WHERE id = 123`
5. ✅ **Resultado**: Campos são limpos com sucesso

## Campos Afetados

A correção foi aplicada aos seguintes campos opcionais:
- `gender` (enum)
- `maritalStatus` (enum)
- `schooling` (enum)
- `religion` (string)
- `occupation` (string)
- `referredBy` (string)

## Testes Recomendados

1. Abrir um paciente existente no dashboard
2. Limpar um ou mais campos opcionais
3. Clicar em "Salvar"
4. Verificar que os campos foram limpos no banco de dados
5. Recarregar a página e confirmar que os campos permanecem vazios

## Arquivos Modificados

- `server/routers.ts` - Linhas 203-208 (schema Zod) e 217-225 (filtro)

## Notas

- A correção é **backward compatible** - campos preenchidos continuam sendo salvos normalmente
- Campos que não são tocados no formulário não são alterados (comportamento correto)
- A conversão de `""` para `null` é feita pelo Zod, não pelo backend
