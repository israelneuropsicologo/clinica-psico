import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSelectDebounce } from "@/hooks/useSelectDebounce";

describe("SafeSelect Component Protection", () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should debounce select changes to prevent removeChild errors", () => {
    const callback = vi.fn();
    const { handleChange } = useSelectDebounce(callback, 50);

    // Simular múltiplas mudanças rápidas (como o Chrome faz)
    handleChange("option1");
    handleChange("option2");
    handleChange("option3");

    // Nenhuma chamada ainda (debounce ainda não expirou)
    expect(callback).not.toHaveBeenCalled();

    // Avançar tempo
    vi.advanceTimersByTime(50);

    // Apenas a última mudança deve ser processada
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("option3");
  });

  it("should prevent duplicate calls with same value", () => {
    const callback = vi.fn();
    const { handleChange } = useSelectDebounce(callback, 50);

    handleChange("option1");
    vi.advanceTimersByTime(50);
    expect(callback).toHaveBeenCalledTimes(1);

    // Chamar novamente com o mesmo valor
    handleChange("option1");
    vi.advanceTimersByTime(50);

    // Não deve chamar novamente
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should cancel previous timeout on rapid changes", () => {
    const callback = vi.fn();
    const { handleChange } = useSelectDebounce(callback, 50);

    handleChange("option1");
    vi.advanceTimersByTime(25);

    handleChange("option2");
    vi.advanceTimersByTime(25);

    // Ainda não deve ter chamado (segunda mudança reiniciou o timer)
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);

    // Agora deve chamar com o valor mais recente
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("option2");
  });

  it("should respect custom debounce delay", () => {
    const callback = vi.fn();
    const { handleChange } = useSelectDebounce(callback, 100);

    handleChange("option1");

    vi.advanceTimersByTime(50);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(callback).toHaveBeenCalledWith("option1");
  });

  it("should handle cleanup properly", () => {
    const callback = vi.fn();
    const { handleChange, cleanup } = useSelectDebounce(callback, 50);

    handleChange("option1");
    cleanup();

    vi.advanceTimersByTime(50);

    // Callback não deve ser chamado após cleanup
    expect(callback).not.toHaveBeenCalled();
  });

  it("should handle error in callback gracefully", () => {
    const errorCallback = vi.fn(() => {
      throw new Error("Test error");
    });

    const { handleChange } = useSelectDebounce(errorCallback, 50);

    expect(() => {
      handleChange("option1");
      vi.advanceTimersByTime(50);
    }).not.toThrow();

    expect(errorCallback).toHaveBeenCalled();
  });

  it("should simulate Chrome removeChild error scenario", () => {
    const callback = vi.fn();
    const { handleChange } = useSelectDebounce(callback, 50);

    // Simular o padrão que causa removeChild error no Chrome:
    // Múltiplas mudanças rápidas enquanto o DOM está sendo renderizado
    for (let i = 0; i < 10; i++) {
      handleChange(`option${i}`);
      vi.advanceTimersByTime(5); // Avanços muito pequenos
    }

    // Avançar para processar o debounce final
    vi.advanceTimersByTime(50);

    // Deve ter chamado apenas uma vez com o último valor
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("option9");
  });
});
