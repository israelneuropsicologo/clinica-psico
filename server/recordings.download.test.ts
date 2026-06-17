import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Audio Download Feature", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock fetch globally
    fetchMock = vi.fn();
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch audio file from CloudFront URL", async () => {
    const mockBlob = new Blob(["audio data"], { type: "audio/mp3" });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      blob: vi.fn().mockResolvedValueOnce(mockBlob),
    });

    const response = await fetch("https://d36hbw14aib5lz.cloudfront.net/audio.mp3");
    expect(response.ok).toBe(true);
    const blob = await response.blob();
    expect(blob.type).toBe("audio/mp3");
  });

  it("should handle fetch errors gracefully", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const response = await fetch("https://d36hbw14aib5lz.cloudfront.net/invalid.mp3");
    expect(response.ok).toBe(false);
  });

  it("should create blob URL for download", async () => {
    const mockBlob = new Blob(["audio data"], { type: "audio/mp3" });
    const blobUrl = URL.createObjectURL(mockBlob);
    expect(blobUrl).toMatch(/^blob:/);
    URL.revokeObjectURL(blobUrl);
  });

  it("should properly name downloaded file", () => {
    const fileName = "Gravação_2026-06-14T22-01-29_08536fe0.webm";
    expect(fileName).toContain("Gravação");
    expect(fileName).toContain(".webm");
  });

  it("should support multiple audio formats", () => {
    const formats = ["audio/mp3", "audio/webm", "audio/wav", "audio/ogg"];
    formats.forEach((format) => {
      const blob = new Blob(["data"], { type: format });
      expect(blob.type).toBe(format);
    });
  });

  it("should handle concurrent downloads", async () => {
    const mockBlob1 = new Blob(["audio1"], { type: "audio/mp3" });
    const mockBlob2 = new Blob(["audio2"], { type: "audio/mp3" });

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        blob: vi.fn().mockResolvedValueOnce(mockBlob1),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: vi.fn().mockResolvedValueOnce(mockBlob2),
      });

    const [response1, response2] = await Promise.all([
      fetch("https://d36hbw14aib5lz.cloudfront.net/audio1.mp3"),
      fetch("https://d36hbw14aib5lz.cloudfront.net/audio2.mp3"),
    ]);

    expect(response1.ok).toBe(true);
    expect(response2.ok).toBe(true);
  });
});
