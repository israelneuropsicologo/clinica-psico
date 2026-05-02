import { useEffect, useRef, useState } from "react";

type SaveFunction<T> = (data: T) => Promise<void>;

interface UseAutoSaveOptions {
  debounceMs?: number;
  storageKey?: string;
  onError?: (error: Error) => void;
}

export function useAutoSave<T extends Record<string, any>>(
  data: T,
  onSave: SaveFunction<T>,
  options?: UseAutoSaveOptions
) {
  const { debounceMs = 1000, storageKey, onError } = options || {};
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<T>(data);

  // Salvar em localStorage como backup
  useEffect(() => {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (error) {
        console.warn("Failed to save to localStorage:", error);
      }
    }
  }, [data, storageKey]);

  // Autosave com debounce
  useEffect(() => {
    // Se os dados não mudaram, não fazer nada
    if (JSON.stringify(data) === JSON.stringify(lastSavedRef.current)) {
      return;
    }

    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Definir novo timeout para salvar
    timeoutRef.current = setTimeout(async () => {
      try {
        setStatus("saving");
        await onSave(data);
        lastSavedRef.current = data;
        setStatus("saved");

        // Mostrar "saved" por 2 segundos
        setTimeout(() => setStatus("idle"), 2000);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setStatus("error");
        onError?.(err);
        console.error("Autosave failed:", err);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, onSave, debounceMs, onError]);

  // Restaurar dados do localStorage se disponível
  const restoreFromStorage = () => {
    if (storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          return JSON.parse(stored) as T;
        }
      } catch (error) {
        console.warn("Failed to restore from localStorage:", error);
      }
    }
    return null;
  };

  // Limpar localStorage
  const clearStorage = () => {
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn("Failed to clear localStorage:", error);
      }
    }
  };

  return {
    status,
    restoreFromStorage,
    clearStorage,
    isSaving: status === "saving",
    isSaved: status === "saved",
    isError: status === "error",
  };
}
