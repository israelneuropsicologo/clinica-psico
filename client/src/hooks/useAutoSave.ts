import { useEffect, useRef, useCallback } from "react";

export function useAutoSave(
  onSave: (data: any) => Promise<void>,
  data: any,
  delay: number = 1000,
  enabled: boolean = true
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const lastSavedRef = useRef<string>("");

  const dataString = JSON.stringify(data);

  const save = useCallback(async () => {
    if (isSavingRef.current || dataString === lastSavedRef.current) {
      return;
    }

    isSavingRef.current = true;
    try {
      await onSave(data);
      lastSavedRef.current = dataString;
    } catch (error) {
      console.error("Erro ao autosalvar:", error);
    } finally {
      isSavingRef.current = false;
    }
  }, [data, dataString, onSave]);

  useEffect(() => {
    if (!enabled || dataString === lastSavedRef.current) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [dataString, delay, enabled, save]);

  return {
    isSaving: isSavingRef.current,
    saveNow: save,
  };
}
