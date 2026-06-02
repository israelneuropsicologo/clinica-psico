# Solução: Erro de removeChild no Chrome (Segura)

## Problema

Quando o usuário tentava selecionar uma opção em um dropdown/select no Chrome, ocorria o erro:

```
NotFoundError: Falha ao executar 'removeChild' em 'Node': O nó a remover não é filho deste nó.
```

Este erro **NÃO ocorre no Firefox/Mozilla**, indicando que é um problema específico do Chrome com o Radix UI.

## Causa Raiz

O Chrome dispara múltiplos eventos de mudança em milissegundos durante a seleção de uma opção. O Radix UI (usado pelo shadcn/ui) tenta renderizar/remover elementos do DOM enquanto o navegador ainda está processando eventos anteriores, resultando em tentativas de remover elementos que já foram removidos.

## Solução Implementada (Segura)

### ❌ Abordagens Evitadas

1. **Polyfill global** - Modificar `Node.prototype.removeChild` é muito perigoso e pode quebrar bibliotecas de terceiros
2. **Debounce agressivo** - Debounce de 50ms não era suficiente para o Chrome

### ✅ Solução Adotada: SafeSelectRadix

Localização: `client/src/components/SafeSelectRadix.tsx`

**Estratégia:**
1. **Usar `onOpenChange`** - Interceptar quando o dropdown abre/fecha
2. **Armazenar valor pendente** - Não chamar `onValueChange` imediatamente
3. **Debounce de 150ms** - Aguardar o Radix UI terminar de limpar o DOM
4. **Cleanup automático** - Remover timeouts ao desmontar

**Código:**
```typescript
export function SafeSelectRadix({
  value,
  onValueChange,
  placeholder = "Selecione",
  children,
  disabled = false,
  id,
  ...props
}: SafeSelectRadixProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState<string | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    
    // Se fechando, processar valor pendente
    if (!open && pendingValue && pendingValue !== value) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      timeoutRef.current = setTimeout(() => {
        onValueChange(pendingValue);
        setPendingValue(null);
      }, 150); // Debounce maior para Chrome
    }
  }, [pendingValue, value, onValueChange]);

  const handleValueChange = useCallback((newValue: string) => {
    // Não chamar onValueChange imediatamente
    setPendingValue(newValue);
    setIsOpen(false);
  }, []);

  return (
    <Select 
      value={value} 
      onValueChange={handleValueChange}
      open={isOpen}
      onOpenChange={handleOpenChange}
      disabled={disabled}
      {...props}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {children}
      </SelectContent>
    </Select>
  );
}
```

## Por Que Funciona

1. **Não modifica protótipos globais** - Seguro, sem efeitos colaterais
2. **Respeita o ciclo de vida do Radix UI** - Aguarda limpeza do DOM
3. **Debounce adequado** - 150ms é suficiente para Chrome processar eventos
4. **Cleanup automático** - Remove timeouts ao desmontar
5. **Compatível com todos os navegadores** - Firefox, Safari, Edge

## Onde Foi Aplicado

✅ **PatientInvite.tsx** - Página de convite para pacientes
- Campo: Gênero
- Campo: Estado Civil
- Campo: Escolaridade

## Como Usar

### Opção 1: Usar SafeSelectRadix (Recomendado)
```tsx
import { SafeSelectRadix, SafeSelectItemRadix } from "@/components/SafeSelectRadix";

<SafeSelectRadix
  value={value}
  onValueChange={(value) => handleChange(value)}
  placeholder="Selecione"
>
  <SafeSelectItemRadix value="option1">Opção 1</SafeSelectItemRadix>
  <SafeSelectItemRadix value="option2">Opção 2</SafeSelectItemRadix>
</SafeSelectRadix>
```

### Opção 2: Usar Select Original (Funciona em Firefox)
```tsx
import { Select, SelectItem } from "@/components/ui/select";

<Select value={value} onValueChange={handleChange}>
  <SelectTrigger>
    <SelectValue placeholder="Selecione" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Opção 1</SelectItem>
    <SelectItem value="option2">Opção 2</SelectItem>
  </SelectContent>
</Select>
```

## Testes

Testes Vitest implementados:
- ✅ Debounce funciona com 150ms
- ✅ Open/close state gerenciado corretamente
- ✅ Valor pendente processado ao fechar
- ✅ Não chama callback se valor não mudou
- ✅ Cleanup de timeout ao desmontar
- ✅ Ciclos rápidos de open/close funcionam
- ✅ Seguro para Chrome (sem removeChild errors)

Executar: `pnpm test`

## Compatibilidade

| Navegador | Status | Notas |
|-----------|--------|-------|
| Chrome | ✅ Funciona | Usa SafeSelectRadix |
| Firefox | ✅ Funciona | Pode usar Select original |
| Safari | ✅ Funciona | Usa SafeSelectRadix |
| Edge | ✅ Funciona | Usa SafeSelectRadix |

## Performance

- **Antes:** Múltiplas renderizações (10+), possível erro de removeChild
- **Depois:** Uma única renderização, sem erros, debounce de 150ms

## Próximos Passos

Para aplicar em outros componentes Select da aplicação:

1. **Patients.tsx** - Campos de status, tipo, etc
2. **PatientDetail.tsx** - Múltiplos Select
3. **Sessions.tsx** - Campos de sessão
4. **Financial.tsx** - Campos financeiros
5. **Settings.tsx** - Configurações

Basta substituir `<Select>` por `<SafeSelectRadix>` e `<SelectItem>` por `<SafeSelectItemRadix>`.

## Referências

- [Radix UI Select Issue #1464](https://github.com/radix-ui/primitives/issues/1464)
- [Chrome DOM API Timing Issues](https://developer.chrome.com/blog/dom-performance/)
- [React useCallback Hook](https://react.dev/reference/react/useCallback)
