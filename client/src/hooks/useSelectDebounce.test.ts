import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSelectDebounce, useSafeDOM, useProtectedSelect } from "./useSelectDebounce";

describe("useSelectDebounce", () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  it("should debounce callback execution", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useSelectDebounce(callback, 50));

    act(() => {
      result.current.handleChange("value1");
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(callback).toHaveBeenCalledWith("value1");
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should cancel previous timeout on new call", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useSelectDebounce(callback, 50));

    act(() => {
      result.current.handleChange("value1");
    });

    act(() => {
      vi.advanceTimersByTime(25);
    });

    act(() => {
      result.current.handleChange("value2");
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("value2");
  });

  it("should prevent duplicate calls with same value", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useSelectDebounce(callback, 50));

    act(() => {
      result.current.handleChange("value1");
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(callback).toHaveBeenCalledTimes(1);

    // Chamar novamente com o mesmo valor
    act(() => {
      result.current.handleChange("value1");
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Não deve chamar novamente
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should handle cleanup", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useSelectDebounce(callback, 50));

    act(() => {
      result.current.handleChange("value1");
    });

    act(() => {
      result.current.cleanup();
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Callback não deve ser chamado após cleanup
    expect(callback).not.toHaveBeenCalled();
  });

  it("should respect custom delay", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useSelectDebounce(callback, 100));

    act(() => {
      result.current.handleChange("value1");
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(callback).toHaveBeenCalledWith("value1");
  });
});

describe("useSafeDOM", () => {
  it("should safely remove connected element", () => {
    const { result } = renderHook(() => useSafeDOM());
    const element = document.createElement("div");
    document.body.appendChild(element);

    expect(element.isConnected).toBe(true);

    act(() => {
      result.current.safeRemove(element);
    });

    expect(element.isConnected).toBe(false);
  });

  it("should handle removal of disconnected element", () => {
    const { result } = renderHook(() => useSafeDOM());
    const element = document.createElement("div");

    expect(element.isConnected).toBe(false);

    // Não deve lançar erro
    act(() => {
      result.current.safeRemove(element);
    });

    expect(element.isConnected).toBe(false);
  });

  it("should handle null element", () => {
    const { result } = renderHook(() => useSafeDOM());

    // Não deve lançar erro
    act(() => {
      result.current.safeRemove(null);
    });
  });

  it("should safely remove child element", () => {
    const { result } = renderHook(() => useSafeDOM());
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);
    document.body.appendChild(parent);

    expect(parent.contains(child)).toBe(true);

    act(() => {
      result.current.safeRemoveChild(parent, child);
    });

    expect(parent.contains(child)).toBe(false);
  });

  it("should handle removal of non-child element", () => {
    const { result } = renderHook(() => useSafeDOM());
    const parent = document.createElement("div");
    const notChild = document.createElement("span");

    // Não deve lançar erro
    act(() => {
      result.current.safeRemoveChild(parent, notChild);
    });
  });
});

describe("useProtectedSelect", () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  it("should combine debounce and safe DOM", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useProtectedSelect(callback, 50));

    act(() => {
      result.current.handleSelectChange("value1");
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(callback).toHaveBeenCalledWith("value1");
  });

  it("should provide safeRemoveElement function", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useProtectedSelect(callback));

    expect(result.current.safeRemoveElement).toBeDefined();
    expect(typeof result.current.safeRemoveElement).toBe("function");
  });
});
