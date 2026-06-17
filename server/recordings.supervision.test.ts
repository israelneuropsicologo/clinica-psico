import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getDb } from "./db";
import { sessionRecordings, patients } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Recordings - Supervision Generation", () => {
  let db: any;
  let testPatientId: number;
  let testRecordingId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test patient
    const patientResult = await db
      .insert(patients)
      .values({
        userId: 1,
        name: "Test Patient",
        email: "test@example.com",
        phone: "11999999999",
        birthDate: new Date("1990-01-01"),
        status: "active",
        leadSource: "manual",
        createdAt: new Date(),
      });

    testPatientId = patientResult[0]?.insertId || 1;

    // Create a test recording with transcription
    const recordingResult = await db
      .insert(sessionRecordings)
      .values({
        userId: 1,
        patientId: testPatientId,
        fileName: "test-recording.mp3",
        fileKey: "recordings/test-recording.mp3",
        fileUrl: "/manus-storage/test-recording.mp3",
        mimeType: "audio/mpeg",
        fileSize: 1000,
        durationSeconds: 60,
        transcription: "This is a test transcription of a therapy session.",
        transcriptionStatus: "done",
        createdAt: new Date(),
      });

    testRecordingId = recordingResult[0]?.insertId || 1;
  });

  afterAll(async () => {
    if (db) {
      // Clean up test data
      await db
        .delete(sessionRecordings)
        .where(eq(sessionRecordings.id, testRecordingId));
      await db
        .delete(patients)
        .where(eq(patients.id, testPatientId));
    }
  });

  it("should find the latest recording with 'done' status", async () => {
    const recording = await db
      .select()
      .from(sessionRecordings)
      .where(eq(sessionRecordings.patientId, testPatientId))
      .orderBy(desc(sessionRecordings.createdAt))
      .limit(1);

    expect(recording).toHaveLength(1);
    expect(recording[0].transcriptionStatus).toBe("done");
    expect(recording[0].transcription).toBeTruthy();
  });

  it("should have a non-empty transcription", async () => {
    const recording = await db
      .select()
      .from(sessionRecordings)
      .where(eq(sessionRecordings.id, testRecordingId));

    expect(recording[0].transcription).toBeTruthy();
    expect(recording[0].transcription.length).toBeGreaterThan(0);
  });

  it("should be able to update supervision field", async () => {
    const testSupervision = "This is test supervision feedback.";

    await db
      .update(sessionRecordings)
      .set({ supervision: testSupervision })
      .where(eq(sessionRecordings.id, testRecordingId));

    const updated = await db
      .select()
      .from(sessionRecordings)
      .where(eq(sessionRecordings.id, testRecordingId));

    expect(updated[0].supervision).toBe(testSupervision);
  });

  it("should retrieve patient data for context", async () => {
    const patient = await db
      .select()
      .from(patients)
      .where(eq(patients.id, testPatientId));

    expect(patient).toHaveLength(1);
    expect(patient[0].name).toBe("Test Patient");
  });
});
