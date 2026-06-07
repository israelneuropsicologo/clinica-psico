import React, { ReactNode } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSelectDebounce } from "@/hooks/useSelectDebounce";

interface SafeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children?: ReactNode;
  disabled?: boolean;
  id?: string;
  debounceDelay?: number;
  [key: string]: any;
}

/**
 * Componente SafeSelect que encapsula Select com proteção contra erro de removeChild no Chrome
 * Usa debounce automático para evitar múltiplas renderizações simultâneas
 */
export function SafeSelect({
  value,
  onValueChange,
  placeholder = "Selecione",
  children,
  disabled = false,
  id,
  debounceDelay = 50,
  ...props
}: SafeSelectProps) {
  const { handleChange } = useSelectDebounce(onValueChange, debounceDelay);

  return (
    <Select value={value} onValueChange={handleChange} disabled={disabled} {...props}>
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
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
 * Componente SafeSelectItem - wrapper para SelectItem
 */
export function SafeSelectItem({ value, children, disabled = false, ...props }: SafeSelectItemProps) {
  return (
    <SelectItem value={value} disabled={disabled} {...props}>
      {children}
    </SelectItem>
  );
}
