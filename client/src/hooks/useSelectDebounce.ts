import { useCallback, useRef } from 'react';

/**
 * Hook customizado para proteger Select/Dropdown contra erro de removeChild no Chrome
 * Aplica debounce e verificação de DOM para evitar múltiplas renderizações simultâneas
 */
export function useSelectDebounce(callback: (value: string) => void, delay: number = 50) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastValueRef = useRef<string>('');

  const handleChange = useCallback(
    (value: string) => {
      // Evitar múltiplas chamadas com o mesmo valor
      if (lastValueRef.current === value) {
        return;
      }

      lastValueRef.current = value;

      // Limpar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce: aguardar antes de chamar callback
      timeoutRef.current = setTimeout(() => {
        try {
          // Verificação adicional de segurança
          if (typeof callback === 'function') {
            callback(value);
          }
        } catch (error) {
          console.error('[useSelectDebounce] Erro ao executar callback:', error);
        }
      }, delay);
    },
    [callback, delay]
  );

  // Cleanup ao desmontar
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { handleChange, cleanup };
}

/**
 * Hook para proteger manipulação de DOM contra erro de removeChild
 * Verifica se elemento está conectado ao DOM antes de remover
 */
export function useSafeDOM() {
  const safeRemove = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    try {
      // Verificar se elemento está conectado ao DOM
      if (element.isConnected) {
        element.remove();
      } else {
        console.debug('[useSafeDOM] Elemento já foi removido do DOM');
      }
    } catch (error) {
      console.error('[useSafeDOM] Erro ao remover elemento:', error);
    }
  }, []);

  const safeRemoveChild = useCallback((parent: HTMLElement | null, child: HTMLElement | null) => {
    if (!parent || !child) return;

    try {
      // Verificar se child está conectado e é filho de parent
      if (child.isConnected && parent.contains(child)) {
        parent.removeChild(child);
      } else {
        console.debug('[useSafeDOM] Elemento não é filho ou já foi removido');
      }
    } catch (error) {
      console.error('[useSafeDOM] Erro ao remover filho:', error);
    }
  }, []);

  return { safeRemove, safeRemoveChild };
}

/**
 * Hook para proteger Select contra renderizações múltiplas
 * Combina debounce com proteção de DOM
 */
export function useProtectedSelect(
  onValueChange: (value: string) => void,
  debounceDelay: number = 50
) {
  const { handleChange } = useSelectDebounce(onValueChange, debounceDelay);
  const { safeRemove } = useSafeDOM();

  return {
    handleSelectChange: handleChange,
    safeRemoveElement: safeRemove,
  };
}
