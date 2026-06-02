import React, { ReactNode, useState, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SafeSelectRadixProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children?: ReactNode;
  disabled?: boolean;
  id?: string;
  [key: string]: any;
}

/**
 * SafeSelectRadix - Componente Select otimizado para Chrome
 * 
 * Estratégia:
 * 1. Usar state local para controlar abertura/fechamento
 * 2. Aumentar debounce para 150ms (mais seguro que 50ms)
 * 3. Usar onOpenChange para interceptar eventos
 * 4. Evitar múltiplas renderizações simultâneas
 */
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
      // Aguardar um pouco para o Radix UI terminar de limpar o DOM
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      timeoutRef.current = setTimeout(() => {
        onValueChange(pendingValue);
        setPendingValue(null);
      }, 150); // Debounce maior para Chrome
    }
  }, [pendingValue, value, onValueChange]);

  const handleValueChange = useCallback((newValue: string) => {
    // Não chamar onValueChange imediatamente
    // Ao invés disso, armazenar e processar quando o dropdown fechar
    setPendingValue(newValue);
    setIsOpen(false);
  }, []);

  // Cleanup ao desmontar
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
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

interface SafeSelectItemProps {
  value: string;
  children?: ReactNode;
  disabled?: boolean;
  [key: string]: any;
}

/**
 * SafeSelectItem - wrapper para SelectItem
 */
export function SafeSelectItemRadix({ value, children, disabled = false, ...props }: SafeSelectItemProps) {
  return (
    <SelectItem value={value} disabled={disabled} {...props}>
      {children}
    </SelectItem>
  );
}
