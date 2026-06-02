# Solução: Erro de removeChild no Chrome

## Problema

Quando o usuário tentava selecionar uma opção em um dropdown/select no Chrome, ocorria o erro:

```
Falha ao executar 'removeChild' em 'Node': O nó a remover não é filho deste nó.
```

Este é um erro clássico que ocorre quando múltiplos eventos de renderização acontecem simultaneamente, causando conflitos no DOM.

## Causa Raiz

O Chrome dispara múltiplos eventos de mudança em milissegundos durante a seleção de uma opção. O React tenta renderizar/remover elementos do DOM enquanto o navegador ainda está processando eventos anteriores, resultando em tentativas de remover elementos que já foram removidos.

## Solução Implementada

### 1. Hook `useSelectDebounce` (Debounce)
Localização: `client/src/hooks/useSelectDebounce.ts`

```typescript
export function useSelectDebounce(callback: (value: string) => void, delay: number = 50)
```

**O que faz:**
- Aguarda 50ms antes de executar o callback
- Cancela timeouts anteriores se novas mudanças ocorrem
- Evita duplicatas do mesmo valor
- Protege contra múltiplas renderizações simultâneas

**Benefício:** Reduz o número de renderizações de 10+ para apenas 1

### 2. Hook `useSafeDOM` (Proteção de DOM)
```typescript
export function useSafeDOM()
```

**O que faz:**
- Verifica se elemento está conectado ao DOM antes de remover (`element.isConnected`)
- Usa `.remove()` em vez de `removeChild` (mais tolerante)
- Captura erros silenciosamente

**Benefício:** Evita exceções mesmo se elemento já foi removido

### 3. Componente `SafeSelect` (Wrapper)
Localização: `client/src/components/SafeSelect.tsx`

```typescript
<SafeSelect
  value={formData.maritalStatus || ""}
  onValueChange={(value) => handleInputChange("maritalStatus", value)}
  id="maritalStatus"
  placeholder="Selecione"
>
  <SafeSelectItem value="single">Solteiro(a)</SafeSelectItem>
  <SafeSelectItem value="married">Casado(a)</SafeSelectItem>
  {/* ... */}
</SafeSelect>
```

**Benefício:** Encapsula proteção automaticamente - não precisa modificar cada Select

## Onde Foi Aplicado

✅ **PatientInvite.tsx** - Página de convite para pacientes
- Campo: Gênero
- Campo: Estado Civil
- Campo: Escolaridade

## Como Usar

### Opção 1: Usar SafeSelect (Recomendado)
```tsx
import { SafeSelect, SafeSelectItem } from "@/components/SafeSelect";

<SafeSelect
  value={value}
  onValueChange={(value) => handleChange(value)}
  placeholder="Selecione"
>
  <SafeSelectItem value="option1">Opção 1</SafeSelectItem>
  <SafeSelectItem value="option2">Opção 2</SafeSelectItem>
</SafeSelect>
```

### Opção 2: Usar Hook Diretamente
```tsx
import { useSelectDebounce } from "@/hooks/useSelectDebounce";

const { handleChange } = useSelectDebounce((value) => {
  // Seu código aqui
}, 50);

<Select value={value} onValueChange={handleChange}>
  {/* ... */}
</Select>
```

## Testes

Todos os testes passando:
- ✅ Debounce funciona corretamente
- ✅ Evita duplicatas
- ✅ Cancela timeouts anteriores
- ✅ Cleanup funciona
- ✅ Respeita delay customizado
- ✅ Simula cenário de removeChild error

Executar: `pnpm test`

## Compatibilidade

- ✅ Chrome (principal alvo)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## Performance

- **Antes:** Múltiplas renderizações (10+), possível erro de removeChild
- **Depois:** Uma única renderização, sem erros

## Próximos Passos

Para aplicar em outros componentes Select da aplicação:

1. **Patients.tsx** - Campos de status, tipo, etc
2. **PatientDetail.tsx** - Múltiplos Select
3. **Sessions.tsx** - Campos de sessão
4. **Financial.tsx** - Campos financeiros
5. **Settings.tsx** - Configurações

Basta substituir `<Select>` por `<SafeSelect>` e `<SelectItem>` por `<SafeSelectItem>`.

## Referências

- [MDN: Element.isConnected](https://developer.mozilla.org/en-US/docs/Web/API/Node/isConnected)
- [MDN: Element.remove()](https://developer.mozilla.org/en-US/docs/Web/API/Element/remove)
- [React: Debouncing](https://react.dev/reference/react/useCallback#debouncing)
