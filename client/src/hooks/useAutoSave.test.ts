import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAutoSave } from "./useAutoSave";

describe("useAutoSave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should autosave after delay", async () => {
    const mockSave = vi.fn().mockResolvedValue(undefined);
    const data = { field: "value1" };

    renderHook(() => useAutoSave(mockSave, data, 1000, true));

    expect(mockSave).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(data);
    });
  });

  it("should not save if data hasn't changed", async () => {
    const mockSave = vi.fn().mockResolvedValue(undefined);
    const data = { field: "value1" };

    const { rerender } = renderHook(
      ({ data: d }) => useAutoSave(mockSave, d, 1000, true),
      { initialProps: { data } }
    );

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    // Rerender with same data
    rerender({ data });

    vi.advanceTimersByTime(1000);

    // Should still be 1 call
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it("should not save if disabled", async () => {
    const mockSave = vi.fn().mockResolvedValue(undefined);
    const data = { field: "value1" };

    renderHook(() => useAutoSave(mockSave, data, 1000, false));

    vi.advanceTimersByTime(1000);

    expect(mockSave).not.toHaveBeenCalled();
  });
});
